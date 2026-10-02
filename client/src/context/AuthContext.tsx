import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "../types";
import { authService } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lsf_user");
    const token = localStorage.getItem("lsf_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await authService.login({ email, password });
    localStorage.setItem("lsf_token", res.token);
    localStorage.setItem("lsf_user", JSON.stringify(res.user));
    setUser(res.user);
    return res.user as User;
  }

  async function register(data: any) {
    const res = await authService.register(data);
    localStorage.setItem("lsf_token", res.token);
    localStorage.setItem("lsf_user", JSON.stringify(res.user));
    setUser(res.user);
    return res.user as User;
  }

  function logout() {
    localStorage.removeItem("lsf_token");
    localStorage.removeItem("lsf_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
