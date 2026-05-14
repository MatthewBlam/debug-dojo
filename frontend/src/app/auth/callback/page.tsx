"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { T } from "@/lib/tokens";
import { supabase } from "@/lib/supabase";

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rawRedirect = params.get("redirect");
    const redirectTo =
      rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : "/problems";

    void (async () => {
      try {
        // Provider returned an explicit error in the query/hash.
        const providerError =
          params.get("error_description") || params.get("error");
        if (providerError) throw new Error(providerError);

        const code = params.get("code");
        if (code) {
          // PKCE flow — exchange the one-time code for a session.
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          // Implicit flow — supabase-js parses #access_token=… on init when
          // detectSessionInUrl is on (default). Give it a tick to settle.
          await new Promise((r) => setTimeout(r, 50));
        }

        router.replace(redirectTo);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not complete sign-in.",
        );
      }
    })();
  }, [params, router]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        {error ? (
          <>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: T.red,
                fontFamily: T.mono,
                marginBottom: 10,
              }}
            >
              Sign-in error
            </div>
            <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5, marginBottom: 18 }}>
              {error}
            </div>
            <a
              href="/login"
              style={{
                color: T.gold,
                fontSize: 13,
                textDecoration: "underline",
              }}
            >
              Try again
            </a>
          </>
        ) : (
          <>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `2px solid ${T.line}`,
                borderTopColor: T.gold,
                margin: "0 auto 16px",
                animation: "dd-spin 0.9s linear infinite",
              }}
            />
            <div style={{ fontSize: 13, color: T.textDim }}>Finishing sign-in…</div>
            <style>{`@keyframes dd-spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}
