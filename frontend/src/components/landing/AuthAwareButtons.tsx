"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { T } from "@/lib/tokens";
import { useUser, loginHref } from "@/lib/useUser";

const APP_ENTRY = "/practice";

// Replaces the static "Sign in" link in the landing nav. Logged-out users go
// to the existing sign-in flow (preserving the post-login redirect target);
// logged-in users get a "Dashboard" entry into the app.
export function AppNavButton() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    // Reserve the same width as the rendered button to avoid layout shift.
    return (
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 64,
          height: 16,
          borderRadius: 4,
          background: T.panel2,
          opacity: 0.6,
        }}
      />
    );
  }

  if (user) {
    return (
      <Link
        href="/problems"
        style={{
          color: T.textDim,
          fontSize: 13.5,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.gold}, ${T.red})`,
            color: T.bg,
            fontSize: 10,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initialsFor(user.email)}
        </span>
        Dashboard
      </Link>
    );
  }

  return (
    <Link
      href={loginHref("/problems")}
      style={{
        color: T.textDim,
        fontSize: 13.5,
        textDecoration: "none",
      }}
    >
      Sign in
    </Link>
  );
}

// Primary CTA that starts the product experience. Logged-out users bounce
// through /login (with redirect=…); logged-in users land directly in the app.
export function StartPracticingButton({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "md" | "lg";
}) {
  const { user, isLoading } = useUser();
  const href = isLoading || user ? APP_ENTRY : loginHref(APP_ENTRY);

  const padding = size === "lg" ? "13px 22px" : "9px 16px";
  const fontSize = size === "lg" ? 14 : 13;

  return (
    <Link
      href={href}
      aria-busy={isLoading || undefined}
      className="dd-btn-primary"
      style={{
        background: T.gold,
        color: T.bg,
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: 10,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 8px 24px -8px rgba(212,168,87,0.55)",
        transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
        opacity: isLoading ? 0.85 : 1,
      }}
    >
      {children}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M3 7h8M8 3l3 4-3 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

function initialsFor(email: string | undefined | null): string {
  if (!email) return "U";
  const local = email.split("@")[0] ?? "";
  const ch = local.match(/[a-zA-Z0-9]/)?.[0] ?? "U";
  return ch.toUpperCase();
}
