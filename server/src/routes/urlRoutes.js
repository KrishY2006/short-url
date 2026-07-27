const express = require("express");
const {
  shortenUrl,
  redirectUrl,
  getUrlStats,
  getAllUrls,
  deleteUrl,
} = require("../controllers/urlController");

const router = express.Router();

// POST /api/shorten - Create a shortened URL
router.post("/shorten", shortenUrl);

// GET / - Fetch all URLs sorted by newest first
router.get("/", getAllUrls);

// GET /stats/:shortCode - Get statistics for a short URL
router.get("/stats/:shortCode", getUrlStats);

// DELETE /:shortCode - Delete a short URL by its code
router.delete("/:shortCode", deleteUrl);

// GET /:shortCode - Redirect to the original URL
router.get("/:shortCode", redirectUrl);

module.exports = router;
