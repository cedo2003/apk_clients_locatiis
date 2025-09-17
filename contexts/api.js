// src/api.js
import axios from "axios";
import * as SecureStore from "expo-secure-store"; // Use SecureStore for tokens
import Config from "react-native-config"; // if you're using react-native-config

// From your backend main.ts, the base URL should include the /api prefix
export const API_BASE_URL =
  Config.BACKEND_URL || "http://192.168.1.76:3000/api";

console.log("API: Initializing with Base URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  async (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) {
      console.log("[API Request] Token found, adding to Authorization header.");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("[API Request] No token found.");
    }
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log(
      `[API Response] Success for ${response.config.url} with status ${response.status}`
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(
      `[API Response Error] Status ${error.response?.status} for ${originalRequest.url}`
    );

    // Check for 401 Unauthorized and if we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we are retrying this request
      console.log(
        "[API 401] Access token expired or invalid. Attempting to refresh."
      );

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) {
          console.log(
            "[API Refresh] No refresh token available. Cannot refresh."
          );
          return Promise.reject(error);
        }

        console.log("[API Refresh] Sending request to /auth/refresh");
        // Use a new axios instance for the refresh request to avoid interceptor loop
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        console.log(
          "[API Refresh] New tokens received. Storing them securely."
        );
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        await SecureStore.setItemAsync("refreshToken", data.refreshToken);

        // Update the authorization header on the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        console.log("[API Refresh] Retrying original request with new token.");
        return api(originalRequest);
      } catch (refreshError) {
        console.error(
          "[API Refresh] Failed to refresh token:",
          refreshError.response?.data || refreshError.message
        );
        // If refresh fails, the user is logged out. Clean up storage.
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        console.log("[API Refresh] Cleared all tokens. User is logged out.");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
