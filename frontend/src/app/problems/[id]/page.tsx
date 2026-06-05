"use client";

import { useEffect, useState } from "react";
import { getProblem } from "@/lib/api";
import { Workspace, type WorkspaceProblem } from "@/components/Workspace";

export default function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
  const [problem, setProblem] = useState<WorkspaceProblem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const resolved = await params;
        if (!active) return;

        const data = await getProblem(resolved.id);
        if (!active) return;

        const tags = [
          data.bug_category.replace(/_/g, " "),
          ...data.tags,
          `complexity: ${data.target_complexity}`
        ].filter((x): x is string => Boolean(x));

        setProblem({
          id: data.id,
          shortId: data.short_id,
          title: data.title,
          difficulty: data.difficulty,
          description: data.description,
          starterCode: data.slop_code,
          tags,
          prompt:
            "The starter code compiles but produces wrong results. Find and fix the defect without changing the function signature.",
          targetComplexity: data.target_complexity,
          testCases: data.visible_test_cases.map((tc) => ({ input: tc.input }))
        });
      } catch {
        if (!active) return;
        setError("Could not load this problem.");
        setProblem(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params]);

  return (
    <Workspace
      key={problem?.id ?? "loading"}
      problem={problem}
      isLoading={isLoading}
      loadError={error}
    />
  );
}
