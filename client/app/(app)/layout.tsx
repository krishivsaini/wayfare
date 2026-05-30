"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Navbar, Spinner } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function logout() {
    try {
      await api.logout();
    } catch {
      // ignore — clearing client state regardless
    }
    setUser(null);
    router.replace("/login");
  }

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Spinner size={22} color="var(--ink-3)" />
      </div>
    );
  }

  return (
    <>
      <Navbar userEmail={user.email} onLogout={logout} />
      {children}
    </>
  );
}
