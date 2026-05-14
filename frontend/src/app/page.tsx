import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { T } from "@/lib/tokens";
import { BrandMark } from "@/components/BrandMark";
import { StartPracticingButton } from "@/components/landing/AuthAwareButtons";

export const metadata = {
  title: "Debug Dojo — Practice the judgment CS classes don't teach",
  description:
    "Train the real-world engineering instincts that make CS students valuable: debug subtle bugs, review code, and verify AI-generated work before your next internship or job.",
};

export default function LandingPage() {
  return (
    <div
      style={{
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
        minHeight: "100dvh",
        overflowX: "hidden",
      }}
    >
      <LandingNav />
      <Hero />
      <SocialProof />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks />
      <AiEra />
      <Audience />
      <FinalCta />
      <Footer />
      <LandingStyles />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── nav ── */

function LandingNav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(13,17,23,0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${T.line}`,
      }}
    >
      <Container>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            gap: 24,
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: T.text,
            }}
          >
            <BrandMark size={22} />
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.1 }}>
              Debug Dojo
            </span>
          </Link>

          <nav
            className="dd-nav-links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              fontSize: 13.5,
            }}
          >
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
            <Link
              href="/login"
              style={{
                color: T.textDim,
                fontSize: 13.5,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="dd-btn-primary"
              style={{
                background: T.gold,
                color: T.bg,
                padding: "9px 16px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 10,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 24px -8px rgba(212,168,87,0.55)",
                transition:
                  "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
              }}
            >
              Start practicing
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M3 7h8M8 3l3 4-3 4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

const navLink: CSSProperties = {
  color: T.textDim,
  textDecoration: "none",
  transition: "color 120ms ease",
};

/* ──────────────────────────────────────────────────────────── hero ── */

function Hero() {
  return (
    <section
      style={{
        position: "relative",
        padding: "clamp(64px, 10vw, 120px) 0 clamp(56px, 8vw, 96px)",
        overflow: "hidden",
      }}
    >
      {/* ambient gradient */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(900px 600px at 80% -10%, rgba(212,168,87,0.10), transparent 60%),
            radial-gradient(800px 500px at 10% 110%, rgba(125,169,201,0.08), transparent 60%)
          `,
          pointerEvents: "none",
        }}
      />
      {/* grid background */}
      <div
        aria-hidden
        className="dd-grid-bg"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          maskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Container>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "clamp(32px, 5vw, 72px)",
            alignItems: "center",
            position: "relative",
          }}
          className="dd-hero-grid"
        >
          <div>
            <Eyebrow>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.gold }} />
              Built for the AI-native engineer
            </Eyebrow>

            <h1
              style={{
                fontSize: "clamp(40px, 6.4vw, 68px)",
                fontWeight: 600,
                letterSpacing: -1.2,
                lineHeight: 1.02,
                margin: "20px 0 22px",
                color: T.text,
              }}
            >
              Learn the skills{" "}
              <span
                style={{
                  fontFamily: T.serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: T.gold,
                }}
              >
                CS classes
              </span>{" "}
              don&apos;t teach.
            </h1>

            <p
              style={{
                fontSize: "clamp(15px, 1.6vw, 18px)",
                lineHeight: 1.6,
                color: T.textDim,
                maxWidth: 560,
                margin: "0 0 32px",
              }}
            >
              Practice the real-world engineering judgment that makes you valuable:
              debug subtle bugs, review code like a senior, and verify AI-generated
              work before it ships. Train the instincts internships actually test for.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <StartPracticingButton size="lg">
                Start practicing — it&apos;s free
              </StartPracticingButton>
              <GhostButton href="#how" size="lg">
                See how it works
              </GhostButton>
            </div>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 22px",
                color: T.textMute,
                fontSize: 12.5,
              }}
            >
              <HeroFact icon="bug">Realistic buggy code</HeroFact>
              <HeroFact icon="ai">AI output to evaluate</HeroFact>
              <HeroFact icon="review">Senior-style feedback</HeroFact>
            </div>
          </div>

          <HeroMockup />
        </div>
      </Container>
    </section>
  );
}

