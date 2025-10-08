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
        // Ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signOut = () => {
    localStorage.removeItem("evtb_auth");
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      const authData = localStorage.getItem("evtb_auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        localStorage.setItem("evtb_auth", JSON.stringify({
          ...parsed,
          user: updatedUser
        }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const buildSession = (data, email) => {
    // Normalize possible backend shapes
    const normalizedToken =
      data?.token || data?.accessToken || data?.jwt || data?.tokenString ||
      data?.data?.token || data?.data?.accessToken || data?.data?.jwt || 
      data?.result?.token || data?.result?.accessToken || data?.result?.jwt ||
      data?.data?.data?.token || data?.data?.data?.accessToken || data?.data?.data?.jwt;

    const normalizedUser = data?.user || data?.data?.user || data?.result?.user || 
                          data?.data?.data?.user || data?.data?.data?.data?.user || null;
    
    const normalizedProfile = data?.profile || data?.data?.profile || data?.result?.profile || 
                             data?.data?.data?.profile || data?.data?.data?.data?.profile || null;

    // If we have user data, normalize it
    if (normalizedUser) {
      const userData = normalizedUser;
      const normalizedUserData = {
        ...userData,
        fullName: userData.fullName || userData.full_name || userData.name,
        email: userData.email || email,
        phone: userData.phone,
        id: userData.userId || userData.id || userData.accountId,
        userId: userData.userId || userData.id || userData.accountId
      };
      
      return {
        token: normalizedToken,
        user: normalizedUserData,
        profile: normalizedProfile
      };
    }

    // If no user data but we have email, create minimal user object
    if (email) {
      return {
        token: normalizedToken,
        user: {
          email: email,
          id: data?.userId || data?.id || data?.accountId,
          userId: data?.userId || data?.id || data?.accountId
        },
        profile: normalizedProfile
      };
    }

    return {
      token: normalizedToken,
      user: null,
      profile: normalizedProfile
    };
  };

  const signUp = async (email, password, fullName, phone = "") => {
    console.log("Register data being sent:", { 
      email, 
      password, 
      fullName, 
      phone,
      full_name: fullName 
    });

    const form = new FormData();
    form.append("Email", email);
    form.append("Password", password);
    form.append("FullName", fullName);
    form.append("Phone", phone);

    const data = await apiRequest("/api/User/register", {
      method: "POST",
      body: form,
    });
    
    // Try different data formats to find what backend expects
    const possibleFormats = [
      // Format 1: Direct response
      data,
      // Format 2: Nested in data
      data?.data,
      // Format 3: Nested in result
      data?.result,
      // Format 4: Double nested
      data?.data?.data,
      data?.data?.result,
      data?.result?.data,
      // Format 5: Triple nested
      data?.data?.data?.data,
      data?.data?.data?.result,
      data?.result?.result,
      data?.result?.data?.data,
    ];

    for (const format of possibleFormats) {
      if (!format) continue;
      
      console.log("Trying format:", format);
      
      // Check if this format has the expected structure
      const hasToken = format?.token || format?.accessToken || format?.jwt || format?.tokenString;
      const hasUser = format?.user || format?.userId || format?.id || format?.accountId;
      
      if (hasToken || hasUser) {
        console.log("Found valid format:", format);
        
        // Normalize possible backend shapes
        const normalizedToken =
          format?.token || format?.accessToken || format?.jwt || format?.tokenString;

        const userData = format?.user || format;
        const normalizedUser = {
          ...userData,
          fullName: userData.fullName || userData.full_name || userData.name || fullName,
          email: userData.email || email,
          phone: userData.phone || phone,
          id: userData.userId || userData.id || userData.accountId,
          userId: userData.userId || userData.id || userData.accountId
        };
        
        const session = {
          token: normalizedToken,
          user: normalizedUser,
          profile: format?.profile || null
        };
        
        console.log("Register response:", data);
        
        localStorage.setItem("evtb_auth", JSON.stringify(session));
        setUser(session.user);
        setProfile(session.profile || null);
        return session;
      }
      
      // Otherwise, continue to next format
      continue;
    }

    // Many backends don't return token on register; try auto-login to obtain token
    try {
      const session = await signIn(email, password);
      localStorage.setItem("evtb_auth", JSON.stringify(session));
      setUser(session.user);
      setProfile(session.profile || null);
      return session;
    } catch (loginError) {
      console.error("Auto-login after register failed:", loginError);
      throw new Error("Registration completed but auto-login failed. Please try logging in manually.");
    }
  };

  const signIn = async (email, password) => {
    const data = await apiRequest("/api/User/login", {
      method: "POST",
      body: { email, password },
    });

    // Normalize possible backend shapes
    const normalizedToken =
      data?.token || data?.accessToken || data?.jwt || data?.tokenString ||
      data?.data?.token || data?.data?.accessToken || data?.data?.jwt || 
      data?.result?.token || data?.result?.accessToken || data?.result?.jwt ||
      data?.data?.data?.token || data?.data?.data?.accessToken || data?.data?.data?.jwt;

    const normalizedUser = data?.user || data?.data?.user || data?.result?.user || 
                          data?.data?.data?.user || data?.data?.data?.data?.user || null;
    
    const normalizedProfile = data?.profile || data?.data?.profile || data?.result?.profile || null;
    
    console.log("=== SIGNIN DEBUG ===");
    console.log("Login API response:", data);

    const session = buildSession(data, email);
    console.log("Initial session:", session);

    // If we have user data, normalize it
    if (normalizedUser) {
      const userData = normalizedUser;
      const normalizedUserData = {
        ...userData,
        fullName: userData.fullName || userData.full_name || userData.name,
        email: userData.email || email,
        phone: userData.phone,
        id: userData.userId || userData.id || userData.accountId,
        userId: userData.userId || userData.id || userData.accountId
      };
      
      session.user = normalizedUserData;
    }

    // If no user data but we have email, create minimal user object
    if (!session.user && email) {
      session.user = {
        email: email,
        id: data?.userId || data?.id || data?.accountId,
        userId: data?.userId || data?.id || data?.accountId
      };
    }

    console.log("Final session:", session);

    localStorage.setItem("evtb_auth", JSON.stringify(session));
    setUser(session.user);
    setProfile(session.profile || null);

    console.log("Final session to return:", session);
    console.log("==================");

    return session;
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};