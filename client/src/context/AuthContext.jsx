import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (payload) => {
    try {
      const { data } = await api.post("/auth/login", payload);
      setUser(data.user);
      toast.success("Welcome back");
      return data.user;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const register = async (payload) => {
    try {
      const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
      const { data } = await api.post("/auth/register", payload, {
        headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
      });
      setUser(data.user);
      toast.success("Account created");
      return data.user;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    toast.success("Logged out");
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser: fetchProfile,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
