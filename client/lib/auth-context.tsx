"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "./api";
import type { User } from "./types";

type Ctx = {
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
};

const AuthCtx = createContext<Ctx>({ user: null, setUser: () => {}, loading: true });

const PUBLIC_PATHS = ["/login", "/signup"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname ?? "")) {
      setLoading(false);
      return;
    }
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  return <AuthCtx.Provider value={{ user, setUser, loading }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
