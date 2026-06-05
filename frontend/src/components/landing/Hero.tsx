import type { ReactNode } from "react";
import { T } from "@/lib/tokens";
import { StartPracticingButton } from "@/components/landing/AuthAwareButtons";
import { Container, Eyebrow, GhostButton } from "./shared";

export function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "calc(100dvh - 64px)",
        display: "flex",
        alignItems: "center",
        padding: "clamp(40px, 7vw, 72px) 0",
        overflow: "hidden"
      }}>
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
          pointerEvents: "none"
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
          maskImage: "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,1) 0%, transparent 70%)",
          pointerEvents: "none"
        }}
      />

      <Container>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "clamp(32px, 5vw, 72px)",
            alignItems: "center",
            position: "relative"
          }}
          className="dd-hero-grid">
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
                color: T.text
              }}>
              Learn the skills{" "}
              <span
                style={{
                  fontFamily: T.serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: T.gold
                }}>
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
                margin: "0 0 32px"
              }}>
              Practice the real-world engineering judgment that makes you valuable: debug subtle
              bugs, review code like a senior, and verify AI-generated work before it ships. Train
              the instincts internships actually test for.
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
                fontSize: 12.5
              }}>
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
          color: T.gold
        }}>
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
        perspective: 1400
      }}
      className="dd-hero-mockup">
      {/* ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-10%",
          background:
            "radial-gradient(600px 280px at 60% 30%, rgba(212,168,87,0.12), transparent 70%)",
          filter: "blur(10px)",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "relative",
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset",
          transform: "rotateY(-2deg) rotateX(2deg)"
        }}>
        {/* window chrome */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 32,
            padding: "0 12px",
            borderBottom: `1px solid ${T.line}`,
            background: T.panel
          }}>
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
            minHeight: 360
          }}>
          {/* code panel */}
          <div
            style={{
              background: T.editor,
              padding: "14px 0",
              fontFamily: T.mono,
              fontSize: 12.5,
              lineHeight: "22px"
            }}>
            <CodeRow ln="1" cmt="# AI-generated handler — verify before merge" />
            <CodeRow ln="2">
              <Kw>def</Kw> <Fn>process_payments</Fn>(orders):
            </CodeRow>
            <CodeRow ln="3">
              {" "}
              total = <Num>0</Num>
            </CodeRow>
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
              gap: 12
            }}>
            <div
              style={{
                fontSize: 10.5,
                color: T.textMute,
                letterSpacing: 1.4,
                textTransform: "uppercase"
              }}>
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
                lineHeight: 1.5
              }}>
              <span style={{ color: T.gold, fontWeight: 600 }}>+1 instinct.</span> You caught what
              6/10 reviewers missed.
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
          minWidth: 220
        }}>
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
            fontSize: 12
          }}>
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
  cmt
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
        borderLeft: hl ? `2px solid ${T.red}` : "2px solid transparent"
      }}>
      <span
        style={{
          width: 40,
          flexShrink: 0,
          textAlign: "right",
          paddingRight: 12,
          color: T.textFaint,
          userSelect: "none",
          fontVariantNumeric: "tabular-nums"
        }}>
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
  children
}: {
  tone: "red" | "gold" | "sage";
  label: string;
  children: ReactNode;
}) {
  const palette = {
    red: { bg: "rgba(194,91,86,0.10)", bd: T.red, fg: T.red },
    gold: { bg: "rgba(212,168,87,0.10)", bd: T.gold, fg: T.gold },
    sage: { bg: "rgba(124,159,106,0.10)", bd: T.sage, fg: T.sage }
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
        lineHeight: 1.5
      }}>
      <div
        style={{
          fontSize: 10,
          color: palette.fg,
          letterSpacing: 1,
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 2
        }}>
        {label}
      </div>
      {children}
    </div>
  );
}
