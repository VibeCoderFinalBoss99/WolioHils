import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  /** Dari `profiles.display_name` (fallback ke email). */
  profileDisplayName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (!s?.user) {
      setIsAdmin(false);
      setProfileDisplayName(null);
      return;
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", s.user.id)
      .maybeSingle();
    if (error) {
      console.error(error);
      setIsAdmin(false);
      setProfileDisplayName(null);
      return;
    }
    const row = data as { role?: string; display_name?: string | null } | null;
    const role = row?.role;
    setIsAdmin(role === "admin");
    const dn = row?.display_name?.trim();
    setProfileDisplayName(dn || s.user.email || null);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (cancelled) return;
      if (error) {
        // Sering: refresh token kedaluwarsa / tidak valid → 400 di Network; bersihkan agar login normal.
        console.warn("[auth] Sesi lokal tidak valid, dibersihkan:", error.message);
        void supabase.auth.signOut().finally(() => {
          if (!cancelled) {
            void applySession(null);
            setLoading(false);
          }
        });
        return;
      }
      void applySession(s);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      void applySession(s);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const supabase = getSupabase();
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    await applySession(s);
  }, [applySession]);

  const value = useMemo(
    () => ({ session, user, isAdmin, profileDisplayName, loading, signOut, refreshProfile }),
    [session, user, isAdmin, profileDisplayName, loading, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus di dalam AuthProvider");
  return ctx;
}
