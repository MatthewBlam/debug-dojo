import Link from "next/link";
import type { CSSProperties } from "react";
import { T } from "@/lib/tokens";
import { BrandMark } from "@/components/BrandMark";
import { Container } from "./shared";

export function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.line}`, padding: "32px 0", marginTop: 24 }}>
      <Container>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            color: T.textMute,
            fontSize: 12.5
          }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <BrandMark size={28} />
            <span style={{ color: T.text, fontWeight: 500 }}>Debug Dojo</span>
            <span>&middot; Practice the judgment CS classes don&apos;t teach.</span>
          </div>
          <div style={{ display: "inline-flex", gap: 18 }}>
            <a href="#features" style={footerLink}>
              Features
            </a>
            <a href="#how" style={footerLink}>
              How it works
            </a>
            <Link href="/problems" style={footerLink}>
              Problems
            </Link>
            <Link href="/practice" style={footerLink}>
              Demo
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

const footerLink: CSSProperties = {
  color: T.textDim,
  textDecoration: "none",
  transition: "color 120ms ease"
};
