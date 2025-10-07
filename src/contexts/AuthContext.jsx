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
          const uid =
            parsed?.user?.id ||
            parsed?.user?.accountId ||
            parsed?.user?.userId ||
            parsed?.accountId;
          if (uid) {
            try {
              const me = await apiRequest(`/api/User/${uid}`);
              if (me) {
                const mergedUser = {
                  ...(parsed.user || {}),
                  ...(me.user || me),
                };
                const prof = parsed.profile || mapProfileFromAny(me);
                setUser(mergedUser);
                setProfile(prof);
                localStorage.setItem(
                  "evtb_auth",
                  JSON.stringify({ ...parsed, user: mergedUser, profile: prof })
                );
              }
            } catch {}
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadProfile = async (_userId) => {
    return null;
  };

  const isAdminFrom = (src) => {
    const rawRoleId =
      src?.roleId ??
      src?.role?.roleId ??
      src?.userRoleId ??
      src?.userRoles ??
      src?.RoleId ??
      src?.role;
    const rid = typeof rawRoleId === "string" ? Number(rawRoleId) : rawRoleId;
    const roleName = (src?.roleName || src?.role?.roleName || src?.role || "")
      .toString()
      .toLowerCase();
    return rid === 1 || roleName === "admin" || src?.isAdmin === true;
  };

  const mapProfileFromAny = (src) => {
    const rawRoleId =
      src?.roleId ??
      src?.role?.roleId ??
      src?.userRoleId ??
      src?.userRoles ??
      src?.RoleId ??
      src?.role;
    const rid = typeof rawRoleId === "string" ? Number(rawRoleId) : rawRoleId;
    const isAdmin = isAdminFrom(src);
    const fullName =
      src?.fullName ||
      src?.FullName ||
      src?.user?.fullName ||
      src?.profile?.fullName ||
      "";
    const phone =
      src?.phone || src?.Phone || src?.user?.phone || src?.profile?.phone || "";
    return {
      role: isAdmin ? "admin" : "member",
      roleId: rid ?? (isAdmin ? 1 : 2),
      full_name: fullName || "",
      fullName: fullName || "",
      phone: phone || "",
    };
  };

  const buildSession = (data, fallbackEmail) => {
    const token =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.tokenString ||
      null;
    const userObj =
      data?.user || data || (fallbackEmail ? { email: fallbackEmail } : {});
    const profileObj =
      data?.profile || mapProfileFromAny(data) || mapProfileFromAny(userObj);
    return { token, user: userObj, profile: profileObj };
  };

  const signUp = async (email, password, fullName, phone = "") => {
    const form = new FormData();
    form.append("Email", email);
    form.append("Password", password);
    form.append("FullName", fullName || "");
    form.append("Phone", phone || "");

    const data = await apiRequest("/api/User/register", {
      method: "POST",
      body: form,
    });

    // Many backends don't return token on register; try auto-login to obtain token
    try {
      const session = await signIn(email, password);
      return session;
    } catch {
      const session = buildSession(data, email);
      try {
        localStorage.setItem("evtb_auth", JSON.stringify(session));
      } catch {}
      setUser(session.user);
      setProfile(session.profile || null);
      return session;
    }
  };

  const signIn = async (email, password) => {
    const data = await apiRequest("/api/User/login", {
      method: "POST",
      body: { email, password },
    });

    console.log("=== SIGNIN DEBUG ===");
    console.log("Login API response:", data);

    const session = buildSession(data, email);
    console.log("Initial session:", session);

    try {
      const uid =
        data?.accountId ||
        data?.userId ||
        session?.user?.id ||
        session?.user?.accountId ||
        session?.user?.userId;

      console.log("User ID for profile fetch:", uid);

      if (uid) {
        const me = await apiRequest(`/api/User/${uid}`);
        console.log("Profile API response:", me);

        if (me) {
          const mergedUser = { ...(session.user || {}), ...(me.user || me) };

          // Check if this is the admin user by email or userId
          const isAdminUser =
            me.email === "admin@gmail.com" || me.userId === 1 || uid === 1;
          if (isAdminUser) {
            console.log("Detected admin user, overriding role");
            mergedUser.roleId = 1;
            mergedUser.role = "admin";
            mergedUser.roleName = "admin";
          }

          session.user = mergedUser;
          session.profile = session.profile || mapProfileFromAny(me);

          // Override profile if admin user
          if (isAdminUser) {
            session.profile.roleId = 1;
            session.profile.role = "admin";
          }

          console.log("Merged user:", mergedUser);
          console.log("Final profile:", session.profile);
        }
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
    }

    try {
      localStorage.setItem("evtb_auth", JSON.stringify(session));
    } catch {}
    setUser(session.user);
    setProfile(session.profile || null);

    console.log("Final session to return:", session);
    console.log("==================");

    return session;
  };

  const signOut = async () => {
    localStorage.removeItem("evtb_auth");
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error("No user logged in");
    const uid = user?.id || user?.accountId || user?.userId;
    if (!uid) throw new Error("Thiếu ID người dùng để cập nhật");
    const data = await apiRequest(`/api/User/${uid}`, {
      method: "PUT",
      body: updates,
    });
    const newProfile = data?.profile || mapProfileFromAny(data) || updates;
    const updatedUser = { ...(data.user || data), ...updates };

    setProfile(newProfile);
    setUser(updatedUser);

    try {
      const raw = localStorage.getItem("evtb_auth");
      const session = raw ? JSON.parse(raw) : {};
      localStorage.setItem(
        "evtb_auth",
        JSON.stringify({
          ...session,
          profile: newProfile,
          user: { ...(session.user || {}), ...updatedUser },
        })
      );
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
    isAdmin: isAdminFrom({ ...(profile || {}), ...(user || {}) }),
    signInWithProvider: (provider) => {
      const prov = provider === "google" ? "google" : "facebook";
      window.location.href = `${API_BASE_URL}/api/Auth/${prov}`;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
