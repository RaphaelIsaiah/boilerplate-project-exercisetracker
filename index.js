// Dependency imports
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Initialize app
const app = express();

// 1. Database connection setup (with caching)
let cachedDb = null; // Connection cache for severless

const dbOptions = {
  serverSelectionTimeoutMS: 3000, // Faster failover (Vercel has short cold starts)
  connectTimeoutMS: 5000, // Initial connection timeout
  socketTimeoutMS: 30000, // Active query timeout
  maxPoolSize: 5, // Reduced for serverless (default 10 is too high)
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000, // Prevent idle disconnects
  bufferCommands: false, // Fail fast if no connection in production
};

async function connectToDatabase() {
  if (cachedDb) {
    console.log("Using cached database connection");
    return cachedDb;
  }

  try {
    console.log("Establishing new database connection...");
    const client = await mongoose.connect(process.env.MONGO_URI, dbOptions);
    cachedDb = client.connection;
    return cachedDb;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    throw err;
  }
}

// 2. Connection event handlers
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to DB cluster");
  cachedDb = mongoose.connection; // Update cache
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
  cachedDb = null; // Clear cache
  // Auto-reconnect handled by Mongoose driver
});

mongoose.connection.on("error", (err) =>
  console.error("Mongoose connection error:", err)
);

// 3. Express Middleware
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from both root and /public paths
app.use(express.static(path.join(__dirname, "public"))); // Files at "/"
app.use("/public", express.static(path.join(__dirname, "public"))); // Files at "/public"

// Database connection middleware for API routes
app.use("/api", async (req, res, next) => {
  try {
    // Set up a 3 second timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Connection timeout")), 3000)
    );

    // Race between connection and timeout
    await Promise.race([connectToDatabase(), timeoutPromise]);
    next();
  } catch (err) {
    res.status(503).json({
      error: "Service unavailable",
      message: err.message, // "Connection timeout" or DB error
      retry: true,
    });
  }
});

// 4. Routes
const apiRoutes = require("./routes/api"); // Import routes
app.use("/api", apiRoutes); // All routes in api.js will be prefixed with /api

// Health check endpoint
app.get("/health", (req, res) => {
  const dbStatus = mongoose.STATES[mongoose.connection.readyState];
  res.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// 5. Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);

  // Handle MongoDB connection errors specifically
  if (err.message.includes("initial connection")) {
    return res.status(503).json({
      error: "Database initializing",
      action: "Please retry in 5 seconds",
    });
  }

  // Generic error response
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      details: err.message,
      stack: err.stack,
    }),
  });
});

// 6. Shutdown Handlers
const gracefulShutdown = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log("Mongoose disconnected through shutdown");
  }
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown); // for developement (Ctrl+C)
process.on("SIGTERM", gracefulShutdown); // for production (Vercel)

// 7. Server startup
//  Only start local server if not in vercel environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    server.close(() => process.exit(1));
  });
}

// Export for Vercel serverless
module.exports = app;
