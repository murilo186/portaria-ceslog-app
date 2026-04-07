import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
