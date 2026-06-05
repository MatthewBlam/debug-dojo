import Link from "next/link";
import type { ReactNode } from "react";
import { T } from "@/lib/tokens";

export function Container({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 clamp(20px, 4vw, 32px)"
      }}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 12px",
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: 999,
        fontSize: 12,
        color: T.textDim,
        fontFamily: T.sans
      }}>
      {children}
    </span>
  );
}

export function SectionEyebrow({
  children,
  centered
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <div style={{ textAlign: centered ? "center" : "left" }}>
      <span
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: T.gold,
          fontFamily: T.mono
        }}>
        {children}
      </span>
    </div>
  );
}

export function SectionTitle({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <h2
      style={{
        fontSize: small ? "clamp(28px, 3.6vw, 40px)" : "clamp(30px, 4.4vw, 48px)",
        fontWeight: 600,
        letterSpacing: -0.8,
        lineHeight: 1.08,
        color: T.text,
        margin: "14px 0 16px",
        maxWidth: 760
      }}>
      {children}
    </h2>
  );
}

export function SectionLead({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "clamp(14px, 1.5vw, 17px)",
        color: T.textDim,
        lineHeight: 1.65,
        margin: 0,
        maxWidth: 640
      }}>
      {children}
    </p>
  );
}

export function GhostButton({
  children,
  href,
  size = "md"
}: {
  children: ReactNode;
  href: string;
  size?: "md" | "lg";
}) {
  const padding = size === "lg" ? "12px 20px" : "8px 14px";
  const fontSize = size === "lg" ? 14 : 13;
  return (
    <Link
      href={href}
      className="dd-btn-ghost"
      style={{
        background: "transparent",
        color: T.text,
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: 10,
        border: `1px solid ${T.line}`,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        transition: "border-color 120ms ease, background 120ms ease"
      }}>
      {children}
    </Link>
  );
}

export function LandingStyles() {
  return (
    <style>{`
      .dd-grid-bg {
        background-image:
          linear-gradient(${T.line} 1px, transparent 1px),
          linear-gradient(90deg, ${T.line} 1px, transparent 1px);
        background-size: 56px 56px;
      }
      .dd-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 14px 36px -10px rgba(212,168,87,0.65); background: #dfb466; }
      .dd-btn-ghost:hover { border-color: ${T.lineStrong}; background: ${T.panel2}; }
      .dd-nav-links a:hover { color: ${T.text}; }
      footer a:hover { color: ${T.text}; }
      .dd-feature-card:hover { border-color: ${T.lineStrong}; transform: translateY(-2px); }
      .dd-float { animation: dd-float 6s ease-in-out infinite; }
      @keyframes dd-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @media (max-width: 880px) {
        .dd-hero-grid, .dd-two-col { grid-template-columns: 1fr !important; }
        .dd-step-arrow { display: none !important; }
        .dd-nav-links { display: none !important; }
      }
    `}</style>
  );
}
