import type { DifficultyLevel } from "@/lib/tokens";

export type WorkspaceProblem = {
  id: string;
  shortId?: string;
  title: string;
  difficulty: DifficultyLevel | string | null;
  description: string;
  starterCode: string;
  tags?: string[];
  prompt?: string;
  expectedExamples?: { call: string; result: string }[];
  testCases?: { input: Record<string, unknown>; expected?: string }[];
  targetComplexity?: string | null;
};

export type SubmitResult = {
  verdict: "pass" | "partial" | "fail";
  stdout: string;
  cases_passed: number;
  cases_total: number;
  test_case_results: {
    passed: boolean;
    input: Record<string, unknown> | null;
    expected: string | null;
    actual: string | null;
    hidden?: boolean;
  }[];
  submission_id?: string | null;
  complexity_detected?: string | null;
  feedback_card?: string | null;
};

export type ResultKind = "run" | "submit";
