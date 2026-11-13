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

  // Centralized Auth Modal state
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    mode: "login",
    title: null,
    subtitle: null,
    pendingAction: null,
  });

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

  // Open the unified authentication modal
  const openAuthModal = useCallback(
    ({ mode = "login", title = null, subtitle = null, onSuccess = null } = {}) => {
      setAuthModalState({
        isOpen: true,
        mode,
        title,
        subtitle,
        pendingAction: typeof onSuccess === "function" ? onSuccess : null,
      });
    },
    []
  );

  // Close modal and reset pending action
  const closeAuthModal = useCallback(() => {
    setAuthModalState((prev) => ({
      ...prev,
      isOpen: false,
      pendingAction: null,
    }));
  }, []);

  // Universal action gatekeeper: runs action if logged in, or opens modal and executes after success
  const requireAuth = useCallback(
    (actionCallback, options = {}) => {
      if (user && token) {
        if (typeof actionCallback === "function") {
          actionCallback();
        }
        return true;
      }

      openAuthModal({
        mode: options.mode || "login",
        title: options.title || "Authentication Required",
        subtitle: options.subtitle || "Sign in or create an account to proceed.",
        onSuccess: actionCallback,
      });
      return false;
    },
    [user, token, openAuthModal]
  );

  // Callback executed by AuthModal upon successful authentication
  const handleAuthModalSuccess = useCallback(() => {
    const action = authModalState.pendingAction;
    closeAuthModal();
    if (typeof action === "function") {
      try {
        action();
      } catch (err) {
        console.error("Error executing pending action after auth:", err);
      }
    }
  }, [authModalState.pendingAction, closeAuthModal]);

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
        // Centralized Modal API
        authModalState,
        openAuthModal,
        closeAuthModal,
        requireAuth,
        handleAuthModalSuccess,
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

export default AuthContext;
