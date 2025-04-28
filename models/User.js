// Database Schema
// User model

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // No duplicate usernames
  },
  log: [
    {
      description: String,
      duration: Number,
      date: {
        type: Date,
        default: Date.now, // Auto set if not provided
      },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
