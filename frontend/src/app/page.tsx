"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { T, type DifficultyLevel } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";
import { Tag } from "@/components/Tag";
import { Difficulty, toDifficultyLevel } from "@/components/Difficulty";

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
};

function shortId(uuid: string, index: number): string {
  // 3-digit stable display number per row to mimic the design's "#220" style.
  const fromUuid = parseInt(uuid.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16);
  return String(200 + ((fromUuid + index) % 800));
}

function bugCategoryToTag(raw: string | null): string {
  if (!raw) return "general";
  return raw.replace(/_/g, " ");
}

export default function DashboardPage() {
  const [rows, setRows] = useState<DisplayRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: queryError } = await supabase
        .from("problems")
        .select("id,title,difficulty,bug_category,status,created_at")
        .order("created_at", { ascending: true });

      if (!active) return;

      if (queryError) {
        setError("Could not load problems.");
        setRows([]);
        return;
      }

      const list = (data ?? []) as ProblemRow[];
      setRows(
        list.map((p, i) => ({
          id: p.id,
          short: shortId(p.id, i),
          title: p.title,
          difficulty: toDifficultyLevel(p.difficulty),
          tags: [bugCategoryToTag(p.bug_category)].filter(Boolean),
        })),
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.title.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows?.length ?? 0;
    return [
      { l: "Available", v: String(total), s: "problems" },
      { l: "This week", v: "6", s: "sessions" },
      { l: "Accuracy", v: "82", s: "%" },
    ];
  }, [rows]);

  const firstUnsolved = filtered?.[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: T.bg, color: T.text }}>
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
        {/* Heading row */}
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
              <span style={{ fontFamily: T.serif, fontStyle: "italic", fontWeight: 400 }}>
                Find the bug.
              </span>
              <span style={{ color: T.textDim, fontWeight: 400 }}>
                {" "}
                {rows?.length ?? "—"} problems.
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
                <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4 }}>{s.l}</div>
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
              <path d="M9.5 9.5L12 12" stroke={T.textMute} strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
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
          </label>

          {["All difficulties", "Status", "Tags", "Bug type"].map((f) => (
            <button
              key={f}
              type="button"
              style={{
                padding: "8px 12px",
                fontSize: 12.5,
                background: T.panel,
                color: T.textDim,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: T.sans,
              }}
            >
              {f}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                <path d="M1.5 3l2.5 2.5L6.5 3" stroke={T.textMute} strokeWidth="1.2" />
              </svg>
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {firstUnsolved ? (
            <Link
              href={`/problems/${firstUnsolved.id}`}
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
              }}
            >
              Continue → #{firstUnsolved.short}
            </Link>
          ) : null}
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
              gridTemplateColumns: "60px 1fr 110px 110px 200px 80px",
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
            <span style={{ textAlign: "right" }}>Solve %</span>
          </div>

          {filtered === null ? (
            <div style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}>
              Loading problems…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}>
              {error ?? "No problems match your search."}
            </div>
          ) : (
            filtered.map((r, i) => (
              <Link
                key={r.id}
                href={`/problems/${r.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 110px 110px 200px 80px",
                  padding: "14px 20px",
                  fontSize: 13.5,
                  color: T.text,
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.lineSoft}` : "none",
                  background: "transparent",
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
                </div>
                <span style={{ color: T.textFaint, fontSize: 12 }}>—</span>
                <Difficulty level={r.difficulty} />
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {r.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <span
                  style={{
                    textAlign: "right",
                    color: T.textMute,
                    fontSize: 12.5,
                    fontVariantNumeric: "tabular-nums",
                    fontFamily: T.mono,
                  }}
                >
                  —
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      <style>{`
        a.dd-row:hover { background: ${T.panel2}; }
      `}</style>
    </div>
  );
}
