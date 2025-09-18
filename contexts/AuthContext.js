// contexts/AuthContext.js
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("AuthContext: Initializing authentication state...");
      try {
        const accessToken = await SecureStore.getItemAsync("accessToken");
        if (accessToken) {
          console.log("AuthContext: Token found. Fetching user profile...");
          await fetchUser();
        } else {
          console.log("AuthContext: No token found. User is not logged in.");
          setUser(null);
        }
      } catch (error) {
        console.error(
          "AuthContext: Failed to initialize auth.",
          error.response?.data || error.message
        );
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

  const fetchUser = async () => {
    console.log("AuthContext: Fetching user profile.");
    try {
      const response = await api.get("/auth/profile");
      const userData = response.data.user || response.data;
      setUser(userData);
      console.log("AuthContext: User profile fetched and updated.", userData);
      return userData;
    } catch (error) {
      console.error(
        "AuthContext: Failed to fetch user profile.",
        error.response?.data || error.message
      );
      // Don't logout here, just clear user
      setUser(null);
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      return null;
    }
  };

  const login = async (email, password) => {
    console.log(`AuthContext: Attempting login for ${email}`);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, refreshToken } = response.data;

      console.log("AuthContext: Login successful. Storing tokens.");
      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);

      // Fetch user profile to update state
      const userData = await fetchUser();
      return !!userData; // Return true if user was fetched successfully
    } catch (error) {
      console.error(
        "AuthContext: Login failed.",
        error.response?.data || error.message
      );
      setUser(null);
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      return false;
    }
  };

  const loginWithGoogle = async (idToken) => {
    console.log("AuthContext: Attempting Google login.");
    try {
      const { data } = await api.post("/auth/google/callback", { idToken });
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);

      const newUser = await fetchUser();
      console.log("AuthContext: Google login successful.");
      return !!newUser;
    } catch (error) {
      console.error(
        "AuthContext: Google login failed.",
        error.response?.data || error.message
      );
      return false;
    }
  };

  const signup = async (userData) => {
    console.log("AuthContext: Attempting signup.");
    try {
      const { data } = await api.post("/auth/signup", userData);
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);

      // Fetch user profile to update state
      const newUser = await fetchUser();
      console.log("AuthContext: Signup successful, user is now logged in.");
      return !!newUser; // Return true if user was fetched successfully
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
      await api.post("/auth/signout");
      console.log("AuthContext: Backend signout successful.");
    } catch (e) {
      console.warn(
        "AuthContext: Backend signout request failed, but proceeding with client-side logout.",
        e.message
      );
    } finally {
      setUser(null);
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
      console.log("AuthContext: Tokens cleared, user state set to null.");
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
    loginWithGoogle,
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
