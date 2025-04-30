// Dependency imports
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Initialize app
const app = express();

// Middleware
app.use(cors());

// Serve static files from both root and /public paths
app.use(express.static(path.join(__dirname, "public"))); // Files at /
app.use("/public", express.static(path.join(__dirname, "public"))); // Files at /public

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 3000, // Faster failover (Vercel has short cold starts)
    connectTimeoutMS: 5000, // Initial connection timeout
    socketTimeoutMS: 30000, // Active query timeout
    maxPoolSize: 5, // Reduced for serverless (default 10 is too high)
    retryWrites: true,
    retryReads: true,
    heartbeatFrequencyMS: 10000, // Prevent idle disconnects
    bufferCommands: false, // Fail fast if no connection
  })
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => {
    console.error("MongoDB Connection error:", err);
    process.exit(1);
  });

// Connection events
mongoose.connection.on("connected", () =>
  console.log("Mongoose connected to DB cluster")
);
mongoose.connection.on("error", (err) =>
  console.error("Mongoose connection error:", err)
);

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
