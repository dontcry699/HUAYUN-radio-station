import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: "broadcaster" | "admin";
  grade?: string | null;
  className?: string | null;
  status: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBroadcaster: boolean;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("cr-token");
      const u = localStorage.getItem("cr-user");
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${BASE()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "登录失败");
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("cr-token", data.token);
    localStorage.setItem("cr-user", JSON.stringify(data.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("cr-token");
    localStorage.removeItem("cr-user");
  }, []);

  const authFetch = useCallback((url: string, init: RequestInit = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> ?? {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${BASE()}${url}`, { ...init, headers });
  }, [token]);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, authFetch,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      isBroadcaster: user?.role === "broadcaster" || user?.role === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
