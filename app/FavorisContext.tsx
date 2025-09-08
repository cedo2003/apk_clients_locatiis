import React, { createContext, useContext, useState } from "react";
import { biensData } from "./(tabs)/acceuil";

type FavorisContextType = {
  favoris: { [key: string]: boolean };
  toggleFavori: (id: string) => void;
  biensFavoris: typeof biensData;
};

const FavorisContext = createContext<FavorisContextType | undefined>(undefined);

export const FavorisProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [favoris, setFavoris] = useState<{ [key: string]: boolean }>({});

  const toggleFavori = (id: string) => {
    setFavoris((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <FavorisContext.Provider
      value={{ favoris, toggleFavori, biensFavoris: biensData }}
    >
      {children}
    </FavorisContext.Provider>
  );
};

export const useFavoris = () => {
  const context = useContext(FavorisContext);
  if (!context)
    throw new Error("useFavoris must be used within a FavorisProvider");
  return context;
};
