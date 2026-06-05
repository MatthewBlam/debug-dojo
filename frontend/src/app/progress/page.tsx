"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { T } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";
import { useUser } from "@/lib/useUser";

type DiffCounts = { easy: number; medium: number; hard: number };

const HEATMAP_SHADES = [
  "#161b22",
  "rgba(212,168,87,0.16)",
  "rgba(212,168,87,0.36)",
  "rgba(212,168,87,0.6)",
  "#d4a857"
];

// Empty activity grid (16 weeks x 7 days). Will be wired to real submission
// activity in a later phase.
const EMPTY_HEATMAP: number[][] = Array.from({ length: 16 }, () =>
  Array.from({ length: 7 }, () => 0)
);

const BUG_TYPES = [
  { l: "Wrong condition", pct: 0, n: 0 },
  { l: "Missing edge case", pct: 0, n: 0 },
  { l: "Bad complexity", pct: 0, n: 0 },
  { l: "State mutation", pct: 0, n: 0 },
  { l: "Wrong data struct.", pct: 0, n: 0 },
  { l: "Other", pct: 0, n: 0 }
];

function formatJoinDate(isoDate: string): string {
  const d = new Date(isoDate);
  const month = d.toLocaleString("en-US", { month: "short" });
  return `joined ${month} ${d.getFullYear()}`;
}

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useUser();
  const [counts, setCounts] = useState<DiffCounts>({ easy: 0, medium: 0, hard: 0 });
  const [totalProblems, setTotalProblems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Derive identity fields from the auth user
  const emailLocal = user?.email?.split("@")[0] ?? "";
  const initials = emailLocal ? emailLocal[0].toUpperCase() : "?";
  const displayName = emailLocal || "Guest";
  const subtitle = user?.email ?? "";
  const joinedLabel = user?.created_at ? formatJoinDate(user.created_at) : "";

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error: queryError } = await supabase.from("problems").select("difficulty");
        if (!active) return;
        if (queryError) throw queryError;

        const rows = (data ?? []) as { difficulty: string | null }[];
        const c: DiffCounts = { easy: 0, medium: 0, hard: 0 };
        for (const r of rows) {
          const k = (r.difficulty ?? "").toLowerCase();
          if (k === "easy") c.easy++;
          else if (k === "medium") c.medium++;
          else if (k === "hard") c.hard++;
        }
        setCounts(c);
        setTotalProblems(rows.length);
        setError(null);
      } catch (loadError) {
        console.error("Could not load progress data.", loadError);
        if (!active) return;
        setCounts({ easy: 0, medium: 0, hard: 0 });
        setTotalProblems(0);
        setError("Could not load progress data.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const diffStats = [
    { l: "Easy", solved: 0, total: counts.easy, color: T.sage },
    { l: "Medium", solved: 0, total: counts.medium, color: T.gold },
    { l: "Hard", solved: 0, total: counts.hard, color: T.red }
  ];

  const tiles = [
    {
      l: "Problems solved",
      v: "0",
      s: `/ ${totalProblems}`,
      trend: "Get started today",
      tone: T.text
    },
    { l: "Current streak", v: "0", s: "days", trend: "Build the habit", tone: T.gold },
    { l: "Accuracy", v: "—", s: "%", trend: "No submissions yet", tone: T.sage },
    { l: "Avg. time to fix", v: "—", s: "min", trend: "—", tone: T.text }
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: T.bg,
        color: T.text
      }}>
      <TopNav />

      <div
        style={{
          flex: 1,
          padding: "32px clamp(20px, 4vw, 48px)",
          maxWidth: 1440,
          width: "100%",
          margin: "0 auto"
        }}>
        {error ? (
          <div
            role="alert"
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              background: "rgba(229,115,115,0.12)",
              border: `1px solid ${T.red}`,
              borderRadius: 8,
              color: T.text,
              fontSize: 13
            }}>
            {error}
          </div>
        ) : null}

        {/* Identity + tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 320px) 1fr",
            gap: 24,
            marginBottom: 28
          }}
          className="dd-progress-top">
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 12,
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              gap: 16
            }}>
            {authLoading ? (
              /* Skeleton while auth resolves */
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: T.lineStrong
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div
                      style={{ width: 120, height: 14, borderRadius: 4, background: T.lineStrong }}
                    />
                    <div
                      style={{ width: 80, height: 10, borderRadius: 4, background: T.lineSoft }}
                    />
                  </div>
                </div>
                <div style={{ width: "100%", height: 48, borderRadius: 8, background: T.bg }} />
              </>
            ) : !user ? (
              /* Guest / logged-out state */
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: T.lineStrong,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: T.textMute,
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: -0.4
                    }}>
                    ?
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>
                      Guest
                    </div>
                    <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>
                      <Link href="/login" style={{ color: T.gold, textDecoration: "none" }}>
                        Sign in
                      </Link>{" "}
                      to track your progress
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Authenticated user */
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${T.gold}, ${T.red})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: T.bg,
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: -0.4
                    }}>
                    {initials}
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>
                      {subtitle}
                      {joinedLabel ? ` · ${joinedLabel}` : ""}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    background: T.bg,
                    border: `1px solid ${T.lineSoft}`,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.sage }} />
                  <div>
                    <div style={{ fontSize: 12, color: T.textMute }}>Level</div>
                    <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>Beginner</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: T.textMute, fontFamily: T.mono }}>
                      0 / 2,000 xp
                    </div>
                    <div
                      style={{
                        width: 110,
                        height: 4,
                        background: T.lineStrong,
                        borderRadius: 2,
                        marginTop: 4
                      }}>
                      <div
                        style={{ width: "0%", height: "100%", background: T.gold, borderRadius: 2 }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: T.textMute, lineHeight: 1.55 }}>
                  Submit your first fix to start tracking your bug-hunting range across problem
                  types.
                </div>
              </>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16
            }}>
            {tiles.map((s) => (
              <div
                key={s.l}
                style={{
                  background: T.panel,
                  border: `1px solid ${T.line}`,
                  borderRadius: 12,
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6
                }}>
                <div style={{ fontSize: 11.5, color: T.textMute, letterSpacing: 0.2 }}>{s.l}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 600,
                      color: s.tone,
                      letterSpacing: -0.6,
                      fontVariantNumeric: "tabular-nums"
                    }}>
                    {s.v}
                  </span>
                  <span style={{ fontSize: 13, color: T.textMute }}>{s.s}</span>
                </div>
                <div style={{ fontSize: 11.5, color: T.textDim, fontFamily: T.mono }}>
                  {s.trend}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lower grid: heatmap + difficulty */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: 16
          }}>
          {/* Heatmap */}
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 12,
              padding: "20px 22px"
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 8
              }}>
              <div>
                <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>Activity</div>
                <div style={{ fontSize: 11.5, color: T.textMute, marginTop: 2 }}>Last 16 weeks</div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: T.textMute,
                  fontFamily: T.mono
                }}>
                <span>less</span>
                <div style={{ display: "flex", gap: 3 }}>
                  {HEATMAP_SHADES.map((c, i) => (
                    <span
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: c,
                        border: i === 0 ? `1px solid ${T.line}` : "none"
                      }}
                    />
                  ))}
                </div>
                <span>more</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", overflow: "auto", position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  marginRight: 8,
                  paddingTop: 14
                }}>
                {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      color: T.textMute,
                      height: 12,
                      lineHeight: "12px",
                      fontFamily: T.mono
                    }}>
                    {d}
                  </span>
                ))}
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 3,
                    fontSize: 10,
                    color: T.textMute,
                    marginBottom: 4,
                    fontFamily: T.mono
                  }}>
                  {[
                    "Jan",
                    "",
                    "",
                    "Feb",
                    "",
                    "",
                    "Mar",
                    "",
                    "",
                    "Apr",
                    "",
                    "",
                    "May",
                    "",
                    "",
                    ""
                  ].map((m, i) => (
                    <span key={i} style={{ width: 12, height: 10, lineHeight: "10px" }}>
                      {m}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {EMPTY_HEATMAP.map((week, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {week.map((v, di) => (
                        <div
                          key={di}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            background: HEATMAP_SHADES[v],
                            border: v === 0 ? `1px solid ${T.lineSoft}` : "none",
                            boxShadow:
                              wi === EMPTY_HEATMAP.length - 1 && di === week.length - 1
                                ? `0 0 0 1.5px ${T.text}`
                                : "none"
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(13, 17, 23, 0.7)",
                  borderRadius: 6,
                  pointerEvents: "none"
                }}>
                <span
                  style={{
                    fontSize: 13,
                    color: T.textMute,
                    fontFamily: T.mono,
                    letterSpacing: 0.3
                  }}>
                  Activity tracking coming soon
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 24,
                fontSize: 11.5,
                color: T.textDim,
                paddingTop: 14,
                borderTop: `1px solid ${T.lineSoft}`,
                flexWrap: "wrap"
              }}>
              <div>
                <span
                  style={{ color: T.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  0
                </span>{" "}
                longest streak
              </div>
              <div>
                <span
                  style={{ color: T.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  0
                </span>{" "}
                total sessions
              </div>
              <div>
                <span
                  style={{ color: T.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  —
                </span>{" "}
                avg / session
              </div>
            </div>
          </div>

          {/* By difficulty + bug types */}
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 12,
              padding: "20px 22px"
            }}>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 500, marginBottom: 4 }}>
              By difficulty
            </div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginBottom: 20 }}>
              Solved out of available
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {diffStats.map((d) => {
                const pct = d.total > 0 ? d.solved / d.total : 0;
                return (
                  <div key={d.l}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        marginBottom: 8
                      }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{ width: 8, height: 8, borderRadius: 2, background: d.color }}
                        />
                        <span style={{ fontSize: 13, color: T.text }}>{d.l}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 6,
                          fontFamily: T.mono,
                          fontSize: 12
                        }}>
                        <span
                          style={{
                            color: T.text,
                            fontVariantNumeric: "tabular-nums",
                            fontSize: 18,
                            fontWeight: 600
                          }}>
                          {d.solved}
                        </span>
                        <span style={{ color: T.textMute }}>/ {d.total}</span>
                        <span style={{ color: T.textFaint, marginLeft: 4 }}>
                          {Math.round(pct * 100)}%
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: T.bg,
                        borderRadius: 3,
                        overflow: "hidden"
                      }}>
                      <div
                        style={{
                          width: `${pct * 100}%`,
                          height: "100%",
                          background: d.color,
                          borderRadius: 3
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ height: 1, background: T.lineSoft, margin: "24px 0 18px" }} />

            <div style={{ fontSize: 13, color: T.text, fontWeight: 500, marginBottom: 14 }}>
              Strengths by bug type
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px 24px",
                position: "relative"
              }}>
              {BUG_TYPES.map((b) => (
                <div key={b.l}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      marginBottom: 5
                    }}>
                    <span style={{ fontSize: 12, color: T.textDim }}>{b.l}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: T.textMute,
                        fontFamily: T.mono,
                        fontVariantNumeric: "tabular-nums"
                      }}>
                      {b.n} solved
                    </span>
                  </div>
                  <div style={{ height: 4, background: T.bg, borderRadius: 2, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${b.pct * 100}%`,
                        height: "100%",
                        borderRadius: 2,
                        background: b.pct > 0.6 ? T.sage : b.pct > 0.3 ? T.gold : T.red
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(13, 17, 23, 0.7)",
                  borderRadius: 6,
                  pointerEvents: "none"
                }}>
                <span
                  style={{
                    fontSize: 13,
                    color: T.textMute,
                    fontFamily: T.mono,
                    letterSpacing: 0.3
                  }}>
                  Bug type tracking coming soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .dd-progress-top { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
