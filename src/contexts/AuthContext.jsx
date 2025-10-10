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
          try {
            const parsed = JSON.parse(raw);
            setUser(parsed?.user || null);
            setProfile(parsed?.profile || null);
          } catch (parseError) {
            console.warn("Corrupted auth data, clearing localStorage");
            localStorage.removeItem("evtb_auth");
          }
        }
        // Try load current user from backend to get freshest name/profile
        try {
          const me = await apiRequest("/api/User/me");
          if (me) {
            // Normalize user data to ensure consistent field names
            const userData = me.user || me;
            const normalizedUser = {
              ...userData,
              fullName:
                userData.fullName || userData.full_name || userData.name,
              email: userData.email,
              phone: userData.phone,
              id: userData.userId || userData.id || userData.accountId,
              userId: userData.userId || userData.id || userData.accountId,
              roleId: userData.roleId || userData.role || userData.roleId,
              roleName: userData.roleName || userData.role || userData.roleName,
            };

            const mergedUser = {
              ...normalizedUser,
              ...(me.profile ? { profile: me.profile } : {}),
            };
            setUser((u) => ({ ...(u || {}), ...mergedUser }));
            if (me.profile) setProfile(me.profile);

            // Optimize localStorage storage
            try {
              const raw2 = localStorage.getItem("evtb_auth");
              const sess = raw2 ? JSON.parse(raw2) : {};
              const optimizedAuth = {
                token: sess.token,
                user: mergedUser,
                profile: me.profile || sess.profile,
              };
              localStorage.setItem("evtb_auth", JSON.stringify(optimizedAuth));
            } catch (storageError) {
              console.warn("Could not save optimized auth data:", storageError);
            }
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

  // Utility function to clear localStorage when quota is exceeded
  const clearAuthStorage = () => {
    try {
      localStorage.removeItem("evtb_auth");
      console.log("Auth storage cleared");
    } catch (error) {
      console.error("Could not clear auth storage:", error);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // Optimize localStorage storage to prevent quota exceeded
      const authData = localStorage.getItem("evtb_auth");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);

          // Store only essential data to reduce size
          const optimizedAuth = {
            token: parsed.token,
            user: {
              id: updatedUser.id || updatedUser.userId,
              email: updatedUser.email,
              fullName: updatedUser.fullName || updatedUser.full_name,
              phone: updatedUser.phone,
              avatar: updatedUser.avatar,
              roleId: updatedUser.roleId,
              roleName: updatedUser.roleName,
            },
            profile: parsed.profile
              ? {
                  id: parsed.profile.id,
                  fullName: parsed.profile.fullName || parsed.profile.full_name,
                  phone: parsed.profile.phone,
                }
              : null,
          };

          localStorage.setItem("evtb_auth", JSON.stringify(optimizedAuth));
        } catch (storageError) {
          console.warn("Could not save to localStorage:", storageError);
          // Clear old data and try again with minimal data
          localStorage.removeItem("evtb_auth");
          const minimalAuth = {
            token: parsed?.token,
            user: {
              id: updatedUser.id || updatedUser.userId,
              email: updatedUser.email,
              fullName: updatedUser.fullName || updatedUser.full_name,
            },
          };
          localStorage.setItem("evtb_auth", JSON.stringify(minimalAuth));
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error; // Re-throw to let Profile component handle it
    }
  };

  const buildSession = (data, email) => {
    // Normalize possible backend shapes
    const normalizedToken =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.tokenString ||
      data?.data?.token ||
      data?.data?.accessToken ||
      data?.data?.jwt ||
      data?.result?.token ||
      data?.result?.accessToken ||
      data?.result?.jwt ||
      data?.data?.data?.token ||
      data?.data?.data?.accessToken ||
      data?.data?.data?.jwt;

    const normalizedUser =
      data?.user ||
      data?.data?.user ||
      data?.result?.user ||
      data?.data?.data?.user ||
      data?.data?.data?.data?.user ||
      null;

    const normalizedProfile =
      data?.profile ||
      data?.data?.profile ||
      data?.result?.profile ||
      data?.data?.data?.profile ||
      data?.data?.data?.data?.profile ||
      null;

    // If we have user data, normalize it
    if (normalizedUser) {
      const userData = normalizedUser;
      const normalizedUserData = {
        ...userData,
        fullName: userData.fullName || userData.full_name || userData.name,
        email: userData.email || email,
        phone: userData.phone,
        id: userData.userId || userData.id || userData.accountId,
        userId: userData.userId || userData.id || userData.accountId,
        roleId: userData.roleId || userData.role || userData.roleId,
        roleName: userData.roleName || userData.role || userData.roleName,
      };

      return {
        token: normalizedToken,
        user: normalizedUserData,
        profile: normalizedProfile,
      };
    }

    // If no user data but we have email, create minimal user object
    if (email) {
      return {
        token: normalizedToken,
        user: {
          email: email,
          id: data?.userId || data?.id || data?.accountId,
          userId: data?.userId || data?.id || data?.accountId,
        },
        profile: normalizedProfile,
      };
    }

    return {
      token: normalizedToken,
      user: null,
      profile: normalizedProfile,
    };
  };

  const signUp = async (email, password, fullName, phone = "") => {
    console.log("Register data being sent:", {
      email,
      password,
      fullName,
      phone,
      full_name: fullName,
    });

    // Try FormData first since it seems to work (gets past validation)
    let data;
    let lastError;

    try {
      console.log("Trying FormData first (seems to work for validation)...");
      const form = new FormData();
      form.append("Email", email);
      form.append("Password", password);
      form.append("FullName", fullName);
      form.append("Phone", phone);
      form.append("RoleId", "2");
      form.append("AccountStatus", "Active");

      data = await apiRequest("/api/User/register", {
        method: "POST",
        body: form,
      });
      console.log("FormData succeeded:", data);
    } catch (formError) {
      console.log("FormData failed:", formError.message);
      lastError = formError;

      // If FormData failed, try JSON formats
      const possibleFormats = [
        // Format 1: Direct PascalCase with Password
        {
          Email: email,
          Password: password,
          FullName: fullName,
          Phone: phone,
        },
        // Format 2: With RoleId and AccountStatus
        {
          Email: email,
          Password: password,
          FullName: fullName,
          Phone: phone,
          RoleId: 2,
          AccountStatus: "Active",
        },
        // Format 3: camelCase
        {
          email: email,
          password: password,
          fullName: fullName,
          phone: phone,
          roleId: 2,
          accountStatus: "Active",
        },
      ];

      // Try each JSON format
      for (let i = 0; i < possibleFormats.length; i++) {
        try {
          console.log(`Trying JSON format ${i + 1}:`, possibleFormats[i]);
          data = await apiRequest("/api/User/register", {
            method: "POST",
            body: possibleFormats[i],
          });
          console.log(`JSON format ${i + 1} succeeded:`, data);
          break; // Success, exit loop
        } catch (error) {
          console.log(`JSON format ${i + 1} failed:`, error.message);
          lastError = error;
        }
      }
    }

    // If all attempts failed, throw the last error
    if (!data) {
      throw (
        lastError ||
        new Error("Registration failed: All data formats rejected by server")
      );
    }

    // Try different response formats to find what backend returns
    const possibleResponseFormats = [
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

    for (const format of possibleResponseFormats) {
      if (!format) continue;

      console.log("Trying response format:", format);

      // Check if this format has the expected structure
      const hasToken =
        format?.token ||
        format?.accessToken ||
        format?.jwt ||
        format?.tokenString;
      const hasUser =
        format?.user || format?.userId || format?.id || format?.accountId;

      if (hasToken || hasUser) {
        console.log("Found valid response format:", format);

        // Normalize possible backend shapes
        const normalizedToken =
          format?.token ||
          format?.accessToken ||
          format?.jwt ||
          format?.tokenString;

        const userData = format?.user || format;
        const normalizedUser = {
          ...userData,
          fullName:
            userData.fullName ||
            userData.full_name ||
            userData.name ||
            fullName,
          email: userData.email || email,
          phone: userData.phone || phone,
          id: userData.userId || userData.id || userData.accountId,
          userId: userData.userId || userData.id || userData.accountId,
          roleId: userData.roleId || userData.role || userData.roleId,
          roleName: userData.roleName || userData.role || userData.roleName,
        };

        const session = {
          token: normalizedToken,
          user: normalizedUser,
          profile: format?.profile || null,
        };

        console.log("Register response:", data);

        localStorage.setItem("evtb_auth", JSON.stringify(session));
        setUser(session.user);
        setProfile(session.profile || null);
        return session;
      }
    }

    // Many backends don't return token on register; try auto-login to obtain token
    try {
      console.log(
        "No token in registration response, attempting auto-login..."
      );
      const session = await signIn(email, password);
      localStorage.setItem("evtb_auth", JSON.stringify(session));
      setUser(session.user);
      setProfile(session.profile || null);
      return session;
    } catch (loginError) {
      console.error("Auto-login after register failed:", loginError);
      throw new Error(
        "Registration completed but auto-login failed. Please try logging in manually."
      );
    }
  };

  const signIn = async (email, password) => {
    const data = await apiRequest("/api/User/login", {
      method: "POST",
      body: { email, password },
    });

    // Normalize possible backend shapes
    const normalizedToken =
      data?.token ||
      data?.accessToken ||
      data?.jwt ||
      data?.tokenString ||
      data?.data?.token ||
      data?.data?.accessToken ||
      data?.data?.jwt ||
      data?.result?.token ||
      data?.result?.accessToken ||
      data?.result?.jwt ||
      data?.data?.data?.token ||
      data?.data?.data?.accessToken ||
      data?.data?.data?.jwt;

    const normalizedUser =
      data?.user ||
      data?.data?.user ||
      data?.result?.user ||
      data?.data?.data?.user ||
      data?.data?.data?.data?.user ||
      null;

    const normalizedProfile =
      data?.profile || data?.data?.profile || data?.result?.profile || null;

    console.log("=== SIGNIN DEBUG ===");
    console.log("Login API response:", data);
    console.log("Normalized user data:", normalizedUser);
    console.log("User roleId:", normalizedUser?.roleId);
    console.log("User roleName:", normalizedUser?.roleName);
    console.log("Data role:", data?.role);
    console.log("Data accountId:", data?.accountId);

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
        userId: userData.userId || userData.id || userData.accountId,
        roleId: userData.roleId || userData.role || userData.roleId,
        roleName: userData.roleName || userData.role || userData.roleName,
      };

      session.user = normalizedUserData;
    }

    // If no user data but we have role and accountId from backend response
    if (!session.user && data?.role && data?.accountId) {
      console.log("Creating user from role and accountId");
      session.user = {
        email: email,
        id: data.accountId,
        userId: data.accountId,
        roleId: data.role,
        role: data.role,
      };
    }

    // Try to get full user profile from /api/User (fallback if /api/User/me fails)
    try {
      console.log("=== FETCHING USER PROFILE ===");
      console.log("Current email:", email);
      console.log("Current session user before update:", session.user);
      
      const usersData = await apiRequest("/api/User", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.token}`,
        },
      });
      console.log("User API response:", usersData);
      console.log("Users data type:", typeof usersData);
      console.log("Is array:", Array.isArray(usersData));

      if (Array.isArray(usersData)) {
        console.log("Total users found:", usersData.length);
        console.log("All user emails:", usersData.map(u => u.email));
        
        // Find current user by email
        const currentUser = usersData.find((u) => u.email === email);
        console.log("Found current user:", currentUser);
        console.log("Current user fullName:", currentUser?.fullName);
        console.log("Current user phone:", currentUser?.phone);

        if (currentUser) {
          const fullUserData = {
            ...session.user,
            fullName:
              currentUser.fullName ||
              currentUser.full_name ||
              currentUser.name ||
              session.user?.fullName,
            phone: currentUser.phone || session.user?.phone,
            email: currentUser.email || email,
            avatar: currentUser.avatar || session.user?.avatar,
            id:
              currentUser.userId ||
              currentUser.id ||
              currentUser.accountId ||
              session.user?.id,
            userId:
              currentUser.userId ||
              currentUser.id ||
              currentUser.accountId ||
              session.user?.userId,
            roleId:
              currentUser.roleId || currentUser.role || session.user?.roleId,
            roleName:
              currentUser.roleName ||
              currentUser.role ||
              session.user?.roleName,
          };

          console.log("Updated user with full profile:", fullUserData);
          console.log("Final fullName:", fullUserData.fullName);
          console.log("Final phone:", fullUserData.phone);
          session.user = fullUserData;
          
          // Update localStorage and state to trigger re-render
          localStorage.setItem("evtb_auth", JSON.stringify(session));
          setUser(session.user);
        } else {
          console.warn("No user found with email:", email);
        }
      } else {
        console.warn("Users data is not an array:", usersData);
      }
      console.log("=== END FETCHING USER PROFILE ===");
    } catch (userError) {
      console.warn(
        "Failed to fetch user profile from /api/User:",
        userError.message
      );
    }

    // TEMPORARY FIX: Override roleId for admin@gmail.com
    if (session.user && email === "admin@gmail.com") {
      console.log("TEMPORARY FIX: Overriding roleId for admin@gmail.com");
      session.user.roleId = 1;
      session.user.role = 1;
    }

    // If no user data but we have email, create minimal user object
    if (!session.user && email) {
      session.user = {
        email: email,
        id: data?.userId || data?.id || data?.accountId,
        userId: data?.userId || data?.id || data?.accountId,
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
    clearAuthStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
