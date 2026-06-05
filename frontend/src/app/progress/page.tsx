"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProgress, type ApiProgress } from "@/lib/api";
import { T } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";
import { useUser, loginHref } from "@/lib/useUser";

function formatJoinDate(isoDate: string): string {
  const d = new Date(isoDate);
  const month = d.toLocaleString("en-US", { month: "short" });
  return `joined ${month} ${d.getFullYear()}`;
}

function categoryLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useUser();
  const [progress, setProgress] = useState<ApiProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailLocal = user?.email?.split("@")[0] ?? "";
  const initials = emailLocal ? emailLocal[0].toUpperCase() : "?";
  const displayName = emailLocal || "Guest";
  const joinedLabel = user?.created_at ? formatJoinDate(user.created_at) : "";

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    void (async () => {
      try {
        const data = await getProgress();
        if (!active) return;
        setProgress(data);
        setError(null);
      } catch {
        if (!active) return;
        setProgress(null);
        setError("Could not load progress from the backend.");
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  if (!authLoading && !user) {
    return (
      <div style={{ minHeight: "100dvh", background: T.bg, color: T.text }}>
        <TopNav />
        <div
          style={{
            minHeight: "calc(100dvh - 56px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24
          }}>
          <div
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "40px 36px",
              textAlign: "center",
              maxWidth: 400
            }}>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 10 }}>
              Sign in to view progress
            </div>
            <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, marginBottom: 20 }}>
              Your solved problems and submission stats are calculated from your saved submissions.
            </div>
            <Link
              href={loginHref("/progress")}
              style={{
                display: "inline-block",
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                background: T.gold,
                color: T.bg,
                borderRadius: 8,
                textDecoration: "none"
              }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tiles = [
    {
      label: "Problems solved",
      value: progress ? String(progress.solved_problems) : "0",
      suffix: progress ? `/ ${progress.total_problems}` : "",
      tone: T.text
    },
    {
      label: "Attempts",
      value: progress ? String(progress.attempts) : "0",
      suffix: "saved",
      tone: T.gold
    },
    {
      label: "Passed",
      value: progress ? String(progress.passed_submissions) : "0",
      suffix: "submissions",
      tone: T.sage
    },
    {
      label: "Accuracy",
      value: progress?.accuracy == null ? "—" : String(Math.round(progress.accuracy * 100)),
      suffix: progress?.accuracy == null ? "" : "%",
      tone: T.text
    }
  ];
  const difficultyRows = ["easy", "medium", "hard"].map((difficulty) => ({
    difficulty,
    ...(progress?.by_difficulty[difficulty] ?? { solved: 0, total: 0 })
  }));
  const bugRows = Object.entries(progress?.by_bug_category ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.text }}>
      <TopNav />
      <main
        style={{
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(260px, 320px) 1fr",
            gap: 24,
            marginBottom: 24
          }}
          className="dd-progress-top">
          <section
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: 22
            }}>
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
                  fontSize: 18
                }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{displayName}</div>
                <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>
                  {user?.email}
                  {joinedLabel ? ` · ${joinedLabel}` : ""}
                </div>
              </div>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16
            }}>
            {tiles.map((tile) => (
              <div
                key={tile.label}
                style={{
                  background: T.panel,
                  border: `1px solid ${T.line}`,
                  borderRadius: 10,
                  padding: "20px 22px"
                }}>
                <div style={{ fontSize: 11.5, color: T.textMute }}>{tile.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 8 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 600,
                      color: tile.tone,
                      fontVariantNumeric: "tabular-nums"
                    }}>
                    {tile.value}
                  </span>
                  <span style={{ fontSize: 13, color: T.textMute }}>{tile.suffix}</span>
                </div>
              </div>
            ))}
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 16
          }}>
          <section
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "20px 22px"
            }}>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 500, marginBottom: 4 }}>
              By difficulty
            </div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginBottom: 20 }}>
              Passed problems out of published problems
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {difficultyRows.map((row) => {
                const pct = row.total > 0 ? row.solved / row.total : 0;
                return (
                  <div key={row.difficulty}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                        fontSize: 13
                      }}>
                      <span style={{ color: T.text, textTransform: "capitalize" }}>
                        {row.difficulty}
                      </span>
                      <span style={{ color: T.textDim, fontFamily: T.mono }}>
                        {row.solved}/{row.total}
                      </span>
                    </div>
                    <div style={{ height: 6, background: T.bg, borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct * 100}%`,
                          height: "100%",
                          background:
                            row.difficulty === "easy"
                              ? T.sage
                              : row.difficulty === "medium"
                                ? T.gold
                                : T.red
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "20px 22px"
            }}>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 500, marginBottom: 4 }}>
              Solved bug categories
            </div>
            <div style={{ fontSize: 11.5, color: T.textMute, marginBottom: 20 }}>
              Counted from passed submissions
            </div>
            {bugRows.length === 0 ? (
              <div style={{ color: T.textMute, fontSize: 13 }}>
                No passed submissions yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {bugRows.map(([category, count]) => (
                  <div
                    key={category}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: T.bg,
                      border: `1px solid ${T.lineSoft}`,
                      borderRadius: 8
                    }}>
                    <span style={{ color: T.textDim, fontSize: 13 }}>{categoryLabel(category)}</span>
                    <span style={{ color: T.text, fontFamily: T.mono, fontSize: 13 }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
