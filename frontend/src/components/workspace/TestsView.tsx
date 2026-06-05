import { T } from "@/lib/tokens";
import type { SubmitResult, WorkspaceProblem } from "./types";

export function TestsView({
  problem,
  result
}: {
  problem: WorkspaceProblem | null;
  result: SubmitResult | null;
}) {
  if (!problem?.testCases || problem.testCases.length === 0) {
    return (
      <div style={{ color: T.textMute, fontFamily: T.sans, fontSize: 12.5 }}>
        Test cases are hidden for this problem.
      </div>
    );
  }
  const verdict = result?.verdict;
  const perTestResults = result?.test_case_results;
  const hasPerTestResults = Array.isArray(perTestResults);
  const hasOnlyOverallVerdict = Boolean(result) && !hasPerTestResults;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {hasOnlyOverallVerdict ? (
        <div style={{ color: T.textMute, fontFamily: T.sans, fontSize: 12, marginBottom: 4 }}>
          Per-test results are unavailable; examples show expected behavior only.
        </div>
      ) : null}
      {problem.testCases.map((tc, i) => {
        const perTest = perTestResults?.[i];
        const ok = hasPerTestResults ? (perTest?.passed ?? null) : verdict === "pass" ? true : null;
        const inputText = JSON.stringify(perTest?.input ?? tc.input);
        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 1fr",
              alignItems: "center",
              gap: 12,
              color: T.textDim
            }}>
            <span>
              {ok === null ? (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.textFaint,
                    display: "inline-block"
                  }}
                />
              ) : ok ? (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3 7.5l2.5 2.5L11 4.5"
                    stroke={T.sage}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : ok === false ? (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                    stroke={T.red}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: T.textFaint,
                    display: "inline-block"
                  }}
                />
              )}
            </span>
            <span style={{ color: T.text, fontFamily: T.mono, fontSize: 12 }}>{inputText}</span>
            <span style={{ color: T.textMute }}>
              expected{" "}
              <span style={{ color: T.text }}>
                {perTest?.expected ?? tc.expected ?? "reference output"}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
