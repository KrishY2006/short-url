const Url = require("../models/Url");

const shortenUrl = async (req, res) => {
  try {
    const { originalUrl } = req.body;

    // Return 400 if originalUrl is missing
    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        error: "Please provide an original URL",
      });
    }

    // Validate that originalUrl is a well-formed HTTP/HTTPS URL
    let parsedUrl;
    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL",
      });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.status(400).json({
        success: false,
        error: "Invalid URL",
      });
    }

    // Check if this URL has already been shortened
    const existing = await Url.findOne({ originalUrl });
    if (existing) {
      return res.status(200).json({
        success: true,
        originalUrl: existing.originalUrl,
        shortCode: existing.shortCode,
        shortUrl: `${process.env.BASE_URL}/${existing.shortCode}`,
      });
    }

    // nanoid v6 is ESM-only, so use dynamic import in CommonJS
    const { nanoid } = await import("nanoid");
    const shortCode = nanoid(6);

    // Create and save the new URL document
    const url = new Url({ originalUrl, shortCode });
    await url.save();

    return res.status(201).json({
      success: true,
      originalUrl,
      shortCode,
      shortUrl: `${process.env.BASE_URL}/${shortCode}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Redirect to the original URL and track the click
const redirectUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find the URL document matching the short code
    const url = await Url.findOne({ shortCode });

    // Return 404 if no matching document exists
    if (!url) {
      return res.status(404).json({
        success: false,
        error: "Short URL not found",
      });
    }

    // Increment click count and persist the change
    url.clicks += 1;
    await url.save();

    // Redirect the user to the original URL
    return res.redirect(url.originalUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Return statistics for a short URL
const getUrlStats = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find the URL document matching the short code
    const url = await Url.findOne({ shortCode });

    // Return 404 if no matching document exists
    if (!url) {
      return res.status(404).json({
        success: false,
        error: "Short URL not found",
      });
    }

    // Return the URL statistics
    return res.status(200).json({
      success: true,
      data: {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        clicks: url.clicks,
        createdAt: url.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Fetch all URL documents, sorted by newest first
const getAllUrls = async (req, res) => {
  try {
    // Query all documents and sort by createdAt in descending order
    const urls = await Url.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: urls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Delete a URL document by its short code
const deleteUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find and delete the matching document
    const deleted = await Url.findOneAndDelete({ shortCode });

    // Return 404 if no matching document exists
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Short URL not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "URL deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

module.exports = { shortenUrl, redirectUrl, getUrlStats, getAllUrls, deleteUrl };
