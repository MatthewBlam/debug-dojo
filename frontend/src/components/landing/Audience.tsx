import { T } from "@/lib/tokens";
import { Container, SectionEyebrow, SectionTitle, SectionLead } from "./shared";

export function Audience() {
  const groups = [
    { t: "CS students", b: "Bridge the gap between coursework and real engineering work." },
    { t: "Internship candidates", b: "Walk in already knowing how seniors evaluate code." },
    { t: "New grads", b: "Hit production reviews with confidence, not panic." },
    { t: "Self-taught devs", b: "Skip years of trial-and-error feedback loops." },
    { t: "AI-tool power users", b: "Become the operator the model needs above it." }
  ];
  return (
    <section
      id="audience"
      style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}>
      <Container>
        <SectionEyebrow>Who it&apos;s for</SectionEyebrow>
        <SectionTitle>Built for the people doing the work.</SectionTitle>
        <SectionLead>
          Whether you&apos;re prepping for your first internship or shipping with Copilot every day,
          Debug Dojo meets you where you are.
        </SectionLead>

        <div
          style={{
            marginTop: 44,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14
          }}>
          {groups.map((g) => (
            <div
              key={g.t}
              style={{
                background: T.panel,
                border: `1px solid ${T.line}`,
                borderRadius: 12,
                padding: "20px 20px"
              }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                {g.t}
              </div>
              <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>{g.b}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
