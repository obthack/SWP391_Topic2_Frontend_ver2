import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, API_BASE_URL } from "../lib/api";

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
    (async () => {
      try {
        const raw = localStorage.getItem("evtb_auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed?.user || null);
          setProfile(parsed?.profile || null);
        }
        // Try load current user from backend to get freshest name/profile
        try {
          const me = await apiRequest("/api/User/me");
          if (me) {
            const mergedUser = { ...(me.user || me), ...(me.profile ? { profile: me.profile } : {}) };
            setUser((u) => ({ ...(u || {}), ...mergedUser }));
            if (me.profile) setProfile(me.profile);
            const raw2 = localStorage.getItem("evtb_auth");
            const sess = raw2 ? JSON.parse(raw2) : {};
            localStorage.setItem("evtb_auth", JSON.stringify({ ...sess, user: mergedUser, profile: me.profile || sess.profile }));
          }
        } catch {}
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
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

    // Normalize possible backend shapes
    const normalizedToken =
      data?.token || data?.accessToken || data?.jwt || data?.tokenString ||
      data?.data?.token || data?.result?.token || null;
    const normalizedUser =
      data?.user || data?.data?.user || data?.result?.user || { email, fullName, phone };
    const normalizedProfile = data?.profile || data?.data?.profile || data?.result?.profile || null;

    if (!normalizedToken) {
      throw new Error("Đăng ký thất bại: phản hồi không chứa token.");
    }

    const session = { token: normalizedToken, user: normalizedUser, profile: normalizedProfile };

    localStorage.setItem("evtb_auth", JSON.stringify(session));
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

    // Normalize possible backend shapes
    const normalizedToken =
      data?.token || data?.accessToken || data?.jwt || data?.tokenString ||
      data?.data?.token || data?.result?.token || null;
    const normalizedUser = data?.user || data?.data?.user || data?.result?.user || { email };
    const normalizedProfile = data?.profile || data?.data?.profile || data?.result?.profile || null;

    if (!normalizedToken) {
      throw new Error("Đăng nhập thất bại: phản hồi không chứa token.");
    }

    const session = { token: normalizedToken, user: normalizedUser, profile: normalizedProfile };

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
    const data = await apiRequest("/api/User/profile", {
      method: "PUT",
      body: updates,
    });
    const newProfile = data?.profile || data;
    setProfile(newProfile);
    const raw = localStorage.getItem("evtb_auth");
    try {
      const session = raw ? JSON.parse(raw) : {};
      localStorage.setItem("evtb_auth", JSON.stringify({ ...session, profile: newProfile }));
    } catch {}
    return newProfile;
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
    signInWithProvider: (provider) => {
      const prov = provider === 'google' ? 'google' : 'facebook';
      window.location.href = `${API_BASE_URL}/api/Auth/${prov}`;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
