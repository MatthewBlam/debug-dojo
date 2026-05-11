"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import type { EditorProps } from "@monaco-editor/react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const MonacoEditor = dynamic<EditorProps>(() => import("@monaco-editor/react"), {
  ssr: false,
});

type ProblemRecord = {
  id: string;
  title: string;
  description: string;
  slop_code: string;
};

type SubmitResult = {
  verdict: "pass" | "fail";
  stdout: string;
};

export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [problemId, setProblemId] = useState<string>("");
  const [problem, setProblem] = useState<ProblemRecord | null>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProblem = async () => {
      setIsLoading(true);
      setError(null);
      setSubmitResult(null);

      const resolvedParams = await params;
      if (!isMounted) {
        return;
      }
      setProblemId(resolvedParams.id);

      const { data, error: queryError } = await supabase
        .from("problems")
        .select("id,title,description,slop_code")
        .eq("id", resolvedParams.id)
        .single<ProblemRecord>();

      if (!isMounted) {
        return;
      }

      if (queryError || !data) {
        setError("Could not load this problem.");
        setProblem(null);
        setCode("");
      } else {
        setProblem(data);
        setCode(data.slop_code ?? "");
      }

      setIsLoading(false);
    };

    void loadProblem();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    [],
  );

  const handleSubmit = async () => {
    if (!problemId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem_id: problemId,
          code,
        }),
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      const data = (await response.json()) as SubmitResult;
      setSubmitResult(data);
    } catch {
      setError("Failed to submit code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <h1 className="text-lg font-semibold">{problem?.title ?? "Problem"}</h1>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading || !problem}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </header>

        {submitResult && (
          <div
            className={`mb-4 rounded-md border px-4 py-3 text-sm font-medium ${
              submitResult.verdict === "pass"
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-rose-300 bg-rose-50 text-rose-900"
            }`}
          >
            {submitResult.verdict === "pass" ? "Passed" : "Failed"}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        )}

        <div className="grid flex-1 gap-4 lg:grid-cols-2">
          <article className="min-h-[40vh] overflow-y-auto rounded-lg border border-border bg-card p-5">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading problem...</p>
            ) : (
              <div className="space-y-4 text-sm leading-7">
                <div className="space-y-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
                  <ReactMarkdown>
                    {problem?.description ?? ""}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </article>

          <div className="min-h-[40vh] overflow-hidden rounded-lg border border-border">
            <MonacoEditor
              defaultLanguage="python"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
