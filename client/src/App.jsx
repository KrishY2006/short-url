import { useState } from "react";
import api from "./api/client";

function App() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  // Handle the shorten button click
  const handleShorten = async () => {
    // Validate that the input is not empty
    if (!originalUrl.trim()) {
      alert("Please enter a URL to shorten.");
      return;
    }

    try {
      // Send POST request to the backend
      const response = await api.post("/url/shorten", { originalUrl });

      // Save the returned short URL into state
      setShortUrl(response.data.shortUrl);
    } catch (error) {
      // Show the backend error message, or a fallback
      const message =
        error.response?.data?.error || "Something went wrong.";
      alert(message);
    }
  };

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

        <button style={styles.button} onClick={handleShorten}>
          Shorten URL
        </button>

        <div style={styles.result}>
          <h3>Short URL</h3>
          {shortUrl ? <p>{shortUrl}</p> : <p>No URL generated yet.</p>}
        </div>
      </div>
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
};

export default App;
