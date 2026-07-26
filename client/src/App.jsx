import { useState, useEffect } from "react";
import api from "./api/client";

function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    api
      .get("/health")
      .then(() => setStatus("API: Connected"))
      .catch(() => setStatus("API: Disconnected"));
  }, []);

  return (
    <div className="status-container">
      <p>{status}</p>
    </div>
  );
}

export default App;
