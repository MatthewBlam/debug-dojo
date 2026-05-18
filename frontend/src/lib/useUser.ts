"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

// Tracks the current Supabase auth user. Keeps a single subscription open and
// uses `getSession()` so we don't flicker between logged-out and logged-in on
// first paint. Components consuming this should render a skeleton while
// `isLoading` is true.
export function useUser(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setState({ user: data.session?.user ?? null, isLoading: false });
      } catch {
        // Supabase env vars missing or client misconfigured. Treat as
        // logged-out so the landing page still works.
        if (active) setState({ user: null, isLoading: false });
      }
    })();

    let unsubscribe: (() => void) | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({ user: session?.user ?? null, isLoading: false });
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // ignore — same fallback as above
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return state;
}

// Builds the URL a logged-out user should click into. The real /login route
// (whichever auth flow we add later) is expected to read `redirect` and bounce
// the user back to it after sign-in.
export function loginHref(redirectTo: string): string {
  const target = encodeURIComponent(redirectTo);
  return `/login?redirect=${target}`;
}
