import { T } from "@/lib/tokens";
import { Container, SectionEyebrow } from "./shared";

export function AiEra() {
  return (
    <section
      id="ai-era"
      style={{
        position: "relative",
        padding: "clamp(72px, 10vw, 130px) 0",
        borderTop: `1px solid ${T.line}`,
        overflow: "hidden"
      }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(700px 400px at 50% 0%, rgba(212,168,87,0.10), transparent 60%),
            radial-gradient(500px 300px at 50% 100%, rgba(125,169,201,0.06), transparent 60%)
          `,
          pointerEvents: "none"
        }}
      />
      <Container>
        <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto", position: "relative" }}>
          <SectionEyebrow centered>For the AI era</SectionEyebrow>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 600,
              letterSpacing: -1,
              lineHeight: 1.05,
              margin: "16px 0 22px",
              color: T.text
            }}>
            The new edge isn&apos;t writing code.{" "}
            <span
              style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 400, color: T.gold }}>
              It&apos;s knowing when it&apos;s wrong.
            </span>
          </h2>
          <p
            style={{
              fontSize: "clamp(15px, 1.5vw, 17px)",
              lineHeight: 1.7,
              color: T.textDim,
              margin: "0 auto",
              maxWidth: 680
            }}>
            AI can ship a draft in seconds. What it can&apos;t do is tell you whether to trust it.
            Debug Dojo trains the judgment layer on top of AI — so you become the engineer who can
            confidently supervise the machine, not the one blindly shipping its output.
          </p>

          <div
            style={{
              marginTop: 44,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              textAlign: "left"
            }}>
            <AiTile k="Trust" v="Stop accepting AI output on faith. Verify it like a reviewer." />
            <AiTile
              k="Guide"
              v="Spot bad suggestions early. Steer the model toward what you actually need."
            />
            <AiTile
              k="Improve"
              v="Turn rough AI drafts into shippable, tested, intentional code."
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function AiTile({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: 12,
        padding: "18px 18px"
      }}>
      <div
        style={{
          fontSize: 11,
          color: T.gold,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 8
        }}>
        {k}
      </div>
      <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.55 }}>{v}</div>
    </div>
  );
}
