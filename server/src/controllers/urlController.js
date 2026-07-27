const Url = require("../models/Url");

const shortenUrl = async (req, res) => {
  try {
    const { originalUrl } = req.body;

    // Validate that originalUrl is provided
    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        error: "Please provide an original URL",
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

module.exports = { shortenUrl, redirectUrl };
