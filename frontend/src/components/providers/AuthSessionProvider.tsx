"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AUTH_CHANGED_EVENT,
  type AuthUser,
  getStoredAuthUser,
  logout as logoutAuth,
  rehydrateAuthSession,
} from "@/lib/auth";

type AuthSessionContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const nextUser = await rehydrateAuthSession();
    setUser(nextUser);
    setLoading(false);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    setUser(getStoredAuthUser());
    void refresh();

    const handleAuthChanged = () => {
      setUser(getStoredAuthUser());
      void refresh();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
    };
  }, [refresh]);

  const value = useMemo<AuthSessionContextValue>(() => ({
    user,
    loading,
    refresh,
    logout,
  }), [loading, logout, refresh, user]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }
  return context;
}
