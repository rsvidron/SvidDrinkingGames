import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./authContext";

export interface AccessState {
  loading: boolean;
  hasAccess: boolean;
  freeWeekend: boolean;
  freeWeekendUntil: Date | null;
  bestGrant: null | {
    type: "day_pass" | "lifetime" | "license_key" | "admin";
    expires_at: string | null;
  };
  refresh: () => Promise<void>;
}

export function useAccess(): AccessState {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [freeWeekend, setFreeWeekend] = useState(false);
  const [freeWeekendUntil, setFreeWeekendUntil] = useState<Date | null>(null);
  const [bestGrant, setBestGrant] = useState<AccessState["bestGrant"]>(null);

  async function load() {
    if (!user) {
      setLoading(false);
      setHasAccess(false);
      setFreeWeekend(false);
      setFreeWeekendUntil(null);
      setBestGrant(null);
      return;
    }
    setLoading(true);

    const [settingsRes, grantsRes] = await Promise.all([
      supabase
        .from("app_settings")
        .select("free_weekend_from, free_weekend_to")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("grants")
        .select("type, expires_at")
        .eq("user_id", user.id),
    ]);

    const now = Date.now();
    let fw = false;
    let fwUntil: Date | null = null;
    if (
      settingsRes.data?.free_weekend_from &&
      settingsRes.data?.free_weekend_to
    ) {
      const from = new Date(settingsRes.data.free_weekend_from).getTime();
      const to = new Date(settingsRes.data.free_weekend_to).getTime();
      if (from <= now && to >= now) {
        fw = true;
        fwUntil = new Date(to);
      }
    }

    const active =
      grantsRes.data?.filter(
        (g) => !g.expires_at || new Date(g.expires_at).getTime() > now
      ) ?? [];
    const priorityOrder = ["admin", "lifetime", "license_key", "day_pass"];
    const best =
      active.sort(
        (a, b) => priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
      )[0] ?? null;

    // Admin users always have access (bypass free-weekend check).
    const admin = profile?.is_admin ?? false;

    setFreeWeekend(fw);
    setFreeWeekendUntil(fwUntil);
    setBestGrant(best);
    setHasAccess(admin || fw || !!best);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.is_admin]);

  return {
    loading,
    hasAccess,
    freeWeekend,
    freeWeekendUntil,
    bestGrant,
    refresh: load,
  };
}
