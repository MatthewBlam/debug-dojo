import Link from "next/link";
import type { CSSProperties } from "react";
import { T } from "@/lib/tokens";
import { BrandMark } from "@/components/BrandMark";
import { AppNavButton, StartPracticingButton } from "@/components/landing/AuthAwareButtons";
import { Container } from "./shared";

export function LandingNav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(13,17,23,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.line}`
      }}>
      <Container>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            gap: 24
          }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: T.text
            }}>
            <BrandMark size={36} />
            <span
              style={{
                fontFamily: T.serif,
                fontStyle: "italic",
                fontSize: 21,
                fontWeight: 400
              }}>
              Debug Dojo
            </span>
          </Link>

          <nav
            className="dd-nav-links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              fontSize: 13.5
            }}>
            <a href="#features" style={navLink}>
              Features
            </a>
            <a href="#how" style={navLink}>
              How it works
            </a>
            <a href="#ai-era" style={navLink}>
              For the AI era
            </a>
            <a href="#audience" style={navLink}>
              Who it&apos;s for
            </a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AppNavButton />
            <StartPracticingButton>Start practicing</StartPracticingButton>
          </div>
        </div>
      </Container>
    </header>
  );
}

export const navLink: CSSProperties = {
  color: T.textDim,
  textDecoration: "none",
  transition: "color 120ms ease"
};
