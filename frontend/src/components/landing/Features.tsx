import type { CSSProperties, ReactNode } from "react";
import { T } from "@/lib/tokens";
import { Container, SectionEyebrow, SectionTitle, SectionLead } from "./shared";

export function Features() {
  const items: { title: string; body: string; icon: ReactNode }[] = [
    {
      title: "AI output review",
      body: "Practice catching the bugs, hallucinations, and lazy patterns that AI confidently outputs.",
      icon: <IconSpark />
    },
    {
      title: "Bug spotting drills",
      body: "Subtle defects, off-by-ones, race conditions, and silent failures — before they ship.",
      icon: <IconBug />
    },
    {
      title: "Code review reps",
      body: "Read a diff, flag risks, suggest tests. Build the muscle senior engineers actually use.",
      icon: <IconReview />
    },
    {
      title: "Real-world scenarios",
      body: "Drills modeled on intern tickets and junior-engineer work — not toy textbook puzzles.",
      icon: <IconBriefcase />
    },
    {
      title: "Reasoning feedback",
      body: "Every drill explains why an answer holds up, what you missed, and how a senior would think.",
      icon: <IconBrain />
    },
    {
      title: "Career-ready instincts",
      body: "Train the judgment that shows up in interviews, code reviews, and your first production PR.",
      icon: <IconTrophy />
    }
  ];

  return (
    <section
      id="features"
      style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}>
      <Container>
        <SectionEyebrow>The toolkit</SectionEyebrow>
        <SectionTitle>
          Everything you need to{" "}
          <span
            style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 400, color: T.gold }}>
            think like an engineer.
          </span>
        </SectionTitle>
        <SectionLead>
          Each feature is a feedback loop. Each loop sharpens a different instinct. Stack them and
          you stop guessing.
        </SectionLead>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 44
          }}>
          {items.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({ title, body, icon }: { title: string; body: string; icon: ReactNode }) {
  return (
    <div
      className="dd-feature-card"
      style={{
        position: "relative",
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: 14,
        padding: "22px",
        overflow: "hidden",
        transition: "border-color 160ms ease, transform 160ms ease"
      }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(400px 200px at 80% -10%, rgba(212,168,87,0.06), transparent 60%)",
          pointerEvents: "none"
        }}
      />
      <div
        style={{
          position: "relative",
          width: 36,
          height: 36,
          borderRadius: 10,
          background: T.goldDim,
          color: T.gold,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          border: `1px solid rgba(212,168,87,0.25)`
        }}>
        {icon}
      </div>
      <div
        style={{
          position: "relative",
          fontSize: 16,
          fontWeight: 600,
          color: T.text,
          marginBottom: 6,
          letterSpacing: -0.2
        }}>
        {title}
      </div>
      <div style={{ position: "relative", fontSize: 13.5, color: T.textDim, lineHeight: 1.6 }}>
        {body}
      </div>
    </div>
  );
}

const iconStroke: CSSProperties = { strokeLinecap: "round", strokeLinejoin: "round" };
const IconSpark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path
      d="M9 2.5l1.6 4.4 4.4 1.6-4.4 1.6L9 14.5l-1.6-4.4L3 8.5l4.4-1.6L9 2.5z"
      stroke="currentColor"
      strokeWidth="1.4"
      style={iconStroke}
    />
  </svg>
);
const IconBug = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <rect x="5" y="6" width="8" height="8" rx="4" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M2 9h3M13 9h3M9 3v3M5 4l1.5 1.5M13 4l-1.5 1.5M3 15l2-1M15 15l-2-1"
      stroke="currentColor"
      strokeWidth="1.4"
      style={iconStroke}
    />
  </svg>
);
const IconReview = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M3 4h12M3 9h8M3 14h12" stroke="currentColor" strokeWidth="1.4" style={iconStroke} />
    <circle cx="13.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <rect x="2.5" y="5.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M6.5 5.5V4a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0111.5 4v1.5"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);
const IconBrain = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path
      d="M9 4.5C7 2.5 3.5 3.5 3.5 7c0 1 .5 1.8 1 2.4-.5.6-1 1.5-1 2.6 0 2.5 2.5 3.5 4.5 2.5C9 16 11 15 11.5 13c2 .5 4-1 4-3.5 0-1-.5-1.8-1-2.4.5-.6 1-1.5 1-2.6 0-3-3.5-4-5.5-2-.5-.6-1.5-1-2-1z"
      stroke="currentColor"
      strokeWidth="1.3"
      style={iconStroke}
    />
  </svg>
);
const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M5 3h8v3a4 4 0 11-8 0V3z" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M5 5H3v1a2 2 0 002 2M13 5h2v1a2 2 0 01-2 2M7 11.5h4M6.5 14.5h5"
      stroke="currentColor"
      strokeWidth="1.4"
      style={iconStroke}
    />
  </svg>
);
