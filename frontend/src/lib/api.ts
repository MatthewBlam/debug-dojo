import { supabase } from "@/lib/supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type ApiProblem = {
  id: string;
  short_id: string;
  title: string;
  difficulty: string;
  bug_category: string;
  target_complexity: string;
  tags: string[];
};

export type ApiProblemDetail = ApiProblem & {
  description: string;
  function_signature: string;
  slop_code: string;
  visible_test_cases: { input: Record<string, unknown> }[];
};

export type ApiTestCaseResult = {
  passed: boolean;
  input: Record<string, unknown> | null;
  expected: string | null;
  actual: string | null;
  hidden: boolean;
};

export type ApiJudgeResult = {
  verdict: "pass" | "partial" | "fail";
  stdout: string;
  cases_passed: number;
  cases_total: number;
  test_case_results: ApiTestCaseResult[];
  complexity_detected?: string | null;
  feedback_card?: string | null;
};

export type ApiSubmission = {
  id: string;
  problem_id: string;
  problem_title: string | null;
  problem_short_id: string | null;
  verdict: "pending" | "pass" | "partial" | "fail";
  cases_passed: number;
  cases_total: number;
  complexity_detected?: string | null;
  feedback_card?: string | null;
  test_case_results: ApiTestCaseResult[];
  created_at: string;
};

export type ApiProgress = {
  total_problems: number;
  solved_problems: number;
  attempts: number;
  passed_submissions: number;
  partial_submissions: number;
  failed_submissions: number;
  accuracy: number | null;
  by_difficulty: Record<string, { total: number; solved: number }>;
  by_bug_category: Record<string, number>;
};

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token
      ? { Authorization: `Bearer ${data.session.access_token}` }
      : {};
  } catch {
    return {};
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(options.auth ? await authHeaders() : {}),
    ...(options.headers ?? {})
  };
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const message = response.status === 401 ? "Authentication required" : `Backend returned ${response.status}`;
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function listProblems(): Promise<ApiProblem[]> {
  return request<ApiProblem[]>("/api/v1/problems");
}

export function getProblem(id: string): Promise<ApiProblemDetail> {
  return request<ApiProblemDetail>(`/api/v1/problems/${id}`);
}

export function runCode(problemId: string, code: string): Promise<ApiJudgeResult> {
  return request<ApiJudgeResult>("/api/v1/runs", {
    method: "POST",
    body: JSON.stringify({ problem_id: problemId, code })
  });
}

export async function submitCode(problemId: string, code: string): Promise<string> {
  const data = await request<{ submission_id: string; verdict: "pending" }>("/api/v1/submissions", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ problem_id: problemId, code })
  });
  return data.submission_id;
}

export function getSubmission(id: string): Promise<ApiSubmission> {
  return request<ApiSubmission>(`/api/v1/submissions/${id}`, { auth: true });
}

export function listSubmissions(): Promise<ApiSubmission[]> {
  return request<ApiSubmission[]>("/api/v1/submissions", { auth: true });
}

export function getProgress(): Promise<ApiProgress> {
  return request<ApiProgress>("/api/v1/progress/me", { auth: true });
}
