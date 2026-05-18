"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { T, type DifficultyLevel } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";
import { Tag } from "@/components/Tag";
import { Difficulty, toDifficultyLevel } from "@/components/Difficulty";
import { PRACTICE_PROBLEM } from "@/lib/practice-problem";

type ProblemRow = {
  id: string;
  title: string;
  difficulty: string | null;
  bug_category: string | null;
  status: string | null;
  created_at: string | null;
};

type DisplayRow = {
  id: string;
  short: string;
  title: string;
  difficulty: DifficultyLevel;
  tags: string[];
  isPractice?: boolean;
};

type DifficultyFilter = "all" | DifficultyLevel;

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All difficulties" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

const PRACTICE_ROW: DisplayRow = {
  id: PRACTICE_PROBLEM.id,
  short: PRACTICE_PROBLEM.shortId,
  title: `${PRACTICE_PROBLEM.title} — demo`,
  difficulty: PRACTICE_PROBLEM.difficulty,
  tags: PRACTICE_PROBLEM.tags,
  isPractice: true,
};

function bugCategoryToTag(raw: string | null): string {
  if (!raw) return "general";
  return raw.replace(/_/g, " ");
}

export default function DashboardPage() {
  const [supabaseRows, setSupabaseRows] = useState<DisplayRow[] | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error: queryError } = await supabase
          .from("problems")
          .select("id,title,difficulty,bug_category,status,created_at")
          .order("created_at", { ascending: true });

        if (!active) return;

        if (queryError) {
          setSupabaseError("Could not load problems from Supabase.");
          setSupabaseRows([]);
          return;
        }

        const list = (data ?? []) as ProblemRow[];
        setSupabaseRows(
          list
            .filter((p) => p.id !== PRACTICE_PROBLEM.id)
            .map((p, i) => ({
              id: p.id,
              short: String(200 + i).padStart(3, "0"),
              title: p.title,
              difficulty: toDifficultyLevel(p.difficulty),
              tags: [bugCategoryToTag(p.bug_category)].filter(Boolean),
            })),
        );
      } catch {
        if (active) {
          setSupabaseError("Supabase not configured.");
          setSupabaseRows([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const allRows = useMemo<DisplayRow[]>(
    () => [PRACTICE_ROW, ...(supabaseRows ?? [])],
    [supabaseRows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (difficulty !== "all" && r.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allRows, search, difficulty]);

  const isLoadingList = supabaseRows === null;
  const stats = [
    { l: "Available", v: String(allRows.length), s: "problems" },
    {
      l: "Easy",
      v: String(allRows.filter((r) => r.difficulty === "Easy").length),
      s: "problems",
    },
    {
      l: "Hard",
      v: String(allRows.filter((r) => r.difficulty === "Hard").length),
      s: "problems",
    },
  ];

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
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1.8,
                color: T.textMute,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Practice · Python
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
                Find the bug.
              </span>
              <span style={{ color: T.textDim, fontWeight: 400 }}>
                {" "}
                {allRows.length} problems.
              </span>
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              padding: 0,
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.l}
                style={{
                  padding: "12px 22px",
                  minWidth: 120,
                  borderLeft: i ? `1px solid ${T.line}` : "none",
                }}
              >
                <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4 }}>
                  {s.l}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: T.text,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.v}
                  </span>
                  <span style={{ fontSize: 12, color: T.textFaint }}>{s.s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 8,
              width: 280,
              fontSize: 13,
              color: T.textDim,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="6" cy="6" r="4" stroke={T.textMute} strokeWidth="1.4" />
              <path
                d="M9.5 9.5L12 12"
                stroke={T.textMute}
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <input
              aria-label="Search problems"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: T.text,
                fontSize: 13,
                fontFamily: T.sans,
              }}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.textMute,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            ) : null}
          </label>

          <div style={{ position: "relative" }}>
            <select
              aria-label="Filter by difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyFilter)}
              style={{
                appearance: "none",
                padding: "8px 28px 8px 12px",
                fontSize: 12.5,
                background: T.panel,
                color: difficulty === "all" ? T.textDim : T.text,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                fontFamily: T.sans,
                cursor: "pointer",
              }}
            >
              {DIFFICULTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} style={{ background: T.panel }}>
                  {o.label}
                </option>
              ))}
            </select>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              aria-hidden
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <path d="M1.5 3l2.5 2.5L6.5 3" stroke={T.textMute} strokeWidth="1.2" />
            </svg>
          </div>

          {(search || difficulty !== "all") ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDifficulty("all");
              }}
              style={{
                padding: "8px 12px",
                fontSize: 12.5,
                background: "transparent",
                color: T.textDim,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                fontFamily: T.sans,
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          ) : null}

          <div style={{ flex: 1 }} />

          <Link
            href="/practice"
            style={{
              padding: "8px 14px",
              fontSize: 12.5,
              background: T.gold,
              color: T.bg,
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontFamily: T.sans,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Try the demo problem →
          </Link>
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
              gridTemplateColumns: "60px 1fr 110px 110px 240px",
              padding: "12px 20px",
              fontSize: 11,
              color: T.textMute,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              borderBottom: `1px solid ${T.line}`,
              background: T.bg,
            }}
          >
            <span>#</span>
            <span>Problem</span>
            <span>Status</span>
            <span>Difficulty</span>
            <span>Tags</span>
          </div>

          {isLoadingList ? (
            <div style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}>
              Loading problems…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}>
              {supabaseError ?? "No problems match your filters."}
            </div>
          ) : (
            filtered.map((r, i) => (
              <Link
                key={r.id + (r.isPractice ? "-practice" : "")}
                href={r.isPractice ? "/practice" : `/problems/${r.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 110px 110px 240px",
                  padding: "14px 20px",
                  fontSize: 13.5,
                  color: T.text,
                  borderBottom:
                    i < filtered.length - 1 ? `1px solid ${T.lineSoft}` : "none",
                  background: r.isPractice ? "rgba(212,168,87,0.04)" : "transparent",
                  alignItems: "center",
                  textDecoration: "none",
                  transition: "background 120ms ease",
                }}
                className="dd-row"
              >
                <span
                  style={{
                    color: T.textMute,
                    fontFamily: T.mono,
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.short}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      color: T.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.title}
                  </span>
                  {r.isPractice ? (
                    <Tag tone="gold" style={{ flexShrink: 0 }}>
                      demo
                    </Tag>
                  ) : null}
                </div>
                <span style={{ color: T.textFaint, fontSize: 12 }}>
                  {r.isPractice ? "Open now" : "—"}
                </span>
                <Difficulty level={r.difficulty} />
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {r.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </Link>
            ))
          )}
        </div>

        {supabaseError ? (
          <div style={{ marginTop: 12, fontSize: 11.5, color: T.textMute }}>
            Note: {supabaseError} The demo problem above works without Supabase.
          </div>
        ) : null}
      </div>

      <style>{`
        a.dd-row:hover { background: ${T.panel2}; }
      `}</style>
    </div>
  );
}
