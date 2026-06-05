import { T } from "@/lib/tokens";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px dashed ${T.lineStrong}`,
        borderRadius: 10,
        padding: "32px 18px",
        textAlign: "center",
        color: T.textMute
      }}>
      <div style={{ fontSize: 14, color: T.text, fontWeight: 500, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}
