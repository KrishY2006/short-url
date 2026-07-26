import axios from "axios";

// Reusable axios instance pointing at the backend API
const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

export default api;
