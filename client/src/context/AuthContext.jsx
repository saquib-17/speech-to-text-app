import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      const urlToken = new URLSearchParams(window.location.search).get("demo_token");
      if (urlToken) {
        localStorage.setItem("speechscribe_token", urlToken);
        return urlToken;
      }
      return localStorage.getItem("speechscribe_token");
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem("speechscribe_token");
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem("speechscribe_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem("speechscribe_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener("speechscribe:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("speechscribe:unauthorized", handleUnauthorized);
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.data?.token) {
      localStorage.setItem("speechscribe_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || "Authentication failed.");
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register({ name, email, password });
    if (res.success && res.data?.token) {
      localStorage.setItem("speechscribe_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || "Registration failed.");
  };

  const logout = () => {
    localStorage.removeItem("speechscribe_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
