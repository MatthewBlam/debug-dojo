import { T } from "@/lib/tokens";
import type { SubmitResult, ResultKind, WorkspaceProblem } from "./types";

export function ConsoleView({
  result,
  runError,
  resultKind,
  problem
}: {
  result: SubmitResult | null;
  runError: string | null;
  resultKind: ResultKind | null;
  problem: WorkspaceProblem | null;
}) {
  if (runError) {
    return <div style={{ color: T.red }}>{runError}</div>;
  }
  if (!result) {
    return (
      <>
        <div>
          <span style={{ color: T.textMute }}>$</span> python solution.py
        </div>
        <div style={{ marginTop: 8, color: T.textFaint, fontStyle: "italic" }}>
          Run your code to see output here.
        </div>
      </>
    );
  }

  const verdictColor =
    result.verdict === "pass" ? T.sage : result.verdict === "partial" ? T.gold : T.red;
  const verdictBg =
    result.verdict === "pass" ? T.sageDim : result.verdict === "partial" ? T.goldDim : T.redDim;
  const verdictLabel =
    result.verdict === "pass" ? "Pass" : result.verdict === "partial" ? "Partial" : "Fail";
  const verdictIcon = result.verdict === "pass" ? "✓" : result.verdict === "partial" ? "⚠" : "✗";
  const verdictDescription =
    result.verdict === "pass"
      ? resultKind === "submit"
        ? "Submission accepted"
        : "Output matches expected"
      : result.verdict === "partial"
        ? "Correct but suboptimal"
        : resultKind === "submit"
          ? "Submission failed"
          : "Output did not match";

  return (
    <>
      {/* Prominent verdict badge */}
      <div
        role="status"
        aria-label={`Verdict: ${verdictLabel}. ${result.cases_passed} of ${result.cases_total} cases passed.${result.complexity_detected ? ` Complexity detected: ${result.complexity_detected}.` : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          background: verdictBg,
          borderRadius: 8,
          marginBottom: 10
        }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 6,
            background: verdictColor,
            color: T.bg,
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0
          }}>
          {verdictIcon}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: verdictColor,
                fontFamily: T.sans
              }}>
              {verdictLabel}
            </span>
            <span
              style={{
                fontSize: 12,
                color: T.textDim,
                fontFamily: T.sans
              }}>
              {verdictDescription}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 3,
              fontSize: 12,
              fontFamily: T.mono,
              color: T.textDim
            }}>
            <span>
              Cases:{" "}
              <span style={{ color: T.text, fontWeight: 500 }}>
                {result.cases_passed}/{result.cases_total}
              </span>{" "}
              passed
            </span>
            {(result.verdict === "pass" || result.verdict === "partial") &&
            result.complexity_detected ? (
              <span>
                Complexity:{" "}
                <span style={{ color: T.text, fontWeight: 500 }}>{result.complexity_detected}</span>{" "}
                detected
              </span>
            ) : null}
          </div>
          {result.verdict === "partial" && problem?.targetComplexity ? (
            <div
              style={{
                marginTop: 4,
                fontSize: 11.5,
                fontFamily: T.sans,
                color: T.gold
              }}>
              Target: {problem.targetComplexity} — your solution is correct but could be more
              efficient
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ color: T.text }}>
        <span style={{ color: T.textMute }}>stdout</span>
        {"\n"}
        {result.stdout || "(empty)"}
      </div>
    </>
  );
}
