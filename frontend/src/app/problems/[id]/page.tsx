"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Workspace, type WorkspaceProblem } from "@/components/Workspace";

type ProblemRecord = {
  id: string;
  title: string;
  description: string;
  slop_code: string;
  difficulty: string | null;
  bug_category: string | null;
  target_complexity: string | null;
};

export default function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

        const { data, error: queryError } = await supabase
          .from("problems")
          .select("id,title,description,slop_code,difficulty,bug_category,target_complexity")
          .eq("id", resolved.id)
          .single<ProblemRecord>();

        if (!active) return;
        if (queryError || !data) throw queryError ?? new Error("Problem not found");

        const tags = [
          data.bug_category ? data.bug_category.replace(/_/g, " ") : null,
          data.target_complexity ? `complexity: ${data.target_complexity}` : null,
        ].filter((x): x is string => Boolean(x));

        setProblem({
          id: data.id,
          shortId: data.id.replace(/[^0-9a-f]/gi, "").slice(0, 4),
          title: data.title,
          difficulty: data.difficulty,
          description: data.description,
          starterCode: data.slop_code,
          tags,
          prompt:
            "The starter code compiles but produces wrong results. Find and fix the defect without changing the function signature.",
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
