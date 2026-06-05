import { T } from "@/lib/tokens";
import { Container, SectionEyebrow, SectionTitle } from "./shared";

export function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Get a realistic scenario",
      body: "Buggy code, an AI-generated PR, or a suspicious diff lands in your dojo. Same vibe as your first day on the job."
    },
    {
      n: "02",
      title: "Review, debug, evaluate",
      body: "Find the defect. Flag the risk. Decide whether you’d merge it. Explain your reasoning the way a senior would."
    },
    {
      n: "03",
      title: "Build better instincts",
      body: "Get senior-style feedback on every move. Watch your judgment compound across drills."
    }
  ];
  return (
    <section
      id="how"
      style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}>
      <Container>
        <SectionEyebrow>How it works</SectionEyebrow>
        <SectionTitle>
          Three steps.{" "}
          <span style={{ color: T.textDim, fontWeight: 400 }}>One sharper engineer.</span>
        </SectionTitle>

        <div
          style={{
            marginTop: 44,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16
          }}>
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{
                position: "relative",
                background: T.panel,
                border: `1px solid ${T.line}`,
                borderRadius: 14,
                padding: "26px 22px"
              }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.gold,
                  letterSpacing: 1.4,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10
                }}>
                STEP {s.n}
                <span style={{ flex: 1, height: 1, background: T.line }} />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: T.text,
                  marginBottom: 8,
                  letterSpacing: -0.2
                }}>
                {s.title}
              </div>
              <div style={{ fontSize: 13.5, color: T.textDim, lineHeight: 1.6 }}>{s.body}</div>
              {i < steps.length - 1 ? (
                <div
                  aria-hidden
                  className="dd-step-arrow"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: -14,
                    transform: "translateY(-50%)",
                    color: T.lineStrong
                  }}>
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                    <path
                      d="M1 7h17M14 2l5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