function HeroFact({ icon, children }: { icon: "bug" | "ai" | "review"; children: ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background: T.panel,
          border: `1px solid ${T.line}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.gold,
        }}
      >
        {icon === "bug" ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="6" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M3 7H1.5M10.5 7H9M6 4V2.5M4 4l-1-1M8 4l1-1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        ) : icon === "ai" ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M6 1.5L7.2 4.3 10 5l-2.8.7L6 8.5 4.8 5.7 2 5l2.8-.7L6 1.5z"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M3 5l2 2 4-4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {children}
    </span>
  );
}

function HeroMockup() {
  return (
    <div
      style={{
        position: "relative",
        perspective: 1400,
      }}
      className="dd-hero-mockup"
    >
      {/* ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-10%",
          background:
            "radial-gradient(600px 280px at 60% 30%, rgba(212,168,87,0.12), transparent 70%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow:
            "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset",
          transform: "rotateY(-2deg) rotateX(2deg)",
        }}
      >
        {/* window chrome */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 32,
            padding: "0 12px",
            borderBottom: `1px solid ${T.line}`,
            background: T.panel,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#4a525d" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#4a525d" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#4a525d" }} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: T.textMute, fontFamily: T.mono }}>
            review · pr/142
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px",
            minHeight: 360,
          }}
        >
          {/* code panel */}
          <div
            style={{
              background: T.editor,
              padding: "14px 0",
              fontFamily: T.mono,
              fontSize: 12.5,
              lineHeight: "22px",
            }}
          >
            <CodeRow ln="1" cmt="# AI-generated handler — verify before merge" />
            <CodeRow ln="2">
              <Kw>def</Kw> <Fn>process_payments</Fn>(orders):
            </CodeRow>
            <CodeRow ln="3">    total = <Num>0</Num></CodeRow>
            <CodeRow ln="4">
              {"    "}
              <Kw>for</Kw> order <Kw>in</Kw> orders:
            </CodeRow>
            <CodeRow ln="5" hl>
              {"        "}total += order[<Str>&quot;amount&quot;</Str>]
            </CodeRow>
            <CodeRow ln="6">
              {"    "}
              <Kw>return</Kw> total / <Fn>len</Fn>(orders)
            </CodeRow>
            <CodeRow ln="7" />
            <CodeRow ln="8" cmt="# Tests: passes 7/8 — does that mean it's correct?" />
          </div>

          {/* review side panel */}
          <div
            style={{
              background: T.panel,
              borderLeft: `1px solid ${T.line}`,
              padding: "14px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 10.5, color: T.textMute, letterSpacing: 1.4, textTransform: "uppercase" }}>
              Your review
            </div>

            <ReviewPill tone="red" label="Bug found">
              Divides by zero on empty <code style={{ fontFamily: T.mono }}>orders</code>.
            </ReviewPill>
            <ReviewPill tone="gold" label="Edge case">
              Mixed currencies aren&apos;t handled.
            </ReviewPill>
            <ReviewPill tone="sage" label="Verified">
              Loop accumulation looks correct.
            </ReviewPill>

            <div
              style={{
                marginTop: "auto",
                padding: "10px 12px",
                borderRadius: 8,
                background: T.bg,
                border: `1px solid ${T.lineSoft}`,
                fontSize: 11.5,
                color: T.textDim,
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: T.gold, fontWeight: 600 }}>+1 instinct.</span> You
              caught what 6/10 reviewers missed.
            </div>
          </div>
        </div>
      </div>

      {/* floating AI verdict chip */}
      <div
        className="dd-float"
        style={{
          position: "absolute",
          left: -18,
          bottom: -22,
          padding: "12px 14px",
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 12,
          fontSize: 12,
          color: T.text,
          boxShadow: "0 20px 50px -10px rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 220,
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${T.gold}, ${T.red})`,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: T.bg,
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          AI
        </span>
        <div>
          <div style={{ fontSize: 11, color: T.textMute }}>Generated by Copilot</div>
          <div style={{ fontSize: 12.5, color: T.text }}>
            Confidence:{" "}
            <span style={{ color: T.gold, fontVariantNumeric: "tabular-nums" }}>87%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeRow({
  ln,
  children,
  hl,
  cmt,
}: {
  ln: string;
  children?: ReactNode;
  hl?: boolean;
  cmt?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: hl ? "rgba(194,91,86,0.10)" : "transparent",
        borderLeft: hl ? `2px solid ${T.red}` : "2px solid transparent",
      }}
    >
      <span
        style={{
          width: 40,
          flexShrink: 0,
          textAlign: "right",
          paddingRight: 12,
          color: T.textFaint,
          userSelect: "none",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {ln}
      </span>
      <span style={{ flex: 1, whiteSpace: "pre", color: T.text, paddingRight: 14 }}>
        {cmt ? <span style={{ color: T.syn.cmt, fontStyle: "italic" }}>{cmt}</span> : children}
      </span>
    </div>
  );
}

const Kw = ({ children }: { children: ReactNode }) => (
  <span style={{ color: T.syn.kw }}>{children}</span>
);
const Fn = ({ children }: { children: ReactNode }) => (
  <span style={{ color: T.syn.fn }}>{children}</span>
);
const Str = ({ children }: { children: ReactNode }) => (
  <span style={{ color: T.syn.str }}>{children}</span>
);
const Num = ({ children }: { children: ReactNode }) => (
  <span style={{ color: T.syn.num }}>{children}</span>
);

function ReviewPill({
  tone,
  label,
  children,
}: {
  tone: "red" | "gold" | "sage";
  label: string;
  children: ReactNode;
}) {
  const palette = {
    red: { bg: "rgba(194,91,86,0.10)", bd: T.red, fg: T.red },
    gold: { bg: "rgba(212,168,87,0.10)", bd: T.gold, fg: T.gold },
    sage: { bg: "rgba(124,159,106,0.10)", bd: T.sage, fg: T.sage },
  }[tone];
  return (
    <div
      style={{
        padding: "10px 12px",
        background: palette.bg,
        borderLeft: `2px solid ${palette.bd}`,
        borderRadius: 6,
        fontSize: 12,
        color: T.textDim,
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontSize: 10, color: palette.fg, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────── social proof ── */

function SocialProof() {
  const items = [
    "Built for CS students & interns",
    "Senior-style feedback",
    "AI-native workflows",
    "Code review reps",
    "Real-world scenarios",
    "Practical, not theoretical",
  ];
  return (
    <section style={{ padding: "32px 0", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, background: T.panel }}>
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
            fontFamily: T.sans,
          }}
        >
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

/* ───────────────────────────────────────────────────────── problem ── */

function Problem() {
  return (
    <section style={{ padding: "clamp(64px, 9vw, 110px) 0" }}>
      <Container>
        <SectionEyebrow>The gap</SectionEyebrow>
        <SectionTitle>
          CS classes teach theory.{" "}
          <span style={{ color: T.textDim, fontWeight: 400 }}>
            Internships expect judgment.
          </span>
        </SectionTitle>
        <SectionLead>
          You can ace algorithms, finish the projects, and still freeze the first time
          a senior asks <em>“Is this AI suggestion actually correct?”</em> The skills
          that matter on the job rarely show up on an exam.
        </SectionLead>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 44,
          }}
        >
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
            body="“LGTM 👍” isn't a review. Real engineers explain tradeoffs, missing tests, and risk."
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
        padding: "22px 22px 24px",
      }}
    >
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
          marginBottom: 14,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 1v8M7 12.5v0.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6, letterSpacing: -0.2 }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, color: T.textDim, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── solution ── */

function Solution() {
  return (
    <section style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}>
      <Container>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(32px, 6vw, 72px)",
            alignItems: "center",
          }}
          className="dd-two-col"
        >
          <div>
            <SectionEyebrow>The dojo</SectionEyebrow>
            <SectionTitle small>
              Practice the work,{" "}
              <span
                style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 400, color: T.gold }}
              >
                not just the syllabus.
              </span>
            </SectionTitle>
            <SectionLead>
              Every drill puts you in front of code that looks almost right — buggy
              implementations, AI-generated suggestions, suspicious pull requests.
              You debug, review, and explain. We score your reasoning, not just the
              answer.
            </SectionLead>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "28px 0 0",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                fontSize: 14,
                color: T.textDim,
                lineHeight: 1.55,
              }}
            >
              {[
                "Realistic scenarios pulled from internship-level work",
                "Tight feedback loops — minutes per drill, not weeks",
                "Senior-style explanations on every answer",
                "Track the instincts you're building, not just XP",
              ].map((line) => (
                <li key={line} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <CheckDot />
                  <span style={{ color: T.text }}>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <SolutionMockup />
        </div>
      </Container>
    </section>
  );
}

function CheckDot() {
  return (
    <span
      style={{
        marginTop: 3,
        width: 18,
        height: 18,
        flexShrink: 0,
        borderRadius: "50%",
        background: T.sageDim,
        color: T.sage,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M3 6.5l2 2 4-4.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function SolutionMockup() {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: 14,
        padding: 22,
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: T.sage,
            boxShadow: `0 0 0 4px ${T.sageDim}`,
          }}
        />
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>Drill #047</div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: T.textMute, fontFamily: T.mono }}>3m 12s</span>
      </div>

      <div
        style={{
          background: T.bg,
          borderRadius: 10,
          padding: "14px 16px",
          border: `1px solid ${T.lineSoft}`,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: T.textMute,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 8,
          }}
        >
          Prompt
        </div>
        <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.55 }}>
          AI wrote this <code style={{ fontFamily: T.mono, color: T.gold }}>retry()</code>{" "}
          helper. Is it safe to ship?
        </div>
      </div>

      <div
        style={{
          background: T.editor,
          borderRadius: 10,
          padding: "12px 0",
          fontFamily: T.mono,
          fontSize: 12.5,
          lineHeight: "22px",
          marginBottom: 14,
        }}
      >
        <CodeRow ln="1">
          <Kw>def</Kw> <Fn>retry</Fn>(fn, attempts=<Num>3</Num>):
        </CodeRow>
        <CodeRow ln="2">
          {"    "}
          <Kw>for</Kw> _ <Kw>in</Kw> <Fn>range</Fn>(attempts):
        </CodeRow>
        <CodeRow ln="3">
          {"        "}
          <Kw>try</Kw>:
        </CodeRow>
        <CodeRow ln="4">
          {"            "}
          <Kw>return</Kw> <Fn>fn</Fn>()
        </CodeRow>
        <CodeRow ln="5" hl>
          {"        "}
          <Kw>except</Kw> Exception:
        </CodeRow>
        <CodeRow ln="6">{"            "}<Kw>pass</Kw></CodeRow>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <FeedbackTile tone="sage" k="Reasoning" v="Strong — caught silent swallow" />
        <FeedbackTile tone="gold" k="Missed" v="No exponential backoff" />
      </div>
    </div>
  );
}

