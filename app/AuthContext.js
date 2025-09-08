import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    if (email === "juniorhounmadjai@gmail.com" && password === "123456") {
      setUser({
        nom: "HOUNMADJAI",
        prenom: "Cédric",
        pseudo: "cedricdev",
        email: "juniorhounmadjai@gmail.com",
        tel: "+229 66 77 88 99",
        naissance: "2003-06-21",
        sexe: "Masculin",
        adresse: "Bénin, Calavi, Arconville",
        nationalite: "Béninoise",
        etatCivil: "Fiancé",
        profession: "Développeur Fullstack / Developpeur Mobile",
        interets: "Immobilier, Sport, Santé",
        role: "locataire",
      });
      return true;
    } else {
      return false;
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
