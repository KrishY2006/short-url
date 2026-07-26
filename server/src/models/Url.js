const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema({
  // Original long URL to be shortened
  originalUrl: {
    type: String,
    required: true,
    trim: true,
  },
  // Unique identifier for the short URL
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Number of times the short URL has been accessed
  clicks: {
    type: Number,
    default: 0,
  },
  // Timestamp when the URL was created
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Url = mongoose.model("Url", urlSchema);

module.exports = Url;
