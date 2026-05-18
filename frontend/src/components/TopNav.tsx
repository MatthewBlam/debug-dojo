"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { T } from "@/lib/tokens";
import { BrandMark } from "./BrandMark";

type NavKey = "Problems" | "Progress";

const NAV: { label: NavKey; href: string }[] = [
  { label: "Problems", href: "/" },
  { label: "Progress", href: "/progress" },
];

export function TopNav({
  streak = 12,
  level = "Practitioner",
  initials = "RM",
}: {
  streak?: number;
  level?: string;
  initials?: string;
}) {
  const pathname = usePathname();
  const active: NavKey =
    pathname?.startsWith("/progress")
      ? "Progress"
      : "Problems";

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
        <BrandMark size={22} />
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
        <span style={{ color: T.text, fontVariantNumeric: "tabular-nums" }}>{streak}</span>
        <span>day streak</span>
      </div>

      <div style={{ fontSize: 12, color: T.textDim, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.sage }} />
        {level}
      </div>

      <div
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
        }}
      >
        {initials}
      </div>
    </div>
  );
}
