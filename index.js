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
  consol.error("Mongoose connection error:", err)
);

// --- Express Middleware ---
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
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(503).json({
      error: "Service unavailable",
      message: "Database connection failed",
      retry: true,
    });
  }
});

// // Connect DB
// mongoose
//   .connect(process.env.MONGO_URI, {
//     serverSelectionTimeoutMS: 3000, // Faster failover (Vercel has short cold starts)
//     connectTimeoutMS: 5000, // Initial connection timeout
//     socketTimeoutMS: 30000, // Active query timeout
//     maxPoolSize: 5, // Reduced for serverless (default 10 is too high)
//     retryWrites: true,
//     retryReads: true,
//     heartbeatFrequencyMS: 10000, // Prevent idle disconnects
//     bufferCommands: false, // Fail fast if no connection
//   })
//   .then(() => console.log("MongoDB Connected!"))
//   .catch((err) => {
//     console.error("MongoDB Connection error:", err);
//     process.exit(1);
//   });

// Connection events
// mongoose.connection.on("connected", () =>
//   console.log("Mongoose connected to DB cluster")
// );
// mongoose.connection.on("error", (err) =>
//   console.error("Mongoose connection error:", err)
// );

// Routes
const apiRoutes = require("./routes/api"); // Import routes
app.use("/api", apiRoutes); // All routes in api.js will be prefixed with /api

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Homepage
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Shutdown Handler For development (Ctrl+C)
process.on("SIGINT", async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log("Mongoose disconnected (SIGINT)");
  }
  process.exit(0);
});

// Shutdown Handler For production (Vercel)
process.on("SIGTERM", async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log("Mongoose disconnected (SIGTERM)");
  }
  process.exit(0);
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
