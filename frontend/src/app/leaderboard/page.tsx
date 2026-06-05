"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { T } from "@/lib/tokens";
import { TopNav } from "@/components/TopNav";

type LeaderboardRow = {
  rank: number;
  github_username: string | null;
  avatar_url: string | null;
  problems_solved: number;
};

function Initials({ name }: { name: string | null }) {
  const ch = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${T.gold}, ${T.red})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
        color: T.bg,
        flexShrink: 0,
      }}
    >
      {ch}
    </div>
  );
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc(
          "leaderboard_top",
          { lim: 50 },
        );

        if (!active) return;

        if (rpcError) {
          setError("Could not load leaderboard.");
          setRows([]);
          return;
        }

        setRows((data ?? []) as LeaderboardRow[]);
      } catch {
        if (active) {
          setError("Could not connect to Supabase.");
          setRows([]);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const isLoading = rows === null;

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
          maxWidth: 860,
          margin: "0 auto",
          padding: "32px clamp(20px, 4vw, 48px)",
        }}
      >
        {/* Header */}
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
            Community
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
              Leaderboard
            </span>
            <span style={{ color: T.textDim, fontWeight: 400 }}>
              {" "}
              Top 50
            </span>
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
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 140px",
              padding: "12px 20px",
              fontSize: 11,
              color: T.textMute,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              borderBottom: `1px solid ${T.line}`,
              background: T.bg,
            }}
          >
            <span>Rank</span>
            <span>User</span>
            <span style={{ textAlign: "right" }}>Problems Solved</span>
          </div>

          {/* Body */}
          {isLoading ? (
            <div
              style={{ padding: "32px 20px", color: T.textMute, fontSize: 13 }}
            >
              Loading leaderboard...
            </div>
          ) : rows.length === 0 ? (
            <div
              style={{
                padding: "48px 20px",
                color: T.textDim,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error ??
                "No one has solved any problems yet. Be the first!"}
            </div>
          ) : (
            rows.map((r, i) => {
              const isFirst = r.rank === 1;
              return (
                <div
                  key={`${r.rank}-${r.github_username}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 140px",
                    padding: "14px 20px",
                    fontSize: 13.5,
                    color: T.text,
                    borderBottom:
                      i < rows.length - 1
                        ? `1px solid ${T.lineSoft}`
                        : "none",
                    alignItems: "center",
                    background: isFirst
                      ? "rgba(212,168,87,0.04)"
                      : "transparent",
                  }}
                >
                  {/* Rank */}
                  <span
                    style={{
                      fontFamily: T.mono,
                      fontSize: 13,
                      fontWeight: isFirst ? 700 : 400,
                      color: isFirst ? T.gold : T.textMute,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.rank}
                  </span>

                  {/* User */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
                    }}
                  >
                    {r.avatar_url ? (
                      <img
                        src={r.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        style={{
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: T.panel2,
                        }}
                      />
                    ) : (
                      <Initials name={r.github_username} />
                    )}
                    <span
                      style={{
                        color: isFirst ? T.gold : T.text,
                        fontWeight: isFirst ? 600 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.github_username ?? "Anonymous"}
                    </span>
                  </div>

                  {/* Problems solved */}
                  <span
                    style={{
                      textAlign: "right",
                      fontFamily: T.mono,
                      fontSize: 13,
                      fontVariantNumeric: "tabular-nums",
                      color: isFirst ? T.gold : T.textDim,
                      fontWeight: isFirst ? 600 : 400,
                    }}
                  >
                    {r.problems_solved}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {error ? (
          <div style={{ marginTop: 12, fontSize: 11.5, color: T.textMute }}>
            Note: {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
