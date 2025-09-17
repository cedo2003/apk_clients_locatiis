import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../contexts/api";
import { useAuth } from "../contexts/AuthContext";

type FavorisContextType = {
  favoris: { [key: string]: boolean };
  toggleFavori: (id: string) => Promise<void>;
  isLoading: boolean;
  fetchFavoris: () => Promise<void>;
};

const FavorisContext = createContext<FavorisContextType | undefined>(undefined);

export const FavorisProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [favoris, setFavoris] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavoris = useCallback(async () => {
    if (!user) {
      setFavoris({});
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.get("/users/viewLikes");
      const favorisFromServer = Array.isArray(data.items)
        ? data.items.reduce((acc, fav) => {
            acc[fav.bienId] = true;
            return acc;
          }, {})
        : {};
      setFavoris(favorisFromServer);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setFavoris({});
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavoris();
  }, [fetchFavoris]);

  const toggleFavori = async (id: string) => {
    if (!user) return;

    const isFavori = !!favoris[id];

    try {
      await api.post("/users/like", { bienId: id });
      // After toggling, refetch the list to be sure of the state
      await fetchFavoris();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      // Optionally revert UI, though refetching handles consistency
    }
  };

  return (
    <FavorisContext.Provider value={{ favoris, toggleFavori, isLoading, fetchFavoris }}>
      {children}
    </FavorisContext.Provider>
  );
};

export const useFavoris = () => {
  const context = useContext(FavorisContext);
  if (!context) {
    throw new Error("useFavoris must be used within a FavorisProvider");
  }
  return context;
};