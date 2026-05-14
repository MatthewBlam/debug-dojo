// Hardcoded practice problem. Matches the only problem_id the backend
// (backend/main.py:_PROBLEMS) is wired to run end-to-end, so Submit / Run
// against /api/v1/submissions actually returns a real verdict.

import type { DifficultyLevel } from "./tokens";

export type PracticeProblem = {
  id: string;
  shortId: string;
  title: string;
  difficulty: DifficultyLevel;
  tags: string[];
  description: string;
  expected: { call: string; result: string }[];
  prompt: string;
  starterCode: string;
  testCases: { input: string; expected: string }[];
};

export const PRACTICE_PROBLEM: PracticeProblem = {
  id: "2da798cf-79a9-4741-8382-f96dff10efce",
  shortId: "001",
  title: "Two Sum",
  difficulty: "Easy",
  tags: ["arrays", "hash map", "bad complexity"],
  description:
    "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume each input has at most one valid answer, and you may not use the same element twice.\n\nReturn the answer as an array of two indices. If no valid pair exists, return an empty array.",
  expected: [
    { call: "two_sum([2,7,11,15], 9)", result: "[0, 1]" },
    { call: "two_sum([3,3], 6)", result: "[0, 1]" },
    { call: "two_sum([], 0)", result: "[]" },
  ],
  prompt:
    "The starter solution is correct but O(n²). Rewrite it to run in O(n) using a single pass with a hash map.",
  starterCode: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]

    return []
`,
  testCases: [
    { input: "[2, 7, 11, 15], target=9", expected: "[0, 1]" },
    { input: "[3, 3], target=6", expected: "[0, 1]" },
    { input: "[], target=0", expected: "[]" },
  ],
};
