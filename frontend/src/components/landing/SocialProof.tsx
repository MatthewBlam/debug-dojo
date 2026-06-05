import { T } from "@/lib/tokens";
import { Container } from "./shared";

export function SocialProof() {
  const items = [
    "Built for CS students & interns",
    "Senior-style feedback",
    "AI-native workflows",
    "Code review reps",
    "Real-world scenarios",
    "Practical, not theoretical"
  ];
  return (
    <section
      style={{
        padding: "32px 0",
        borderTop: `1px solid ${T.line}`,
        borderBottom: `1px solid ${T.line}`,
        background: T.panel
      }}>
      <Container>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px 36px",
            color: T.textMute,
            fontSize: 12.5,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            fontFamily: T.sans
          }}>
          {items.map((s, i) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
              {s}
              {i < items.length - 1 ? (
                <span
                  aria-hidden
                  style={{ width: 4, height: 4, borderRadius: "50%", background: T.lineStrong }}
                />
              ) : null}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
