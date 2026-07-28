import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import api from "./api/client";

function App() {
  const [originalUrl, setOriginalUrl] = useState("");
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
      alert("Please enter a URL to shorten.");
      return;
    }

    // Disable button and show loading text
    setLoading(true);

    try {
      // Send POST request to the backend
      const response = await api.post("/url/shorten", { originalUrl });

      // Save the returned short URL into state
      setShortUrl(response.data.shortUrl);

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
    } catch (error) {
      // Show the backend error message, or a fallback
      const message =
        error.response?.data?.error || "Something went wrong.";
      alert(message);
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
    } catch {
      // Show error message if copying fails
      setCopyMessage("Failed to copy URL.");
      setTimeout(() => setCopyMessage(""), 2000);
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
    } catch (error) {
      // Show the backend error message, or a fallback
      const message =
        error.response?.data?.error || "Failed to delete URL.";
      alert(message);
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔗 URL Shortener</h1>

        {/* URL Input */}
        <input
          type="text"
          placeholder="Paste your long URL here..."
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          style={styles.input}
          className="input-focus"
        />

        {/* Shorten button with spinner */}
        <button
          style={styles.button}
          className="btn-primary"
          onClick={handleShorten}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner"></span> Shortening...
            </>
          ) : (
            "Shorten URL"
          )}
        </button>

        {/* Short URL result section */}
        <div style={styles.result}>
          <h3 style={styles.sectionTitle}>Short URL</h3>
          {shortUrl ? (
            <p>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                {shortUrl}
              </a>
            </p>
          ) : (
            <p style={{ color: "#9ca3af" }}>No URL generated yet.</p>
          )}

          {/* Copy button - only visible when a short URL exists */}
          {shortUrl && (
            <button
              style={styles.copyButton}
              className="btn-copy"
              onClick={handleCopy}
            >
              Copy URL
            </button>
          )}

          {/* Copy feedback message */}
          {copyMessage && <p style={styles.copyMessage}>{copyMessage}</p>}
        </div>

        {/* Analytics section - shown after a short URL is generated */}
        {shortUrl && (
          <div style={styles.analytics}>
            <h3 style={styles.sectionTitle}>Analytics</h3>

            {/* Show spinner while fetching stats */}
            {loadingStats && (
              <div style={styles.loadingContainer}>
                <span className="spinner spinner-dark"></span>
              </div>
            )}

            {/* Show analytics data as individual info cards */}
            {!loadingStats && stats && (
              <div style={styles.analyticsGrid}>
                {/* Original URL card */}
                <div style={styles.infoCard}>
                  <span style={styles.infoCardLabel}>Original URL</span>
                  <span style={styles.infoCardValue}>
                    {stats.originalUrl.length > 40
                      ? stats.originalUrl.substring(0, 40) + "..."
                      : stats.originalUrl}
                  </span>
                </div>
                {/* Click Count card */}
                <div style={styles.infoCard}>
                  <span style={styles.infoCardLabel}>Click Count</span>
                  <span style={styles.infoCardValueLarge}>{stats.clicks}</span>
                </div>
                {/* Created Date card */}
                <div style={styles.infoCard}>
                  <span style={styles.infoCardLabel}>Created Date</span>
                  <span style={styles.infoCardValue}>
                    {new Date(stats.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Shortened URLs dashboard section */}
        <div style={styles.dashboard}>
          <h3 style={styles.sectionTitle}>All Shortened URLs</h3>

          {/* Show empty state if no URLs exist */}
          {urls.length === 0 ? (
            <div style={styles.emptyState}>
              <div className="empty-icon">🔗</div>
              <p style={styles.emptyTitle}>No shortened URLs yet.</p>
              <p style={styles.emptySubtitle}>Create your first one!</p>
            </div>
          ) : (
            /* Scrollable table wrapper for responsive layout */
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Short Code</th>
                    <th style={styles.th}>Original URL</th>
                    <th style={styles.th}>Clicks</th>
                    <th style={styles.th}>QR</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((url) => (
                    <tr key={url._id}>
                      <td style={styles.td}>
                        <a
                          href={`http://localhost:4000/${url.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.urlLink}
                        >
                          {url.shortCode}
                        </a>
                      </td>
                      <td style={styles.td}>
                        <a
                          href={url.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.urlLink}
                        >
                          {url.originalUrl.length > 35
                            ? url.originalUrl.substring(0, 35) + "..."
                            : url.originalUrl}
                        </a>
                      </td>
                      <td style={styles.td}>{url.clicks}</td>
                      {/* QR column - button to open the QR modal */}
                      <td style={styles.td}>
                        <button
                          style={styles.tableQRButton}
                          className="btn-table"
                          onClick={() =>
                            handleShowQR(url.shortCode, url.originalUrl)
                          }
                        >
                          Show QR
                        </button>
                      </td>
                      {/* Actions column - copy and delete */}
                      <td style={styles.td}>
                        {/* Copy button for this row */}
                        <button
                          style={styles.tableCopyButton}
                          className="btn-table"
                          onClick={() => handleTableCopy(url.shortCode)}
                        >
                          Copy
                        </button>
                        {/* Delete button for this row */}
                        <button
                          style={styles.tableDeleteButton}
                          className="btn-table"
                          onClick={() => handleDelete(url.shortCode)}
                        >
                          Delete
                        </button>
                        {/* Show "Copied!" message next to the buttons */}
                        {tableCopyMessage && (
                          <span style={styles.tableCopyFeedback}>
                            {tableCopyMessage}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* QR Code modal overlay - renders when qrModal is not null */}
      {qrModal && (
        // Clicking the backdrop closes the modal
        <div style={styles.modalOverlay} onClick={handleCloseQR}>
          {/* Stop propagation so clicking inside the modal doesn't close it */}
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>QR Code</h3>

            {/* Render the QR code using the short URL as the encoded value */}
            <div style={styles.qrContainer}>
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={qrModal.shortUrl}
                size={200}
                level="H"
              />
            </div>

            {/* Display the original URL for reference */}
            <p style={styles.qrUrl}>
              <strong>Original:</strong> {qrModal.originalUrl}
            </p>

            {/* Display the short URL below the QR code */}
            <p style={styles.qrUrl}>
              <strong>Short URL:</strong> {qrModal.shortUrl}
            </p>

            {/* Download the QR code as a PNG file named <shortCode>.png */}
            <button
              style={styles.downloadButton}
              className="btn-modal"
              onClick={handleDownloadQR}
            >
              Download QR
            </button>

            {/* Close the modal */}
            <button
              style={styles.closeButton}
              className="btn-modal"
              onClick={handleCloseQR}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Page wrapper – responsive padding, centered layout
  container: {
    backgroundColor: "#f4f6f8",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: "40px 16px",
    boxSizing: "border-box",
  },

  // Main card – wider, rounder, deeper shadow
  card: {
    background: "#fff",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "900px",
    boxShadow:
      "0 4px 6px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  // Page heading
  title: {
    margin: "0 0 28px",
    fontSize: "32px",
    letterSpacing: "-0.5px",
  },

  // Shared section title inside the card
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 12px",
    color: "#1f2937",
  },

  // URL input field
  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "16px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "1.5px solid #d1d5db",
    boxSizing: "border-box",
    backgroundColor: "#f9fafb",
  },

  // Primary action button (Shorten)
  button: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontWeight: 600,
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    height: "48px",
  },

  // Short URL result box
  result: {
    marginTop: "28px",
    padding: "20px",
    background: "#f9fafb",
    borderRadius: "12px",
  },

  // Copy button (green)
  copyButton: {
    marginTop: "12px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 600,
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    height: "40px",
  },

  // Copy feedback text
  copyMessage: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#10b981",
    fontWeight: "bold",
  },

  // Analytics section container
  analytics: {
    marginTop: "24px",
    padding: "20px",
    background: "#f9fafb",
    borderRadius: "12px",
    textAlign: "left",
  },

  // Grid layout for analytics info cards
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
  },

  // Individual analytics info card
  infoCard: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "14px 16px",
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },

  // Label inside info card
  infoCardLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  // Value inside info card
  infoCardValue: {
    fontSize: "14px",
    color: "#1f2937",
    wordBreak: "break-all",
  },

  // Large numeric value (click count)
  infoCardValueLarge: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#2563eb",
  },

  // Spinner loading container
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "20px 0",
  },

  // Dashboard section
  dashboard: {
    marginTop: "24px",
    padding: "20px",
    background: "#f9fafb",
    borderRadius: "12px",
    textAlign: "left",
  },

  // Empty state container
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    color: "#9ca3af",
  },

  // Empty state title text
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#6b7280",
    margin: "0 0 4px",
  },

  // Empty state subtitle text
  emptySubtitle: {
    fontSize: "14px",
    color: "#9ca3af",
    margin: 0,
  },

  // Scrollable wrapper around the table
  tableWrapper: {
    overflowX: "auto",
    marginTop: "10px",
    borderRadius: "8px",
  },

  // Table element
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "580px",
  },

  // Table header cell
  th: {
    borderBottom: "2px solid #d1d5db",
    padding: "10px 12px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
  },

  // Table data cell
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px",
    fontSize: "13px",
    verticalAlign: "middle",
  },

  // Table copy button (blue)
  tableCopyButton: {
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "6px",
    height: "30px",
  },

  // Table delete button (red)
  tableDeleteButton: {
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    height: "30px",
  },

  // Table copy feedback message
  tableCopyFeedback: {
    marginLeft: "8px",
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "bold",
  },

  // QR button style for each table row (purple)
  tableQRButton: {
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    height: "30px",
  },

  // Modal overlay (dark backdrop)
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "16px",
  },

  // Modal card
  modal: {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
    textAlign: "center",
    minWidth: "280px",
    maxWidth: "90vw",
  },

  // QR code container
  qrContainer: {
    margin: "15px 0",
    display: "inline-block",
  },

  // Short URL display inside the modal
  qrUrl: {
    fontSize: "14px",
    color: "#555",
    margin: "10px 0 20px",
    wordBreak: "break-all",
  },

  // Download QR button style
  downloadButton: {
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "10px",
    height: "40px",
  },

  // Reusable link style for clickable URLs
  urlLink: {
    color: "#2563eb",
    textDecoration: "none",
    wordBreak: "break-all",
  },

  // Close button style
  closeButton: {
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    height: "40px",
  },
};

export default App;
