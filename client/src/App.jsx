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
        <h1>🔗 URL Shortener</h1>

        <input
          type="text"
          placeholder="Paste your long URL here..."
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          style={styles.input}
        />

        <button
          style={styles.button}
          onClick={handleShorten}
          disabled={loading}
        >
          {/* Show "Shortening..." while the request is in progress */}
          {loading ? "Shortening..." : "Shorten URL"}
        </button>

        <div style={styles.result}>
          <h3>Short URL</h3>
          {shortUrl ? (
            <p>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                {shortUrl}
              </a>
            </p>
          ) : (
            <p>No URL generated yet.</p>
          )}

          {/* Copy button - only visible when a short URL exists */}
          {shortUrl && (
            <button style={styles.copyButton} onClick={handleCopy}>
              Copy URL
            </button>
          )}

          {/* Copy feedback message */}
          {copyMessage && <p style={styles.copyMessage}>{copyMessage}</p>}
        </div>

        {/* Analytics section - shown after a short URL is generated */}
        {shortUrl && (
          <div style={styles.analytics}>
            <h3>Analytics</h3>

            {/* Show loading message while fetching stats */}
            {loadingStats && <p>Loading analytics...</p>}

            {/* Show analytics data once loaded */}
            {!loadingStats && stats && (
              <>
                <p>
                  <strong>Original URL:</strong> {stats.originalUrl}
                </p>
                <p>
                  <strong>Click Count:</strong> {stats.clicks}
                </p>
                <p>
                  <strong>Created Date:</strong>{" "}
                  {new Date(stats.createdAt).toLocaleString()}
                </p>
              </>
            )}
          </div>
        )}

        {/* All Shortened URLs dashboard section */}
        <div style={styles.dashboard}>
          <h3>All Shortened URLs</h3>

          {/* Show message if no URLs exist */}
          {urls.length === 0 ? (
            <p>No URLs found.</p>
          ) : (
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
                    <td style={styles.td}>{url.shortCode}</td>
                    <td style={styles.td}>{url.originalUrl}</td>
                    <td style={styles.td}>{url.clicks}</td>
                    {/* QR column - button to open the QR modal */}
                    <td style={styles.td}>
                      <button
                        style={styles.tableQRButton}
                        onClick={() => handleShowQR(url.shortCode, url.originalUrl)}
                      >
                        Show QR
                      </button>
                    </td>
                    {/* Actions column - copy and delete */}
                    <td style={styles.td}>
                      {/* Copy button for this row */}
                      <button
                        style={styles.tableCopyButton}
                        onClick={() => handleTableCopy(url.shortCode)}
                      >
                        Copy
                      </button>
                      {/* Delete button for this row */}
                      <button
                        style={styles.tableDeleteButton}
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
            <button style={styles.downloadButton} onClick={handleDownloadQR}>
              Download QR
            </button>

            {/* Close the modal */}
            <button style={styles.closeButton} onClick={handleCloseQR}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#f4f6f8",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    width: "450px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "20px",
    marginBottom: "20px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  result: {
    marginTop: "30px",
    padding: "15px",
    background: "#f9fafb",
    borderRadius: "8px",
  },

  // Copy button style
  copyButton: {
    marginTop: "10px",
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  // Copy feedback message style
  copyMessage: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#10b981",
    fontWeight: "bold",
  },

  // Analytics section style
  analytics: {
    marginTop: "20px",
    padding: "15px",
    background: "#f9fafb",
    borderRadius: "8px",
    textAlign: "left",
  },

  // Dashboard section style
  dashboard: {
    marginTop: "20px",
    padding: "15px",
    background: "#f9fafb",
    borderRadius: "8px",
    textAlign: "left",
  },

  // Table style
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },

  // Table header cell style
  th: {
    borderBottom: "2px solid #d1d5db",
    padding: "8px",
    textAlign: "left",
    fontSize: "14px",
  },

  // Table data cell style
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "8px",
    fontSize: "13px",
  },

  // Table copy button style
  tableCopyButton: {
    padding: "4px 8px",
    fontSize: "12px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "6px",
  },

  // Table delete button style
  tableDeleteButton: {
    padding: "4px 8px",
    fontSize: "12px",
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  // Table copy feedback message style
  tableCopyFeedback: {
    marginLeft: "8px",
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "bold",
  },

  // QR button style for each table row
  tableQRButton: {
    padding: "4px 8px",
    fontSize: "12px",
    backgroundColor: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "6px",
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
  },

  // Modal card
  modal: {
    background: "#fff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
    textAlign: "center",
    minWidth: "280px",
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
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "10px",
  },

  // Close button style
  closeButton: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default App;
