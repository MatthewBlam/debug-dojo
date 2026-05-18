import { T, type DifficultyLevel } from "@/lib/tokens";

const colorMap: Record<DifficultyLevel, string> = {
  Easy: T.sage,
  Medium: T.gold,
  Hard: T.red,
};

export function Difficulty({ level }: { level: DifficultyLevel }) {
  const c = colorMap[level];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: c,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: T.sans,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 1, background: c }} />
      {level}
    </span>
  );
}

export function toDifficultyLevel(raw: string | null | undefined): DifficultyLevel {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "hard") return "Hard";
  if (v === "medium") return "Medium";
  return "Easy";
}
