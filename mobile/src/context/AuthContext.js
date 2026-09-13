import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import * as authService from "../services/authService";
import { registerSessionExpiredHandler } from "../services/api";
import { clearSession, getSession, saveSession } from "../storage/secureStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [role, setRole] = useState(null); // "citizen" | "admin" | null
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);

  const bootstrap = useCallback(async () => {
    setIsBootstrapping(true);
    try {
      const { token, role: storedRole } = await getSession();
      if (!token || !storedRole) {
        setIsBootstrapping(false);
        return;
      }

      // Trust the stored session immediately so a transient network hiccup
      // during the /me check below can never bounce an already-logged-in
      // user back to the login screen.
      setRole(storedRole);

      const me = await authService.fetchMe();
      if (me.role === "admin") {
        setAdmin(me.admin);
        setRole("admin");
      } else {
        setUser(me.user);
        setRole("citizen");
      }
    } catch (err) {
      if (err?.status === 401) {
        await clearSession();
        setRole(null);
        setUser(null);
        setAdmin(null);
      }
      // Any other error (network hiccup, timeout) — keep the existing
      // session; only a confirmed 401 from the server invalidates it.
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
    registerSessionExpiredHandler(() => {
      setRole(null);
      setUser(null);
      setAdmin(null);
    });
  }, [bootstrap]);

  const loginCitizen = useCallback(async (identifier, password) => {
    const result = await authService.login(identifier, password);
    await saveSession(result.token, "citizen");
    setUser(result.user);
    setRole("citizen");
    return result.user;
  }, []);

  const registerCitizen = useCallback(async (payload) => {
    const result = await authService.register(payload);
    await saveSession(result.token, "citizen");
    setUser(result.user);
    setRole("citizen");
    return result.user;
  }, []);

  const loginAdmin = useCallback(async (username, password) => {
    const result = await authService.adminLogin(username, password);
    await saveSession(result.token, "admin");
    setAdmin(result.admin);
    setRole("admin");
    return result.admin;
  }, []);

  const refreshUser = useCallback((updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      authService.updateLocalUser(merged);
      return merged;
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (_err) {
      // Ignore network errors on logout - clear local session regardless.
    }
    await clearSession();
    setUser(null);
    setAdmin(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      isBootstrapping,
      role,
      user,
      admin,
      isAuthenticated: role !== null,
      loginCitizen,
      registerCitizen,
      loginAdmin,
      refreshUser,
      logout,
    }),
    [isBootstrapping, role, user, admin, loginCitizen, registerCitizen, loginAdmin, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
