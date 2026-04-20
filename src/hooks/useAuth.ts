"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

/* ================= HOOK useAuth ================= */
export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    /* ==== Cargar perfil inicial ==== */
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*, sede:sedes(*)")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    loadProfile();

    /* ==== Escuchar cambios de sesión ==== */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_OUT") {
          setProfile(null);
        } else {
          loadProfile();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* ====== Logout ====== */
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return { profile, loading, signOut };
}
