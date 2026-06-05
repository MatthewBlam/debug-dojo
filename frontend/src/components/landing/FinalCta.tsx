import { T } from "@/lib/tokens";
import { StartPracticingButton } from "@/components/landing/AuthAwareButtons";
import { Container, GhostButton } from "./shared";

export function FinalCta() {
  return (
    <section style={{ padding: "clamp(72px, 10vw, 130px) 0", borderTop: `1px solid ${T.line}` }}>
      <Container>
        <div
          style={{
            position: "relative",
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 20,
            padding: "clamp(40px, 6vw, 72px)",
            overflow: "hidden",
            textAlign: "center"
          }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(600px 400px at 50% -10%, rgba(212,168,87,0.18), transparent 70%)",
              pointerEvents: "none"
            }}
          />
          <div style={{ position: "relative" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4.4vw, 44px)",
                fontWeight: 600,
                letterSpacing: -0.8,
                margin: "0 0 14px",
                lineHeight: 1.08,
                color: T.text
              }}>
              Start training the instincts{" "}
              <span
                style={{
                  fontFamily: T.serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: T.gold
                }}>
                great engineers
              </span>{" "}
              get hired for.
            </h2>
            <p
              style={{
                fontSize: "clamp(14px, 1.5vw, 17px)",
                color: T.textDim,
                margin: "0 auto 28px",
                lineHeight: 1.6,
                maxWidth: 560
              }}>
              One drill takes a few minutes. The judgment compounds for years.
            </p>
            <div
              style={{
                display: "inline-flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "center"
              }}>
              <StartPracticingButton size="lg">Start practicing — free</StartPracticingButton>
              <GhostButton href="/problems" size="lg">
                Browse drills
              </GhostButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
