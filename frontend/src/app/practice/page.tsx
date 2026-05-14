"use client";

import { Workspace, type WorkspaceProblem } from "@/components/Workspace";
import { PRACTICE_PROBLEM } from "@/lib/practice-problem";

const PROBLEM: WorkspaceProblem = {
  id: PRACTICE_PROBLEM.id,
  shortId: PRACTICE_PROBLEM.shortId,
  title: PRACTICE_PROBLEM.title,
  difficulty: PRACTICE_PROBLEM.difficulty,
  description: PRACTICE_PROBLEM.description,
  starterCode: PRACTICE_PROBLEM.starterCode,
  tags: PRACTICE_PROBLEM.tags,
  prompt: PRACTICE_PROBLEM.prompt,
  expectedExamples: PRACTICE_PROBLEM.expected,
  testCases: PRACTICE_PROBLEM.testCases,
};

export default function PracticePage() {
  return <Workspace problem={PROBLEM} backHref="/" backLabel="Problems" />;
}
