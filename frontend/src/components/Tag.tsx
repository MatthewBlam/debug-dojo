import { CSSProperties, ReactNode } from "react";
import { T } from "@/lib/tokens";

type Tone = "mute" | "gold" | "sage" | "red" | "blue";

const tones: Record<Tone, { bg: string; fg: string; bd: string }> = {
  mute: { bg: T.panel2, fg: T.textDim, bd: T.line },
  gold: { bg: T.goldDim, fg: T.gold, bd: "transparent" },
  sage: { bg: T.sageDim, fg: T.sage, bd: "transparent" },
  red: { bg: T.redDim, fg: T.red, bd: "transparent" },
  blue: { bg: T.blueDim, fg: T.blue, bd: "transparent" },
};

export function Tag({
  children,
  tone = "mute",
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: CSSProperties;
}) {
  const tk = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 4,
        background: tk.bg,
        color: tk.fg,
        border: `1px solid ${tk.bd}`,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.1,
        fontFamily: T.sans,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
