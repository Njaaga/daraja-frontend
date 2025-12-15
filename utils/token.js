import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const getAccessToken = () => localStorage.getItem("token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const setAccessToken = (token) => localStorage.setItem("token", token);

export const refreshToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await axios.post(`${API_URL}/token/refresh/`, { refresh });
    setAccessToken(res.data.access);
    return res.data.access;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return null;
  }
};
