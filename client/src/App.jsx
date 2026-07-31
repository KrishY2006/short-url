import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "./api/client";

function App() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState([]);
  const [tableCopyMessage, setTableCopyMessage] = useState("");

  // QR modal state: null when closed, or { shortCode, originalUrl, shortUrl }
  const [qrModal, setQrModal] = useState(null);

  // Ref to the QR canvas element for downloading
  const qrCanvasRef = useRef(null);

  // Handle the shorten button click
  const handleShorten = async () => {
    // Validate that the input is not empty
    if (!originalUrl.trim()) {
      toast.error("Please enter a URL to shorten.");
      return;
    }

    // Disable button and show loading text
    setLoading(true);

    try {
      // Send POST request to the backend
      const response = await api.post("/url/shorten", {
        originalUrl,
        customAlias,
        customDomain,
      });

      // Save the returned short URL into state, preferring displayShortUrl when provided
      setShortUrl(response.data.displayShortUrl || response.data.shortUrl);

      // Extract shortCode from the response
      const { shortCode } = response.data;

      // Fetch analytics for the newly created short URL
      setLoadingStats(true);
      try {
        const statsResponse = await api.get(`/url/stats/${shortCode}`);
        // Store the analytics data in state
        setStats(statsResponse.data.data);
      } catch {
        // Handle stats fetch error
        setStats(null);
      } finally {
        setLoadingStats(false);
      }

      // Refresh the dashboard so the new URL appears in the table
      fetchUrls();

      toast.success("URL shortened successfully!");
    } catch (error) {
      // Show the backend error message, or a fallback
      const message =
        error.response?.data?.error || "Something went wrong.";
      toast.error(message);
    } finally {
      // Re-enable button after request completes (success or failure)
      setLoading(false);
    }
  };

  // Handle the copy button click
  const handleCopy = async () => {
    try {
      // Copy the short URL to the clipboard
      await navigator.clipboard.writeText(shortUrl);
      // Show success message
      setCopyMessage("Copied to clipboard!");
      // Hide the message after 2 seconds
      setTimeout(() => setCopyMessage(""), 2000);
      toast.success("URL copied!");
    } catch {
      // Show error message if copying fails
      setCopyMessage("Failed to copy URL.");
      setTimeout(() => setCopyMessage(""), 2000);
      toast.error("Failed to copy URL.");
    }
  };

  // Copy a short URL from the table to the clipboard
  const handleTableCopy = async (shortCode) => {
    try {
      // Build the full short URL and copy it
      await navigator.clipboard.writeText(
        `http://localhost:4000/${shortCode}`
      );
      // Show "Copied!" feedback
      setTableCopyMessage("Copied!");
      // Hide the message after 2 seconds
      setTimeout(() => setTableCopyMessage(""), 2000);
      toast.success("URL copied!");
    } catch {
      // Silently handle clipboard errors
    }
  };

  // Open the QR modal for a given URL entry
  const handleShowQR = (shortCode, originalUrl) => {
    setQrModal({
      shortCode,
      originalUrl,
      shortUrl: `http://localhost:4000/${shortCode}`,
    });
  };

  // Close the QR modal
  const handleCloseQR = () => {
    setQrModal(null);
  };

  // Download the QR code as a PNG file named <shortCode>.png
  const handleDownloadQR = () => {
    if (!qrCanvasRef.current || !qrModal) return;

    // Convert the canvas element to a data URL
    const canvas = qrCanvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");

    // Create a temporary link and trigger the download
    const link = document.createElement("a");
    link.download = `${qrModal.shortCode}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Delete a URL after user confirmation
  const handleDelete = async (shortCode) => {
    // Ask the user to confirm the deletion
    const confirmed = window.confirm(
      "Are you sure you want to delete this URL?"
    );

    // Only proceed if the user confirmed
    if (!confirmed) return;

    try {
      // Send DELETE request to the backend
      await api.delete(`/url/${shortCode}`);
      // Refresh the table after successful deletion
      fetchUrls();
      toast.success("URL deleted");
    } catch (error) {
      // Show the backend error message, or a fallback
      const message =
        error.response?.data?.error || "Failed to delete URL.";
      toast.error(message);
    }
  };

  // Fetch all shortened URLs from the backend
  const fetchUrls = async () => {
    try {
      const response = await api.get("/url");
      // Store the array of URL documents in state
      setUrls(response.data.data);
    } catch {
      // Silently handle fetch errors; keep urls as-is
    }
  };

  // Load all URLs when the component first mounts
  useEffect(() => {
    fetchUrls();
  }, []);

  return (
    <div className="app">
      {/* Top navigation bar */}
      <nav className="navbar">
        <div className="navbar-inner">
          {/* Brand / logo */}
          <div className="brand">
            <span className="brand-mark">🔗</span>
            <span className="brand-name">LinkSnip</span>
          </div>

          {/* Auth buttons – visual only */}
          <div className="nav-actions">
            <button type="button" className="btn nav-btn nav-btn-login">
              Log in
            </button>
            <button type="button" className="btn nav-btn nav-btn-signup">
              Sign up
            </button>
          </div>
        </div>
      </nav>

      <main className="main">
        {/* Hero section */}
        <section className="hero">
          <h1 className="hero-title">
            Shorten your links. Amplify your brand.
          </h1>
          <p className="hero-subtitle">
            Turn long, clunky URLs into short, powerful links with real-time
            analytics and instant QR codes.
          </p>
        </section>

        {/* URL Shortener card */}
        <section className="card shorten-card">
          {/* Long URL input */}
          <div className="field">
            <label className="field-label" htmlFor="long-url">
              Long URL
            </label>
            <input
              id="long-url"
              type="text"
              placeholder="Paste your long URL here..."
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="input"
            />
          </div>

          {/* Optional fields */}
          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="custom-domain">
                Custom Domain <span className="optional-tag">Optional</span>
              </label>
              <input
                id="custom-domain"
                type="text"
                placeholder="e.g. link.yourbrand.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="input"
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="custom-alias">
                Custom Alias <span className="optional-tag">Optional</span>
              </label>
              <input
                id="custom-alias"
                type="text"
                placeholder="e.g. my-custom-alias"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Shorten button with spinner */}
          <button
            type="button"
            className="btn btn-primary btn-shorten"
            onClick={handleShorten}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> Creating Link...
              </>
            ) : (
              "Shorten URL"
            )}
          </button>

          {/* Short URL result section */}
          {shortUrl && (
            <div className="result">
              <div className="result-head">
                <span className="result-label">Your short link</span>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="result-link"
                >
                  {shortUrl}
                </a>
              </div>
              <button
                type="button"
                className="btn btn-copy"
                onClick={handleCopy}
              >
                Copy URL
              </button>
              {copyMessage && (
                <p className="result-feedback">{copyMessage}</p>
              )}
            </div>
          )}

          {/* Analytics section - shown after a short URL is generated */}
          {shortUrl && (
            <div className="analytics">
              <h3 className="section-title">Analytics</h3>

              {/* Show spinner while fetching stats */}
              {loadingStats && (
                <div className="loading-wrap">
                  <span className="spinner spinner-dark"></span>
                </div>
              )}

              {/* Show analytics data as individual info cards */}
              {!loadingStats && stats && (
                <div className="analytics-grid">
                  <div className="info-card">
                    <span className="info-card-label">Original URL</span>
                    <span className="info-card-value">
                      {stats.originalUrl.length > 40
                        ? stats.originalUrl.substring(0, 40) + "..."
                        : stats.originalUrl}
                    </span>
                  </div>
                  <div className="info-card">
                    <span className="info-card-label">Click Count</span>
                    <span className="info-card-value-large">
                      {stats.clicks}
                    </span>
                  </div>
                  <div className="info-card">
                    <span className="info-card-label">Created Date</span>
                    <span className="info-card-value">
                      {new Date(stats.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Dashboard */}
        <section className="dashboard">
          <div className="dashboard-header">
            <h3 className="section-title">Your Shortened URLs</h3>
            <p className="dashboard-subtitle">
              Manage, copy, download QR and delete your links.
            </p>
          </div>

          {/* Show empty state if no URLs exist */}
          {urls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔗</div>
              <h4 className="empty-title">No links yet</h4>
              <p className="empty-subtitle">
                Create your first short URL to see it here.
              </p>
            </div>
          ) : (
            /* Responsive card list */
            <div className="url-list">
              {urls.map((url) => (
                <div className="url-card" key={url._id}>
                  <div className="url-card-body">
                    {/* Original URL */}
                    <div className="url-card-field">
                      <span className="url-card-label">Original URL</span>
                      <span className="url-card-value url-card-original">
                        {url.originalUrl}
                      </span>
                    </div>

                    {/* Displayed Short URL */}
                    <div className="url-card-field">
                      <span className="url-card-label">Short URL</span>
                      <a
                        href={`http://localhost:4000/${url.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-card-link"
                      >
                        {`http://localhost:4000/${url.shortCode}`}
                      </a>
                    </div>

                    {/* Stats */}
                    <div className="url-card-stats">
                      <div className="url-card-stat">
                        <span className="url-card-stat-value">
                          {url.clicks}
                        </span>
                        <span className="url-card-stat-label">
                          Click Count
                        </span>
                      </div>
                      <div className="url-card-stat">
                        <span className="url-card-stat-value">
                          {new Date(url.createdAt).toLocaleString()}
                        </span>
                        <span className="url-card-stat-label">
                          Created Date
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="url-card-actions">
                      <button
                        type="button"
                        className="btn btn-copy-sm"
                        onClick={() => handleTableCopy(url.shortCode)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="btn btn-qr"
                        onClick={() =>
                          handleShowQR(url.shortCode, url.originalUrl)
                        }
                      >
                        Show QR
                      </button>
                      <button
                        type="button"
                        className="btn btn-delete"
                        onClick={() => handleDelete(url.shortCode)}
                      >
                        Delete
                      </button>
                      {/* Show "Copied!" message next to the buttons */}
                      {tableCopyMessage && (
                        <span className="table-feedback">
                          {tableCopyMessage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 LinkSnip</p>
        <p>Built with React, Node.js, Express and MongoDB.</p>
        <p>Internship Project.</p>
      </footer>

      {/* QR Code modal overlay - renders when qrModal is not null */}
      {qrModal && (
        // Clicking the backdrop closes the modal
        <div className="modal-overlay" onClick={handleCloseQR}>
          {/* Stop propagation so clicking inside the modal doesn't close it */}
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">QR Code</h3>

            {/* Render the QR code using the short URL as the encoded value */}
            <div className="qr-wrap">
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={qrModal.shortUrl}
                size={200}
                level="H"
              />
            </div>

            {/* Display the original URL for reference */}
            <p className="qr-url">
              <strong>Original:</strong> {qrModal.originalUrl}
            </p>

            {/* Display the short URL below the QR code */}
            <p className="qr-url">
              <strong>Short URL:</strong> {qrModal.shortUrl}
            </p>

            {/* Download the QR code as a PNG file named <shortCode>.png */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadQR}
              >
                Download QR
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCloseQR}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={2000}
        theme="colored"
      />
    </div>
  );
}

export default App;
