import type { ReactNode } from "react";
import { T } from "@/lib/tokens";
import { Container, SectionEyebrow, SectionTitle, SectionLead } from "./shared";

export function Solution() {
  return (
    <section style={{ padding: "clamp(64px, 9vw, 110px) 0", borderTop: `1px solid ${T.line}` }}>
      <Container>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(32px, 6vw, 72px)",
            alignItems: "center"
          }}
          className="dd-two-col">
          <div>
            <SectionEyebrow>The dojo</SectionEyebrow>
            <SectionTitle small>
              Practice the work,{" "}
              <span
                style={{
                  fontFamily: T.serif,
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: T.gold
                }}>
                not just the syllabus.
              </span>
            </SectionTitle>
            <SectionLead>
              Every drill puts you in front of code that looks almost right — buggy implementations,
              AI-generated suggestions, suspicious pull requests. You debug, review, and explain. We
              score your reasoning, not just the answer.
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
                lineHeight: 1.55
              }}>
              {[
                "Realistic scenarios pulled from internship-level work",
                "Tight feedback loops — minutes per drill, not weeks",
                "Senior-style explanations on every answer",
                "Track the instincts you’re building, not just XP"
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
        justifyContent: "center"
      }}>
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
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6)"
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: T.sage,
            boxShadow: `0 0 0 4px ${T.sageDim}`
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
          marginBottom: 14
        }}>
        <div
          style={{
            fontSize: 11,
            color: T.textMute,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            marginBottom: 8
          }}>
          Prompt
        </div>
        <div style={{ fontSize: 13.5, color: T.text, lineHeight: 1.55 }}>
          AI wrote this <code style={{ fontFamily: T.mono, color: T.gold }}>retry()</code> helper.
          Is it safe to ship?
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
          marginBottom: 14
        }}>
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
        <CodeRow ln="6">
          {"            "}
          <Kw>pass</Kw>
        </CodeRow>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10
        }}>
        <FeedbackTile tone="sage" k="Reasoning" v="Strong — caught silent swallow" />
        <FeedbackTile tone="gold" k="Missed" v="No exponential backoff" />
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
const Num = ({ children }: { children: ReactNode }) => (
  <span style={{ color: T.syn.num }}>{children}</span>
);

function FeedbackTile({ tone, k, v }: { tone: "sage" | "gold"; k: string; v: string }) {
  const c = tone === "sage" ? T.sage : T.gold;
  const bg = tone === "sage" ? T.sageDim : T.goldDim;
  return (
    <div
      style={{
        background: bg,
        borderRadius: 8,
        padding: "10px 12px",
        border: `1px solid ${T.line}`
      }}>
      <div
        style={{
          fontSize: 10.5,
          color: c,
          letterSpacing: 1,
          textTransform: "uppercase",
          fontWeight: 600
        }}>
        {k}
      </div>
      <div style={{ fontSize: 12.5, color: T.text, marginTop: 2 }}>{v}</div>
    </div>
  );
}