function FeedbackTile({ tone, k, v }: { tone: "sage" | "gold"; k: string; v: string }) {
  const c = tone === "sage" ? T.sage : T.gold;
  const bg = tone === "sage" ? T.sageDim : T.goldDim;
  return (
    <div
      style={{
        background: bg,
        borderRadius: 8,
        padding: "10px 12px",
        border: `1px solid ${T.line}`,
      }}
    >
      <div style={{ fontSize: 10.5, color: c, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
        {k}
      </div>
      <div style={{ fontSize: 12.5, color: T.text, marginTop: 2 }}>{v}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── features ── */

function Features() {
  const items: { title: string; body: string; icon: ReactNode }[] = [
    {
      title: "AI output review",
      body: "Practice catching the bugs, hallucinations, and lazy patterns that AI confidently outputs.",
      icon: <IconSpark />,
    },
    {
      title: "Bug spotting drills",
      body: "Subtle defects, off-by-ones, race conditions, and silent failures — before they ship.",
      icon: <IconBug />,
    },
    {
      title: "Code review reps",
      body: "Read a diff, flag risks, suggest tests. Build the muscle senior engineers actually use.",
      icon: <IconReview />,
    },
    {
      title: "Real-world scenarios",
      body: "Drills modeled on intern tickets and junior-engineer work — not toy textbook puzzles.",
      icon: <IconBriefcase />,
    },
    {
      title: "Reasoning feedback",
      body: "Every drill explains why an answer holds up, what you missed, and how a senior would think.",
      icon: <IconBrain />,
    },
    {
      title: "Career-ready instincts",
      body: "Train the judgment that shows up in interviews, code reviews, and your first production PR.",
      icon: <IconTrophy />,
    },
  ];

  return (
    <section id="features" style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}>
      <Container>
        <SectionEyebrow>The toolkit</SectionEyebrow>
        <SectionTitle>
          Everything you need to{" "}
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 400, color: T.gold }}>
            think like an engineer.
          </span>
        </SectionTitle>
        <SectionLead>
          Each feature is a feedback loop. Each loop sharpens a different instinct.
          Stack them and you stop guessing.
        </SectionLead>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 44,
          }}
        >
          {items.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: ReactNode;
}) {
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
        transition: "border-color 160ms ease, transform 160ms ease",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(400px 200px at 80% -10%, rgba(212,168,87,0.06), transparent 60%)",
          pointerEvents: "none",
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
          border: `1px solid rgba(212,168,87,0.25)`,
        }}
      >
        {icon}
      </div>
      <div style={{ position: "relative", fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6, letterSpacing: -0.2 }}>
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
    <path d="M9 2.5l1.6 4.4 4.4 1.6-4.4 1.6L9 14.5l-1.6-4.4L3 8.5l4.4-1.6L9 2.5z" stroke="currentColor" strokeWidth="1.4" style={iconStroke} />
  </svg>
);
const IconBug = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <rect x="5" y="6" width="8" height="8" rx="4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 9h3M13 9h3M9 3v3M5 4l1.5 1.5M13 4l-1.5 1.5M3 15l2-1M15 15l-2-1" stroke="currentColor" strokeWidth="1.4" style={iconStroke} />
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
    <path d="M6.5 5.5V4a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0111.5 4v1.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);
