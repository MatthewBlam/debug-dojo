"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { T } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";
import { Tag } from "@/components/Tag";
import { useUser, loginHref } from "@/lib/useUser";

type SubmissionRowRaw = {
  id: string;
  verdict: string;
  cases_passed: number;
  cases_total: number;
  complexity_detected: string | null;
  created_at: string;
  problem_id: string;
  problems: { title: string; difficulty: string | null }[] | { title: string; difficulty: string | null } | null;
};

type SubmissionRow = {
  id: string;
  verdict: string;
  cases_passed: number;
  cases_total: number;
  complexity_detected: string | null;
  created_at: string;
  problem_id: string;
  problemTitle: string | null;
};

function verdictTone(v: string): "sage" | "gold" | "red" {
  if (v === "pass") return "sage";
  if (v === "partial") return "gold";
  return "red";
}

function verdictLabel(v: string): string {
  if (v === "pass") return "Pass";
  if (v === "partial") return "Partial";
  return "Fail";
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SubmissionsPage() {
  const { user, isLoading: authLoading } = useUser();
  const [submissions, setSubmissions] = useState<SubmissionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    void (async () => {
      try {
        const { data, error: queryError } = await supabase
          .from("submissions")
          .select(
            "id, verdict, cases_passed, cases_total, complexity_detected, created_at, problem_id, problems(title, difficulty)",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!active) return;
        if (queryError) {
          setError("Could not load submissions.");
          setSubmissions([]);
          return;
        }
        const raw = (data ?? []) as SubmissionRowRaw[];
        setSubmissions(
          raw.map((r) => {
            const prob = Array.isArray(r.problems) ? r.problems[0] : r.problems;
            return {
              id: r.id,
              verdict: r.verdict,
              cases_passed: r.cases_passed,
              cases_total: r.cases_total,
              complexity_detected: r.complexity_detected,
              created_at: r.created_at,
              problem_id: r.problem_id,
              problemTitle: prob?.title ?? null,
            };
          }),
        );
      } catch {
        if (active) {
          setError("Could not connect to Supabase.");
          setSubmissions([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  // Signed-out state
  if (!authLoading && !user) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100dvh",
          background: T.bg,
          color: T.text,
        }}
      >
        <TopNav />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "40px 36px",
              textAlign: "center",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: T.text,
                marginBottom: 10,
              }}
            >
              Sign in to view your submissions
            </div>
            <div
              style={{
                fontSize: 13,
                color: T.textDim,
                lineHeight: 1.55,
                marginBottom: 20,
              }}
            >
              Track your progress and review past attempts.
            </div>
            <Link
              href={loginHref("/submissions")}
              style={{
                display: "inline-block",
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                background: T.gold,
                color: T.bg,
                borderRadius: 8,
                textDecoration: "none",
                fontFamily: T.sans,
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLoadingList = authLoading || submissions === null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: T.bg,
        color: T.text,
      }}
    >
      <TopNav />

      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          padding: "32px clamp(20px, 4vw, 48px)",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.8,
              color: T.textMute,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            History
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: T.text,
              letterSpacing: -0.5,
              margin: 0,
            }}
          >
            <span
              style={{
                fontFamily: T.serif,
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              Your submissions.
            </span>
            {submissions ? (
              <span style={{ color: T.textDim, fontWeight: 400 }}>
                {" "}
                {submissions.length} recent.
              </span>
            ) : null}
          </h1>
        </div>

        {/* Table */}
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 100px 140px",
              padding: "12px 20px",
              fontSize: 11,
              color: T.textMute,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              borderBottom: `1px solid ${T.line}`,
              background: T.bg,
            }}
          >
            <span>Problem</span>
            <span>Verdict</span>
            <span>Cases</span>
            <span>Submitted</span>
          </div>

          {isLoadingList ? (
            <div style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}>
              Loading submissions...
            </div>
          ) : error ? (
            <div style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}>
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}>
              No submissions yet. Solve a problem to see your history here.
            </div>
          ) : (
            submissions.map((s, i) => (
              <Link
                key={s.id}
                href={`/problems/${s.problem_id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 100px 140px",
                  padding: "14px 20px",
                  fontSize: 13.5,
                  color: T.text,
                  borderBottom:
                    i < submissions.length - 1 ? `1px solid ${T.lineSoft}` : "none",
                  alignItems: "center",
                  textDecoration: "none",
                  transition: "background 120ms ease",
                }}
                className="dd-sub-row"
              >
                <span
                  style={{
                    color: T.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.problemTitle ?? s.problem_id.slice(0, 8)}
                </span>
                <span>
                  <Tag tone={verdictTone(s.verdict)}>{verdictLabel(s.verdict)}</Tag>
                </span>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 12,
                    color: T.textDim,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.cases_passed}/{s.cases_total}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: T.textMute,
                  }}
                >
                  {formatTimestamp(s.created_at)}
                </span>
              </Link>
            ))
          )}
        </div>

        {error ? (
          <div style={{ marginTop: 12, fontSize: 11.5, color: T.textMute }}>
            Note: {error}
          </div>
        ) : null}
      </div>

      <style>{`
        a.dd-sub-row:hover { background: ${T.panel2}; }
      `}</style>
    </div>
  );
}
