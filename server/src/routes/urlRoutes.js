const express = require("express");
const { shortenUrl, redirectUrl } = require("../controllers/urlController");

const router = express.Router();

// POST /api/shorten - Create a shortened URL
router.post("/shorten", shortenUrl);

// GET /:shortCode - Redirect to the original URL
router.get("/:shortCode", redirectUrl);

module.exports = router;
