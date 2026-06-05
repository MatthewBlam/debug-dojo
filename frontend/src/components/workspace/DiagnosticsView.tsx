import { T } from "@/lib/tokens";
import type { SubmitResult } from "./types";

export function DiagnosticsView({
  result,
  runError
}: {
  result: SubmitResult | null;
  runError: string | null;
}) {
  if (runError) {
    return <div style={{ color: T.red }}>{runError}</div>;
  }
  if (!result) {
    return (
      <div style={{ color: T.textFaint, fontStyle: "italic" }}>
        Diagnostics will appear here after the runner reports back.
      </div>
    );
  }
  return (
    <div>
      <div style={{ color: T.textMute, marginBottom: 4 }}>verdict</div>
      <div
        style={{
          color: result.verdict === "pass" ? T.sage : result.verdict === "partial" ? T.gold : T.red,
          marginBottom: 12
        }}>
        {result.verdict}
      </div>
      <div style={{ color: T.textMute, marginBottom: 4 }}>raw stdout</div>
      <div style={{ color: T.text }}>{result.stdout || "(empty)"}</div>
      {result.cases_total > 0 && (
        <>
          <div style={{ color: T.textMute, marginBottom: 4, marginTop: 12 }}>test cases</div>
          <div style={{ color: T.text }}>
            {result.cases_passed} / {result.cases_total} passed
          </div>
        </>
      )}
      {result.complexity_detected && (
        <>
          <div style={{ color: T.textMute, marginBottom: 4, marginTop: 12 }}>
            complexity detected
          </div>
          <div style={{ color: T.text }}>{result.complexity_detected}</div>
        </>
      )}
    </div>
  );
}
