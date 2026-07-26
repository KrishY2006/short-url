const express = require("express");
const { shortenUrl } = require("../controllers/urlController");

const router = express.Router();

// POST /api/shorten - Create a shortened URL
router.post("/shorten", shortenUrl);

module.exports = router;
