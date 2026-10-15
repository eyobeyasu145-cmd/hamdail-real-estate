import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = (userData, accessToken = userData.token) => {
    const { token: _token, ...profile } = userData;
    setUser(profile);
    localStorage.setItem("user", JSON.stringify(profile));
    if (accessToken) {
      localStorage.setItem("token", accessToken);
    } else {
      localStorage.removeItem("token");
    }
    setToken(accessToken || null);
    localStorage.setItem("role", profile.role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  const updateUser = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("role", userData.role);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser: updateUser, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
