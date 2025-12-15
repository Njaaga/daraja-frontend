import axios from "axios";
import { getAccessToken, refreshToken, setAccessToken } from "./token";

const API_URL = "http://127.0.0.1:8000/api";

const client = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach access token
client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Response interceptor to refresh token if 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      if (newToken) {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return client(originalRequest); // retry request
      }
    }

    return Promise.reject(error);
  }
);

export default client;
