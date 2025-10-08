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
            // Normalize user data to ensure consistent field names
            const userData = me.user || me;
            const normalizedUser = {
              ...userData,
              fullName: userData.fullName || userData.full_name || userData.name,
              email: userData.email,
              phone: userData.phone,
              id: userData.userId || userData.id || userData.accountId,
              userId: userData.userId || userData.id || userData.accountId
            };
            
            const mergedUser = { ...normalizedUser, ...(me.profile ? { profile: me.profile } : {}) };
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
    console.log("Register data being sent:", { 
      email, 
      password, 
      fullName, 
      phone,
      full_name: fullName 
    });
    
    // Try different data formats to find what backend expects
    const formats = [
      {
        name: "Format 1: fullName + full_name",
        data: { email, password, fullName, full_name: fullName, phone }
      },
      {
        name: "Format 2: fullName only",
        data: { email, password, fullName, phone }
      },
      {
        name: "Format 3: full_name only",
        data: { email, password, full_name: fullName, phone }
      },
      {
        name: "Format 4: name field",
        data: { email, password, name: fullName, phone }
      },
      {
        name: "Format 5: minimal",
        data: { email, password, phone }
      }
    ];
    
    for (const format of formats) {
      try {
        console.log(`Trying ${format.name}:`, format.data);
        
        const data = await apiRequest("/api/User/register", {
          method: "POST",
          body: format.data,
        });
        
        console.log("Register response:", data);

        // Normalize possible backend shapes
        const normalizedToken =
          data?.token || data?.accessToken || data?.jwt || data?.tokenString ||
          data?.data?.token || data?.result?.token || null;
        
        const userData = data?.user || data?.data?.user || data?.result?.user || { email, fullName, phone };
        const normalizedUser = {
          ...userData,
          fullName: userData.fullName || userData.full_name || userData.name || fullName,
          email: userData.email || email,
          phone: userData.phone || phone,
          id: userData.userId || userData.id || userData.accountId,
          userId: userData.userId || userData.id || userData.accountId
        };
        
        const normalizedProfile = data?.profile || data?.data?.profile || data?.result?.profile || null;

        if (!normalizedToken) {
          throw new Error("Đăng ký thất bại: phản hồi không chứa token.");
        }

        const session = { token: normalizedToken, user: normalizedUser, profile: normalizedProfile };

        localStorage.setItem("evtb_auth", JSON.stringify(session));
        setUser(session.user);
        setProfile(session.profile || null);

        return session;
        
      } catch (error) {
        console.error(`${format.name} failed:`, {
          status: error.status,
          message: error.message,
          data: error.data
        });
        
        // If this is the last format, throw the error
        if (format === formats[formats.length - 1]) {
          console.error("All register formats failed");
          throw error;
        }
        // Otherwise, continue to next format
        continue;
      }
    }
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
    
    const userData = data?.user || data?.data?.user || data?.result?.user || { email };
    const normalizedUser = {
      ...userData,
      fullName: userData.fullName || userData.full_name || userData.name,
      email: userData.email || email,
      phone: userData.phone,
      id: userData.userId || userData.id || userData.accountId,
      userId: userData.userId || userData.id || userData.accountId
    };
    
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
