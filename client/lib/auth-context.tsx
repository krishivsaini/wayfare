"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "./types";

type Ctx = {
  user: User | null;
  setUser: (u: User | null) => void;
  loading: boolean;
};

const AuthCtx = createContext<Ctx>({ user: null, setUser: () => {}, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return <AuthCtx.Provider value={{ user, setUser, loading }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
