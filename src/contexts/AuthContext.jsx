import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage (backend-auth flow)
    try {
      const raw = localStorage.getItem("evtb_auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed?.user || null);
        setProfile(parsed?.profile || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfile = async (_userId) => {
    // Optional: fetch profile from your backend if available
    return null;
  };

  const signUp = async (email, password, fullName, phone = "") => {
    const data = await apiRequest("/api/User/register", {
      method: "POST",
      body: {
        email,
        password,
        fullName,
        phone,
      },
    });

    const session = {
      token: data?.token || data?.accessToken || null,
      user: data?.user || { email, fullName, phone },
      profile: data?.profile || null,
    };

    if (session.token) {
      localStorage.setItem("evtb_auth", JSON.stringify(session));
    }

    setUser(session.user);
    setProfile(session.profile || null);

    return session;
  };

  const signIn = async (email, password) => {
    // Call your backend login API
    // Expecting response like: { token: string, user: { ... } }
    const data = await apiRequest("/api/User/login", {
      method: "POST",
      body: { email, password },
    });

    console.log("Backend login response:", data);

    const session = {
      token: data?.token || data?.accessToken || null,
      user: data?.user || data || { email }, // Fallback to full data if no user object
      profile: data?.profile || null,
    };

    console.log("Session object:", session);

    localStorage.setItem("evtb_auth", JSON.stringify(session));
    setUser(session.user);
    setProfile(session.profile || null);

    return session;
  };

  const signOut = async () => {
    localStorage.removeItem("evtb_auth");
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error("No user logged in");

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin: profile?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
