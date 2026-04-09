import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