const IconBrain = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M9 4.5C7 2.5 3.5 3.5 3.5 7c0 1 .5 1.8 1 2.4-.5.6-1 1.5-1 2.6 0 2.5 2.5 3.5 4.5 2.5C9 16 11 15 11.5 13c2 .5 4-1 4-3.5 0-1-.5-1.8-1-2.4.5-.6 1-1.5 1-2.6 0-3-3.5-4-5.5-2-.5-.6-1.5-1-2-1z" stroke="currentColor" strokeWidth="1.3" style={iconStroke} />
  </svg>
);
const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M5 3h8v3a4 4 0 11-8 0V3z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5 5H3v1a2 2 0 002 2M13 5h2v1a2 2 0 01-2 2M7 11.5h4M6.5 14.5h5" stroke="currentColor" strokeWidth="1.4" style={iconStroke} />
  </svg>
);

/* ──────────────────────────────────────────────────── how it works ── */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Get a realistic scenario",
      body: "Buggy code, an AI-generated PR, or a suspicious diff lands in your dojo. Same vibe as your first day on the job.",
    },
    {
      n: "02",
      title: "Review, debug, evaluate",
      body: "Find the defect. Flag the risk. Decide whether you'd merge it. Explain your reasoning the way a senior would.",
    },
    {
      n: "03",
      title: "Build better instincts",
      body: "Get senior-style feedback on every move. Watch your judgment compound across drills.",
    },
  ];
  return (
    <section id="how" style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}>
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
            gap: 16,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{
                position: "relative",
                background: T.panel,
                border: `1px solid ${T.line}`,
                borderRadius: 14,
                padding: "26px 22px",
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.gold,
                  letterSpacing: 1.4,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                STEP {s.n}
                <span style={{ flex: 1, height: 1, background: T.line }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 8, letterSpacing: -0.2 }}>
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
                    color: T.lineStrong,
                  }}
                >
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                    <path d="M1 7h17M14 2l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

