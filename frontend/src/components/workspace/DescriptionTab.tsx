import ReactMarkdown from "react-markdown";

import { T } from "@/lib/tokens";
import { Tag } from "@/components/Tag";
import type { WorkspaceProblem } from "./types";

export function DescriptionTab({ problem }: { problem: WorkspaceProblem | null }) {
  if (!problem) return null;
  return (
    <>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: T.text,
          margin: "0 0 14px",
          letterSpacing: -0.2
        }}>
        {problem.title}
      </h2>

      <div style={{ color: T.textDim, fontSize: 13.5, lineHeight: 1.65 }} className="dd-markdown">
        <ReactMarkdown>{problem.description}</ReactMarkdown>
      </div>

      {problem.expectedExamples && problem.expectedExamples.length > 0 ? (
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 8,
            padding: "14px 16px",
            margin: "18px 0"
          }}>
          <div
            style={{
              fontSize: 10,
              color: T.textMute,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              marginBottom: 8
            }}>
            Expected behaviour
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 12.5,
              color: T.textDim,
              lineHeight: 1.75
            }}>
            {problem.expectedExamples.map((ex, i) => (
              <div key={i}>
                {ex.call} <span style={{ color: T.textFaint }}>→</span>{" "}
                <span style={{ color: T.syn.num }}>{ex.result}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {problem.prompt ? (
        <div
          style={{
            padding: "12px 16px",
            background: T.redDim,
            borderRadius: 8,
            borderLeft: `2px solid ${T.red}`,
            margin: "18px 0"
          }}>
          <div
            style={{
              fontSize: 10.5,
              color: T.red,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              marginBottom: 4,
              fontWeight: 600
            }}>
            Bug-finding prompt
          </div>
          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>{problem.prompt}</div>
        </div>
      ) : null}

      {problem.tags && problem.tags.length > 0 ? (
        <>
          <h3
            style={{
              fontSize: 11,
              color: T.textMute,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              margin: "24px 0 10px"
            }}>
            Tags
          </h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {problem.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </>
      ) : null}

      <style>{`
        .dd-markdown code { font-family: ${T.mono}; background: ${T.panel}; color: ${T.text}; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
        .dd-markdown p { margin: 0 0 12px; }
        .dd-markdown ul, .dd-markdown ol { margin: 0 0 12px; padding-left: 20px; }
        .dd-markdown pre { background: ${T.panel}; border: 1px solid ${T.line}; border-radius: 8px; padding: 12px 14px; overflow-x: auto; }
        .dd-markdown pre code { background: transparent; padding: 0; }
        .dd-markdown strong { color: ${T.text}; }
      `}</style>
    </>
  );
}
