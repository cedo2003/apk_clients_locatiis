// contexts/AuthContext.js
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // To show a splash/loading screen on app start

  // On app start, check for existing tokens and validate them
  useEffect(() => {
    const initializeAuth = async () => {
      console.log("AuthContext: Initializing authentication state...");
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (accessToken) {
          console.log("AuthContext: Token found. Fetching user profile...");
          // The request interceptor will add the token automatically
          const response = await api.get("/users/profile");
          const userData = response.data.user || response.data;
          setUser(userData);
          console.log("AuthContext: User profile loaded and set.", userData);
        } else {
          console.log("AuthContext: No token found. User is not logged in.");
          setUser(null);
        }
      } catch (error) {
        console.error(
          "AuthContext: Failed to initialize auth. Token might be invalid.",
          error.response?.data || error.message
        );
        // If profile fetch fails (e.g., token is invalid), treat as logged out
        setUser(null);
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
      } finally {
        setIsLoading(false);
        console.log("AuthContext: Initialization complete.");
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    console.log(`AuthContext: Attempting login for ${email}`);
    try {
      // The API call
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      console.log("AuthContext: Login successful. Storing tokens.");
      // Store tokens securely
      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      // Update the user state, which will trigger UI re-renders
      setUser(userData);
      console.log("AuthContext: User state updated.", userData);

      return true; // Signal success to the Login component
    } catch (error) {
      console.error(
        "AuthContext: Login failed.",
        error.response?.data || error.message
      );
      // Clean up any potentially stale tokens
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      setUser(null);
      return false; // Signal failure
    }
  };

  const signup = async (userData) => {
    console.log("AuthContext: Attempting signup.");
    try {
      const { data } = await api.post("/auth/signup", userData);
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      setUser(data.user);
      console.log("AuthContext: Signup successful, user is now logged in.");
      return true;
    } catch (error) {
      console.error(
        "AuthContext: Signup failed.",
        error.response?.data || error.message
      );
      return false;
    }
  };

  const logout = async () => {
    console.log("AuthContext: Logging out user.");
    try {
      // Inform the backend about logout (optional but good practice)
      await api.post("/auth/signout");
      console.log("AuthContext: Backend signout successful.");
    } catch (e) {
      // Don't block logout if this fails, just log it.
      console.warn(
        "AuthContext: Backend signout request failed, but proceeding with client-side logout.",
        e.message
      );
    } finally {
      // Clear tokens and user state regardless of backend response
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      setUser(null);
      console.log("AuthContext: Tokens cleared, user state set to null.");
    }
  };

  const fetchUser = async () => {
    console.log("AuthContext: Manually re-fetching user profile.");
    try {
      const response = await api.get("/auth/profile");
      const userData = response.data.user || response.data;
      setUser(userData);
      console.log(
        "AuthContext: User profile re-fetched and updated.",
        userData
      );
    } catch (error) {
      console.error(
        "AuthContext: Failed to re-fetch user profile.",
        error.response?.data || error.message
      );
      await logout();
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    signup,
    fetchUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