/* ─────────────────────────────────────────────────────── AI era ── */

function AiEra() {
  return (
    <section
      id="ai-era"
      style={{
        position: "relative",
        padding: "clamp(72px, 10vw, 130px) 0",
        borderTop: `1px solid ${T.line}`,
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(700px 400px at 50% 0%, rgba(212,168,87,0.10), transparent 60%),
            radial-gradient(500px 300px at 50% 100%, rgba(125,169,201,0.06), transparent 60%)
          `,
          pointerEvents: "none",
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
              color: T.text,
            }}
          >
            The new edge isn&apos;t writing code.{" "}
            <span style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 400, color: T.gold }}>
              It&apos;s knowing when it&apos;s wrong.
            </span>
          </h2>
          <p
            style={{
              fontSize: "clamp(15px, 1.5vw, 17px)",
              lineHeight: 1.7,
              color: T.textDim,
              margin: "0 auto",
              maxWidth: 680,
            }}
          >
            AI can ship a draft in seconds. What it can&apos;t do is tell you whether to
            trust it. Debug Dojo trains the judgment layer on top of AI — so you become
            the engineer who can confidently supervise the machine, not the one blindly
            shipping its output.
          </p>

          <div
            style={{
              marginTop: 44,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              textAlign: "left",
            }}
          >
            <AiTile
              k="Trust"
              v="Stop accepting AI output on faith. Verify it like a reviewer."
            />
            <AiTile
              k="Guide"
              v="Spot bad suggestions early. Steer the model toward what you actually need."
            />
            <AiTile k="Improve" v="Turn rough AI drafts into shippable, tested, intentional code." />
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
        padding: "18px 18px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: T.gold,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {k}
      </div>
      <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.55 }}>{v}</div>
    </div>
  );
}

/* ───────────────────────────────────────────────────── audience ── */

function Audience() {
  const groups = [
    { t: "CS students", b: "Bridge the gap between coursework and real engineering work." },
    { t: "Internship candidates", b: "Walk in already knowing how seniors evaluate code." },
    { t: "New grads", b: "Hit production reviews with confidence, not panic." },
    { t: "Self-taught devs", b: "Skip years of trial-and-error feedback loops." },
    { t: "AI-tool power users", b: "Become the operator the model needs above it." },
  ];
  return (
    <section
      id="audience"
      style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}
    >
      <Container>
        <SectionEyebrow>Who it&apos;s for</SectionEyebrow>
        <SectionTitle>Built for the people doing the work.</SectionTitle>
        <SectionLead>
          Whether you&apos;re prepping for your first internship or shipping with Copilot
          every day, Debug Dojo meets you where you are.
        </SectionLead>

        <div
          style={{
            marginTop: 44,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {groups.map((g) => (
            <div
              key={g.t}
              style={{
                background: T.panel,
                border: `1px solid ${T.line}`,
                borderRadius: 12,
                padding: "20px 20px",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>{g.t}</div>
              <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>{g.b}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────────────────────────────── final CTA ── */

function FinalCta() {
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
            textAlign: "center",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(600px 400px at 50% -10%, rgba(212,168,87,0.18), transparent 70%)",
              pointerEvents: "none",
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
                color: T.text,
              }}
            >
              Start training the instincts{" "}
              <span style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 400, color: T.gold }}>
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
                maxWidth: 560,
              }}
            >
              One drill takes a few minutes. The judgment compounds for years.
            </p>
            <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <StartPracticingButton size="lg">
                Start practicing — free
              </StartPracticingButton>
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

/* ────────────────────────────────────────────────────── footer ── */

function Footer() {
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
            fontSize: 12.5,
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <BrandMark size={18} />
            <span style={{ color: T.text, fontWeight: 500 }}>Debug Dojo</span>
            <span>· Practice the judgment CS classes don&apos;t teach.</span>
          </div>
          <div style={{ display: "inline-flex", gap: 18 }}>
            <a href="#features" style={navLink}>
              Features
            </a>
            <a href="#how" style={navLink}>
              How it works
            </a>
            <Link href="/problems" style={navLink}>
              Problems
            </Link>
            <Link href="/practice" style={navLink}>
              Demo
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

/* ────────────────────────────────────────────────── primitives ── */

function Container({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 clamp(20px, 4vw, 32px)",
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
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
        fontFamily: T.sans,
      }}
    >
      {children}
    </span>
  );
}

function SectionEyebrow({ children, centered }: { children: ReactNode; centered?: boolean }) {
  return (
    <div style={{ textAlign: centered ? "center" : "left" }}>
      <span
        style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: T.gold,
          fontFamily: T.mono,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function SectionTitle({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <h2
      style={{
        fontSize: small ? "clamp(28px, 3.6vw, 40px)" : "clamp(30px, 4.4vw, 48px)",
        fontWeight: 600,
        letterSpacing: -0.8,
        lineHeight: 1.08,
        color: T.text,
        margin: "14px 0 16px",
        maxWidth: 760,
      }}
    >
      {children}
    </h2>
  );
}

function SectionLead({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "clamp(14px, 1.5vw, 17px)",
        color: T.textDim,
        lineHeight: 1.65,
        margin: 0,
        maxWidth: 640,
      }}
    >
      {children}
    </p>
  );
}

function GhostButton({
  children,
  href,
  size = "md",
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
        transition: "border-color 120ms ease, background 120ms ease",
      }}
    >
      {children}
    </Link>
  );
}

/* ────────────────────────────────── styles (hover + responsive) ── */

function LandingStyles() {
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
