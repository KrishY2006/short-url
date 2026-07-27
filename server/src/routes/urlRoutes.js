const express = require("express");
const { shortenUrl, redirectUrl, getUrlStats } = require("../controllers/urlController");

const router = express.Router();

// POST /api/shorten - Create a shortened URL
router.post("/shorten", shortenUrl);

// GET /stats/:shortCode - Get statistics for a short URL
router.get("/stats/:shortCode", getUrlStats);

// GET /:shortCode - Redirect to the original URL
router.get("/:shortCode", redirectUrl);

module.exports = router;
