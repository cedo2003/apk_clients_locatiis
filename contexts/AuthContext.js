// src/contexts/AuthContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Run once on mount: check token and fetch profile
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (accessToken) {
          const response = await api.get("/auth/profile");
          const userData = response.data.user || response.data;
          console.log("Profile fetched on mount:", userData);
          console.log("Profile fetched on mount:", userData);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("User not authenticated", error);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users/profile");
      const userData = response.data.user || response.data;
      console.log("User profile re-fetched:", userData);
      setUser(userData);
    } catch (error) {
      console.error("User not authenticated", error);
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    await AsyncStorage.setItem("accessToken", data.accessToken);
    await AsyncStorage.setItem("refreshToken", data.refreshToken);

    if (data.user) {
      setUser(data.user);
    } else {
      try {
        const profileResponse = await api.get("/users/profile");
        const userData = profileResponse.data.user || profileResponse.data;
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user profile after login", error);
      }
    }
  };

  const signup = async (userData) => {
    const { data } = await api.post("/auth/signup", userData);
    await AsyncStorage.setItem("accessToken", data.accessToken);
    await AsyncStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/signout");
    } catch (e) {
      console.warn("Signout request failed, ignoring", e);
    }
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, setUser, fetchUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
