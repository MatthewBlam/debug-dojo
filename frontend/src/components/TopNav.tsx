"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "@/lib/tokens";
import { useUser } from "@/lib/useUser";
import { supabase } from "@/lib/supabase";
import { BrandMark } from "./BrandMark";

type NavKey = "Problems" | "Submissions" | "Leaderboard" | "Progress";

const NAV: { label: NavKey; href: string }[] = [
  { label: "Problems", href: "/problems" },
  { label: "Submissions", href: "/submissions" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Progress", href: "/progress" },
];

function initialsFor(email: string | undefined | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "";
  const ch = local.match(/[a-zA-Z0-9]/)?.[0] ?? "?";
  return ch.toUpperCase();
}

export function TopNav() {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const active: NavKey | null = pathname?.startsWith("/progress")
    ? "Progress"
    : pathname?.startsWith("/leaderboard")
      ? "Leaderboard"
      : pathname?.startsWith("/submissions")
        ? "Submissions"
        : pathname?.startsWith("/problems") || pathname?.startsWith("/practice")
          ? "Problems"
          : null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div
      style={{
        height: 56,
        background: T.panel,
        borderBottom: `1px solid ${T.line}`,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        flexShrink: 0,
        fontFamily: T.sans,
        gap: 36,
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
        }}
      >
        <BrandMark size={36} />
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: T.text,
            letterSpacing: -0.1,
            whiteSpace: "nowrap",
          }}
        >
          Debug Dojo
        </span>
      </Link>

      <nav style={{ display: "flex", gap: 4 }}>
        {NAV.map((l) => {
          const isActive = l.label === active;
          return (
            <Link
              key={l.label}
              href={l.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                padding: "7px 12px",
                fontSize: 13.5,
                color: isActive ? T.text : T.textDim,
                background: isActive ? T.panel2 : "transparent",
                borderRadius: 6,
                fontWeight: isActive ? 500 : 400,
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {isLoading ? (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: T.panel3,
          }}
        />
      ) : !user ? (
        <Link
          href="/login"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: T.gold,
            textDecoration: "none",
            padding: "6px 14px",
            borderRadius: 6,
            background: T.goldDim,
          }}
        >
          Sign in
        </Link>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px 5px 8px",
              background: T.panel2,
              borderRadius: 999,
              fontSize: 12,
              color: T.textDim,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
              <path
                d="M6.5 1.5C5 3.5 3 4.5 3 7a3.5 3.5 0 007 0c0-1.4-.7-2.5-1.5-3.5 0 1-.7 1.8-1.5 1.8.5-1.5 0-2.7-1.5-3.8z"
                fill={T.gold}
                fillOpacity="0.85"
              />
            </svg>
            <span style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>0</span>
            <span>day streak</span>
          </div>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              title="Account menu"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${T.gold}, ${T.red})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: T.bg,
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {initialsFor(user.email)}
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  right: 0,
                  minWidth: 200,
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 8,
                  padding: "6px 0",
                  zIndex: 100,
                  fontFamily: T.sans,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    padding: "8px 14px 10px",
                    fontSize: 12,
                    color: T.textDim,
                    borderBottom: `1px solid ${T.line}`,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "8px 14px",
                    fontSize: 13,
                    color: T.red,
                    cursor: "pointer",
                    fontFamily: T.sans,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = T.panel3;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
