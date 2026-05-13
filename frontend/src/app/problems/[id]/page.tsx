"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { EditorProps } from "@monaco-editor/react";

import { supabase } from "@/lib/supabase";
import { T } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";
import { Tag } from "@/components/Tag";
import { Difficulty, toDifficultyLevel } from "@/components/Difficulty";

const MonacoEditor = dynamic<EditorProps>(() => import("@monaco-editor/react"), {
  ssr: false,
});

type ProblemRecord = {
  id: string;
  title: string;
  description: string;
  slop_code: string;
  difficulty: string | null;
  bug_category: string | null;
  target_complexity: string | null;
};

type SubmitResult = {
  verdict: "pass" | "fail";
  stdout: string;
};

type Tab = "description" | "hints" | "discussion" | "solutions";
type ConsoleTab = "console" | "tests" | "diagnostics";

const TABS: { key: Tab; label: string; badge?: string; locked?: boolean }[] = [
  { key: "description", label: "Description" },
  { key: "hints", label: "Hints", badge: "3" },
  { key: "discussion", label: "Discussion", badge: "128" },
  { key: "solutions", label: "Solutions", locked: true },
];

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [problemId, setProblemId] = useState<string>("");
  const [problem, setProblem] = useState<ProblemRecord | null>(null);
  const [code, setCode] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [tab, setTab] = useState<Tab>("description");
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>("console");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setIsLoading(true);
      setError(null);
      setSubmitResult(null);

      const resolvedParams = await params;
      if (!isMounted) return;
      setProblemId(resolvedParams.id);

      const { data, error: queryError } = await supabase
        .from("problems")
        .select("id,title,description,slop_code,difficulty,bug_category,target_complexity")
        .eq("id", resolvedParams.id)
        .single<ProblemRecord>();

      if (!isMounted) return;

      if (queryError || !data) {
        setError("Could not load this problem.");
        setProblem(null);
        setCode("");
      } else {
        setProblem(data);
        setCode(data.slop_code ?? "");
        setOriginalCode(data.slop_code ?? "");
      }
      setIsLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [params]);

  // simple session timer
  useEffect(() => {
    if (isLoading || !problem) return;
    const id = window.setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [isLoading, problem]);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    [],
  );

  const handleSubmit = async () => {
    if (!problemId) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    setError(null);
    setConsoleTab("console");

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_id: problemId, code }),
      });
      if (!response.ok) throw new Error("Submit failed");
      const data = (await response.json()) as SubmitResult;
      setSubmitResult(data);
    } catch {
      setError("Failed to submit code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCode(originalCode);
    setSubmitResult(null);
  };

  const difficulty = toDifficultyLevel(problem?.difficulty);
  const shortNum = problem ? problem.id.replace(/[^0-9a-f]/gi, "").slice(0, 4) : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
      }}
    >
      <TopNav />

      {/* Sub-header */}
      <div
        style={{
          minHeight: 52,
          background: T.panel,
          borderBottom: `1px solid ${T.line}`,
          display: "flex",
          alignItems: "center",
          padding: "8px 24px",
          gap: 16,
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.textDim,
            fontSize: 13,
            minWidth: 0,
          }}
        >
          <Link
            href="/"
            style={{ color: T.textMute, textDecoration: "none" }}
          >
            Problems
          </Link>
          <span style={{ color: T.textFaint }}>/</span>
          <span style={{ color: T.textMute, fontFamily: T.mono, fontSize: 12 }}>
            #{shortNum}
          </span>
          <span style={{ color: T.textFaint }}>/</span>
          <span
            style={{
              color: T.text,
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 360,
            }}
          >
            {problem?.title ?? (isLoading ? "Loading…" : "Problem")}
          </span>
        </div>
        {problem ? <Difficulty level={difficulty} /> : null}

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: T.textDim,
            fontSize: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontFamily: T.mono }}>
            {formatElapsed(elapsed)}
          </span>
          <span style={{ width: 1, height: 14, background: T.line }} />
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || !problem}
            style={{
              background: "transparent",
              color: T.textDim,
              border: `1px solid ${T.line}`,
              padding: "5px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: T.sans,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              opacity: !problem ? 0.5 : 1,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Reset code
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || !problem}
            style={{
              background: T.panel2,
              color: T.text,
              border: `1px solid ${T.line}`,
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              fontFamily: T.sans,
              opacity: isSubmitting || !problem ? 0.6 : 1,
            }}
          >
            Run
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || !problem}
            style={{
              background: T.gold,
              color: T.bg,
              border: "none",
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: T.sans,
              opacity: isSubmitting || !problem ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Submitting…" : "Submit fix"}
          </button>
        </div>
      </div>

      {/* Split panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Left: description / hints */}
        <div
          style={{
            width: "min(540px, 42vw)",
            minWidth: 320,
            flexShrink: 0,
            borderRight: `1px solid ${T.line}`,
            display: "flex",
            flexDirection: "column",
            background: T.bg,
            minHeight: 0,
          }}
        >
          {/* tabs */}
          <div
            style={{
              height: 40,
              borderBottom: `1px solid ${T.line}`,
              display: "flex",
              alignItems: "flex-end",
              padding: "0 16px",
              gap: 4,
              flexShrink: 0,
            }}
          >
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => !t.locked && setTab(t.key)}
                  disabled={t.locked}
                  style={{
                    padding: "8px 12px",
                    fontSize: 12.5,
                    color: active ? T.text : t.locked ? T.textFaint : T.textDim,
                    background: "transparent",
                    border: "none",
                    borderBottom: active
                      ? `2px solid ${T.gold}`
                      : "2px solid transparent",
                    marginBottom: -1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: active ? 500 : 400,
                    cursor: t.locked ? "not-allowed" : "pointer",
                  }}
                >
                  {t.label}
                  {t.badge ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: T.mono,
                        background: T.panel2,
                        color: T.textMute,
                        padding: "1px 5px",
                        borderRadius: 3,
                      }}
                    >
                      {t.badge}
                    </span>
                  ) : null}
                  {t.locked ? (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path
                        d="M3 5V4a3 3 0 016 0v1M2.5 5h7v5h-7z"
                        stroke={T.textFaint}
                        strokeWidth="1.2"
                      />
                    </svg>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* body */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "24px 32px",
              fontFamily: T.sans,
              minHeight: 0,
            }}
          >
            {isLoading ? (
              <p style={{ color: T.textMute, fontSize: 13 }}>Loading problem…</p>
            ) : tab === "description" ? (
              <DescriptionTab problem={problem} />
            ) : tab === "hints" ? (
              <HintsTab />
            ) : tab === "discussion" ? (
              <EmptyState
                title="No discussion yet"
                body="Be the first to share an approach once you've solved the problem."
              />
            ) : (
              <EmptyState
                title="Solutions locked"
                body="Submit a passing fix to unlock the community solutions."
              />
            )}
          </div>
        </div>

        {/* Right: editor + console */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            background: T.editor,
          }}
        >
          {/* file tab strip */}
          <div
            style={{
              height: 36,
              background: T.panel,
              borderBottom: `1px solid ${T.line}`,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                padding: "0 14px",
                height: "100%",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: T.editor,
                borderTop: `2px solid ${T.gold}`,
                fontSize: 12,
                color: T.text,
                fontFamily: T.sans,
                borderRight: `1px solid ${T.line}`,
                borderLeft: `1px solid ${T.line}`,
                marginTop: -1,
              }}
            >
              solution.py
              {code !== originalCode ? (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: T.gold,
                  }}
                />
              ) : null}
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                color: T.textMute,
                fontSize: 11,
                fontFamily: T.mono,
              }}
            >
              <span>Python 3.11</span>
              <span>UTF-8</span>
              <span>LF</span>
              <span>4 spaces</span>
            </div>
          </div>

          {/* editor */}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            <MonacoEditor
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: T.mono,
                fontLigatures: true,
                lineNumbers: "on",
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: "line",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* console / results */}
          <div
            style={{
              height: 200,
              background: T.console,
              borderTop: `1px solid ${T.line}`,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                height: 34,
                borderBottom: `1px solid ${T.line}`,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                gap: 22,
                fontFamily: T.sans,
              }}
            >
              {(
                [
                  { key: "console", label: "Console" },
                  { key: "tests", label: "Test cases" },
                  { key: "diagnostics", label: "Diagnostics" },
                ] as const
              ).map((t) => {
                const active = consoleTab === t.key;
                return (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setConsoleTab(t.key)}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: 12,
                      color: active ? T.text : T.textMute,
                      borderBottom: active ? `2px solid ${T.gold}` : "none",
                      height: "100%",
                      display: "inline-flex",
                      alignItems: "center",
                      marginBottom: -1,
                      fontWeight: active ? 500 : 400,
                      padding: 0,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: T.textMute, fontFamily: T.mono }}>
                {isSubmitting
                  ? "running…"
                  : submitResult
                    ? `verdict: ${submitResult.verdict}`
                    : "idle · press Submit fix"}
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: "14px 20px",
                fontFamily: T.mono,
                fontSize: 12,
                color: T.textDim,
                lineHeight: 1.7,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {error ? (
                <div style={{ color: T.red }}>{error}</div>
              ) : submitResult ? (
                <>
                  <div
                    style={{
                      color: submitResult.verdict === "pass" ? T.sage : T.red,
                      marginBottom: 8,
                      fontFamily: T.sans,
                      fontSize: 12.5,
                      fontWeight: 500,
                    }}
                  >
                    {submitResult.verdict === "pass"
                      ? "✓ All tests passed"
                      : "✗ Tests failed"}
                  </div>
                  <div style={{ color: T.text }}>
                    {submitResult.stdout || "(no stdout)"}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ color: T.textMute }}>$</span> python solution.py
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      color: T.textFaint,
                      fontStyle: "italic",
                    }}
                  >
                    Run your code to see output here.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DescriptionTab({ problem }: { problem: ProblemRecord | null }) {
  if (!problem) return null;
  const tags = [
    problem.bug_category ? problem.bug_category.replace(/_/g, " ") : null,
    problem.target_complexity ? `complexity: ${problem.target_complexity}` : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: T.text,
          margin: "0 0 14px",
          letterSpacing: -0.2,
        }}
      >
        {problem.title}
      </h2>

      <div
        style={{
          color: T.textDim,
          fontSize: 13.5,
          lineHeight: 1.65,
        }}
        className="dd-markdown"
      >
        <ReactMarkdown>{problem.description}</ReactMarkdown>
      </div>

      <div
        style={{
          marginTop: 20,
          padding: "12px 16px",
          background: T.redDim,
          borderRadius: 8,
          borderLeft: `2px solid ${T.red}`,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            color: T.red,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          Bug-finding prompt
        </div>
        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.55 }}>
          The starter code compiles but produces wrong results. Find the defect — without changing
          the function signature.
        </div>
      </div>

      {tags.length > 0 ? (
        <>
          <h3
            style={{
              fontSize: 11,
              color: T.textMute,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              margin: "24px 0 10px",
            }}
          >
            Tags
          </h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tags.map((t) => (
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

function HintsTab() {
  // No hints column in the backend yet — show the design's empty-but-helpful state.
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: T.text,
            margin: 0,
            letterSpacing: -0.2,
          }}
        >
          Hints
        </h2>
        <span style={{ fontSize: 11.5, color: T.textMute, fontFamily: T.mono }}>
          0 of 0 revealed
        </span>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: T.textDim, margin: "0 0 22px" }}>
        Hints are progressive — each one is more specific than the last. They&apos;ll appear here once
        the problem author has added them.
      </p>

      <div
        style={{
          background: T.panel,
          border: `1px dashed ${T.lineStrong}`,
          borderRadius: 10,
          padding: "20px 18px",
          textAlign: "center",
          color: T.textMute,
          fontSize: 13,
        }}
      >
        No hints available for this problem yet.
      </div>

      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 11.5,
          color: T.textMute,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <circle cx="6" cy="6" r="5" stroke={T.textMute} strokeWidth="1" />
          <path
            d="M6 5.5v2.5M6 4v.4"
            stroke={T.textMute}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        Re-read the problem and run your code — small experiments are the best hint.
      </div>
    </>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px dashed ${T.lineStrong}`,
        borderRadius: 10,
        padding: "32px 18px",
        textAlign: "center",
        color: T.textMute,
      }}
    >
      <div style={{ fontSize: 14, color: T.text, fontWeight: 500, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}
