// Dependency imports
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.static("public"));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.error("Connection error:", err));

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

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
