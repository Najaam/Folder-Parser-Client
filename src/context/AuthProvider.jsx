import { useEffect, useMemo, useState } from "react";
import {
  fetchProfile,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  setAccessToken
} from "../api/authApi";
import AuthContext from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    refreshSession()
      .then((data) => {
        if (isMounted) {
          setUser(data.user);
        }
      })
      .catch(() => {
        setAccessToken(null);
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setAuthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      async register(payload) {
        const data = await registerUser(payload);
        // Don't set user here — redirect to login after registration
        return data;
      },
      async login(payload) {
        const data = await loginUser(payload);
        setUser(data.user);
        return data;
      },
      async logout() {
        await logoutUser().catch(() => {});
        setAccessToken(null);
        setUser(null);
      },
      async reloadProfile() {
        const data = await fetchProfile();
        setUser(data.user);
        return data.user;
      }
    }),
    [authLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
