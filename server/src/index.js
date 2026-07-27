require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const urlRoutes = require("./routes/urlRoutes");
const { redirectUrl } = require("./controllers/urlController");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// URL routes
app.use("/api/url", urlRoutes);

// Short URL redirect (clean URL support)
app.get("/:shortCode", redirectUrl);

// Read port from env, default to 4000
const PORT = process.env.PORT || 4000;

// Connect to MongoDB, then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
