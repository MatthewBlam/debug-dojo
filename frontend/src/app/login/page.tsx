"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { T } from "@/lib/tokens";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

type Mode = "signin" | "signup";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const rawRedirect = params.get("redirect");
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : "/problems";

  const { user, isLoading: authLoading } = useUser();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOauthLoading, setIsOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleGithubSignIn = async () => {
    setIsOauthLoading(true);
    setError(null);
    setInfo(null);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const callback = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: callback },
      });
      if (oauthError) throw oauthError;
      // signInWithOAuth navigates the browser; nothing else to do here.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start GitHub sign-in.",
      );
      setIsOauthLoading(false);
    }
  };

  // Already signed in — bounce straight to the intended destination.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [authLoading, user, redirectTo, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.replace(redirectTo);
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          router.replace(redirectTo);
        } else {
          setInfo(
            "Check your email to confirm your account, then sign in to continue.",
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(700px 400px at 50% 0%, rgba(212,168,87,0.10), transparent 60%),
            radial-gradient(500px 300px at 50% 100%, rgba(125,169,201,0.06), transparent 60%)
          `,
          pointerEvents: "none",
        }}
      />

      <header
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: T.text,
            textDecoration: "none",
          }}
        >
          <BrandMark size={20} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Debug Dojo</span>
        </Link>
        <Link
          href="/"
          style={{
            color: T.textDim,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          ← Back to home
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 16,
            padding: "32px 28px",
            boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: T.gold,
                fontFamily: T.mono,
                marginBottom: 8,
              }}
            >
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: -0.4,
                margin: 0,
                color: T.text,
              }}
            >
              {mode === "signin" ? (
                <>
                  Sign in to{" "}
                  <span
                    style={{
                      fontFamily: T.serif,
                      fontStyle: "italic",
                      fontWeight: 400,
                      color: T.gold,
                    }}
                  >
                    Debug Dojo
                  </span>
                </>
              ) : (
                <>Start training your engineering instincts.</>
              )}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleGithubSignIn}
            disabled={isOauthLoading || isSubmitting || authLoading}
            style={{
              width: "100%",
              background: T.panel2,
              color: T.text,
              border: `1px solid ${T.line}`,
              padding: "11px 14px",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 500,
              fontFamily: T.sans,
              cursor: isOauthLoading ? "wait" : "pointer",
              opacity: isOauthLoading ? 0.75 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "background 120ms ease, border-color 120ms ease",
              marginBottom: 18,
            }}
            className="dd-oauth-btn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            {isOauthLoading ? "Redirecting to GitHub…" : "Continue with GitHub"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "0 0 18px",
              color: T.textMute,
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            <span style={{ flex: 1, height: 1, background: T.lineSoft }} />
            <span>or with email</span>
            <span style={{ flex: 1, height: 1, background: T.lineSoft }} />
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="Password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={setPassword}
              required
              minLength={6}
              hint={mode === "signup" ? "At least 6 characters" : undefined}
            />

            {error ? (
              <div
                role="alert"
                style={{
                  fontSize: 12.5,
                  color: T.red,
                  background: T.redDim,
                  border: `1px solid ${T.red}40`,
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            ) : null}
            {info ? (
              <div
                role="status"
                style={{
                  fontSize: 12.5,
                  color: T.sage,
                  background: T.sageDim,
                  border: `1px solid ${T.sage}40`,
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                {info}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              style={{
                marginTop: 6,
                background: T.gold,
                color: T.bg,
                border: "none",
                padding: "12px 16px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: T.sans,
                cursor: isSubmitting ? "wait" : "pointer",
                opacity: isSubmitting ? 0.75 : 1,
                boxShadow: "0 8px 24px -8px rgba(212,168,87,0.55)",
                transition: "transform 120ms ease, opacity 120ms ease",
              }}
            >
              {isSubmitting
                ? mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: `1px solid ${T.lineSoft}`,
              fontSize: 12.5,
              color: T.textDim,
              textAlign: "center",
            }}
          >
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                  style={linkBtn}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setInfo(null);
                  }}
                  style={linkBtn}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const linkBtn = {
  background: "transparent",
  border: "none",
  color: T.gold,
  fontFamily: T.sans,
  fontSize: 12.5,
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
};

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  hint,
}: {
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: T.textDim }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        style={{
          background: T.bg,
          border: `1px solid ${T.line}`,
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 13.5,
          color: T.text,
          fontFamily: T.sans,
          outline: "none",
          transition: "border-color 120ms ease",
        }}
        className="dd-input"
      />
      {hint ? (
        <span style={{ fontSize: 11, color: T.textMute }}>{hint}</span>
      ) : null}
      <style>{`
        .dd-input:focus { border-color: ${T.gold}; }
      `}</style>
    </label>
  );
}
