import { T } from "@/lib/tokens";

export function HintsTab() {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 4
        }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: T.text,
            margin: 0,
            letterSpacing: -0.2
          }}>
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
          fontSize: 13
        }}>
        No hints available for this problem yet.
      </div>
    </>
  );
}
