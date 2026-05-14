"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { EditorProps } from "@monaco-editor/react";

import { T } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";
import { Tag } from "@/components/Tag";
import { Difficulty, toDifficultyLevel } from "@/components/Difficulty";
import type { DifficultyLevel } from "@/lib/tokens";

const MonacoEditor = dynamic<EditorProps>(() => import("@monaco-editor/react"), {
  ssr: false,
});

export type WorkspaceProblem = {
  id: string;
  shortId?: string;
  title: string;
  difficulty: DifficultyLevel | string | null;
  description: string;
  starterCode: string;
  tags?: string[];
  prompt?: string;
  expectedExamples?: { call: string; result: string }[];
  testCases?: { input: string; expected: string }[];
};

export type SubmitResult = {
  verdict: "pass" | "fail";
  stdout: string;
};

type Tab = "description" | "hints" | "discussion" | "solutions";
type ConsoleTab = "console" | "tests" | "diagnostics";
type ResultKind = "run" | "submit";

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

export function Workspace({
  problem,
  isLoading = false,
  loadError = null,
  backHref = "/",
  backLabel = "Problems",
}: {
  problem: WorkspaceProblem | null;
  isLoading?: boolean;
  loadError?: string | null;
  backHref?: string;
  backLabel?: string;
}) {
  // State is initialized from the problem prop. The parent is expected to pass
  // a `key` tied to the problem id, so this component remounts when the
  // problem changes instead of mutating state inside an effect.
  const starter = problem?.starterCode ?? "";
  const [code, setCode] = useState(starter);
  const [originalCode] = useState(starter);
  const [isBusy, setIsBusy] = useState(false);
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("description");
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>("console");
  const [elapsed, setElapsed] = useState(0);
  const [startedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!problem) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [problem, startedAt]);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    [],
  );

  const callBackend = async (kind: ResultKind) => {
    if (!problem) return;
    setIsBusy(true);
    setResult(null);
    setResultKind(kind);
    setRunError(null);
    setConsoleTab(kind === "run" ? "console" : "tests");

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_id: problem.id, code }),
      });
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const data = (await response.json()) as SubmitResult;
      setResult(data);
    } catch (e) {
      setRunError(
        e instanceof Error
          ? `Could not reach the runner: ${e.message}`
          : "Could not reach the runner.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleReset = () => {
    setCode(originalCode);
    setResult(null);
    setResultKind(null);
    setRunError(null);
  };

  const difficulty: DifficultyLevel = toDifficultyLevel(
    typeof problem?.difficulty === "string" ? problem.difficulty : problem?.difficulty ?? null,
  );
  const isDirty = code !== originalCode;
  const disabled = isBusy || isLoading || !problem;

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
          <Link href={backHref} style={{ color: T.textMute, textDecoration: "none" }}>
            {backLabel}
          </Link>
          <span style={{ color: T.textFaint }}>/</span>
          <span style={{ color: T.textMute, fontFamily: T.mono, fontSize: 12 }}>
            #{problem?.shortId ?? problem?.id.slice(0, 4) ?? "—"}
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
          <span style={{ fontFamily: T.mono }}>{formatElapsed(elapsed)}</span>
          <span style={{ width: 1, height: 14, background: T.line }} />
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || !isDirty}
            title={isDirty ? "Restore the starter code" : "Already at starter code"}
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
              opacity: disabled || !isDirty ? 0.5 : 1,
              cursor: disabled || !isDirty ? "not-allowed" : "pointer",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M2 6a4 4 0 117 2.7M2 6V3M2 6h3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Reset code
          </button>
          <button
            type="button"
            onClick={() => callBackend("run")}
            disabled={disabled}
            style={{
              background: T.panel2,
              color: T.text,
              border: `1px solid ${T.line}`,
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              fontFamily: T.sans,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isBusy && resultKind === "run" ? "Running…" : "Run"}
          </button>
          <button
            type="button"
            onClick={() => callBackend("submit")}
            disabled={disabled}
            style={{
              background: T.gold,
              color: T.bg,
              border: "none",
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: T.sans,
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {isBusy && resultKind === "submit" ? "Submitting…" : "Submit fix"}
          </button>
        </div>
      </div>

      {/* Split panel */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Left */}
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
            ) : loadError ? (
              <p style={{ color: T.red, fontSize: 13 }}>{loadError}</p>
            ) : tab === "description" ? (
              <DescriptionTab problem={problem} />
            ) : tab === "hints" ? (
              <HintsTab />
            ) : tab === "discussion" ? (
              <EmptyState
                title="No discussion yet"
                body="Be the first to share an approach once you've solved this problem."
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
              {isDirty ? (
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

          {/* console */}
          <div
            style={{
              height: 220,
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
                      cursor: "pointer",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: T.textMute, fontFamily: T.mono }}>
                {isBusy
                  ? resultKind === "run"
                    ? "running…"
                    : "submitting…"
                  : runError
                    ? "error"
                    : result
                      ? `${resultKind === "submit" ? "submit" : "run"} · ${result.verdict}`
                      : "idle · press Run or Submit"}
              </span>
            </div>
            <div
              style={{
                flex: 1,
                padding: "12px 18px",
                overflow: "auto",
                fontFamily: T.mono,
                fontSize: 12,
                color: T.textDim,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {consoleTab === "tests" ? (
                <TestsView problem={problem} result={result} />
              ) : consoleTab === "diagnostics" ? (
                <DiagnosticsView result={result} runError={runError} />
              ) : (
                <ConsoleView result={result} runError={runError} resultKind={resultKind} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsoleView({
  result,
  runError,
  resultKind,
}: {
  result: SubmitResult | null;
  runError: string | null;
  resultKind: ResultKind | null;
}) {
  if (runError) {
    return <div style={{ color: T.red }}>{runError}</div>;
  }
  if (!result) {
    return (
      <>
        <div>
          <span style={{ color: T.textMute }}>$</span> python solution.py
        </div>
        <div style={{ marginTop: 8, color: T.textFaint, fontStyle: "italic" }}>
          Run your code to see output here.
        </div>
      </>
    );
  }
  return (
    <>
      <div
        style={{
          color: result.verdict === "pass" ? T.sage : T.red,
          marginBottom: 8,
          fontFamily: T.sans,
          fontSize: 12.5,
          fontWeight: 500,
        }}
      >
        {result.verdict === "pass"
          ? resultKind === "submit"
            ? "✓ All tests passed — submission accepted"
            : "✓ Output matches expected"
          : resultKind === "submit"
            ? "✗ Submission failed — output did not match"
            : "✗ Output did not match expected"}
      </div>
      <div style={{ color: T.text }}>
        <span style={{ color: T.textMute }}>stdout</span>
        {"\n"}
        {result.stdout || "(empty)"}
      </div>
    </>
  );
}

function TestsView({
  problem,
  result,
}: {
  problem: WorkspaceProblem | null;
  result: SubmitResult | null;
}) {
  if (!problem?.testCases || problem.testCases.length === 0) {
    return (
      <div style={{ color: T.textMute, fontFamily: T.sans, fontSize: 12.5 }}>
        Test cases are hidden for this problem.
      </div>
    );
  }
  const verdict = result?.verdict;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {problem.testCases.map((tc, i) => {
        const ok = verdict === "pass";
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 1fr",
              alignItems: "center",
              gap: 12,
              color: T.textDim,
            }}
          >
            <span>
              {verdict == null ? (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.textFaint,
                    display: "inline-block",
                  }}
                />
              ) : ok ? (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 7.5l2.5 2.5L11 4.5"
                    stroke={T.sage}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                    stroke={T.red}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </span>
            <span style={{ color: T.text }}>{tc.input}</span>
            <span style={{ color: T.textMute }}>
              expected <span style={{ color: T.text }}>{tc.expected}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DiagnosticsView({
  result,
  runError,
}: {
  result: SubmitResult | null;
  runError: string | null;
}) {
  if (runError) {
    return <div style={{ color: T.red }}>{runError}</div>;
  }
  if (!result) {
    return (
      <div style={{ color: T.textFaint, fontStyle: "italic" }}>
        Diagnostics will appear here after the runner reports back.
      </div>
    );
  }
  return (
    <div>
      <div style={{ color: T.textMute, marginBottom: 4 }}>verdict</div>
      <div style={{ color: result.verdict === "pass" ? T.sage : T.red, marginBottom: 12 }}>
        {result.verdict}
      </div>
      <div style={{ color: T.textMute, marginBottom: 4 }}>raw stdout</div>
      <div style={{ color: T.text }}>{result.stdout || "(empty)"}</div>
    </div>
  );
}

function DescriptionTab({ problem }: { problem: WorkspaceProblem | null }) {
  if (!problem) return null;
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
        style={{ color: T.textDim, fontSize: 13.5, lineHeight: 1.65 }}
        className="dd-markdown"
      >
        <ReactMarkdown>{problem.description}</ReactMarkdown>
      </div>

      {problem.expectedExamples && problem.expectedExamples.length > 0 ? (
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 8,
            padding: "14px 16px",
            margin: "18px 0",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: T.textMute,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Expected behaviour
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 12.5,
              color: T.textDim,
              lineHeight: 1.75,
            }}
          >
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
            margin: "18px 0",
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
              margin: "24px 0 10px",
            }}
          >
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

function HintsTab() {
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
        Hints are progressive — each one is more specific than the last. They&apos;ll appear here
        once the problem author has added them.
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
