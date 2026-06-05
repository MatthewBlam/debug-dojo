import { T } from "@/lib/tokens";
import { Container, SectionEyebrow, SectionTitle, SectionLead } from "./shared";

export function Problem() {
  return (
    <section style={{ padding: "clamp(64px, 9vw, 110px) 0" }}>
      <Container>
        <SectionEyebrow>The gap</SectionEyebrow>
        <SectionTitle>
          CS classes teach theory.{" "}
          <span style={{ color: T.textDim, fontWeight: 400 }}>Internships expect judgment.</span>
        </SectionTitle>
        <SectionLead>
          You can ace algorithms, finish the projects, and still freeze the first time a senior asks{" "}
          <em>&quot;Is this AI suggestion actually correct?&quot;</em> The skills that matter on the
          job rarely show up on an exam.
        </SectionLead>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 44
          }}>
          <PainCard
            title="The silent bug"
            body="Tests pass, code reviews approve, and the off-by-one only shows up in production at 2am."
          />
          <PainCard
            title="The confident AI answer"
            body="Copilot returns a clean-looking function. Is it right? Is it efficient? Does it handle empty input?"
          />
          <PainCard
            title="The vague pull request"
            body={`"LGTM \u{1F44D}" isn’t a review. Real engineers explain tradeoffs, missing tests, and risk.`}
          />
        </div>
      </Container>
    </section>
  );
}

function PainCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: 14,
        padding: "22px 22px 24px"
      }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: T.redDim,
          color: T.red,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14
        }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path
            d="M7 1v8M7 12.5v0.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: T.text,
          marginBottom: 6,
          letterSpacing: -0.2
        }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, color: T.textDim, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}
