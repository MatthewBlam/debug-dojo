# DebugDojo — Software Requirements Document

**Version:** 1.0 | **Date:** April 2026 | **Status:** Draft | **Team:** 4 developers, 1 quarter

---

## 1. Overview

DebugDojo is a coding practice platform that presents deliberately degraded AI-generated code and challenges users to fix it. Unlike LeetCode, users don't write solutions from scratch — they debug and optimize existing slop. This trains the increasingly critical skill of evaluating AI-generated output.

---

## 2. Goals

**In scope**

- Deployable, usable platform (not a prototype)
- AI pipeline that generates categorized buggy/inefficient code from correct solutions
- Sandboxed code execution with correctness and time complexity evaluation
- User auth, submission history, leaderboard

**Out of scope**

- LeetCode feature parity (contests, forums, company tags)
- Mobile app, real-time collaboration, paid tier

---

## 3. Core Features

| Feature             | Description                                        | Priority |
| ------------------- | -------------------------------------------------- | -------- |
| Problem browser     | Filter by difficulty, bug type, topic              | P0       |
| Code editor         | Monaco Editor (VS Code in browser), diff view      | P0       |
| Slop display        | Show buggy solution alongside problem statement    | P0       |
| Code execution      | Judge0 sandboxed runner, multi-language            | P0       |
| Correctness check   | Differential testing vs reference solution         | P0       |
| Complexity check    | AST analysis + empirical profiling + LLM confirm   | P0       |
| Slop generator      | LLM pipeline: correct solution → categorized bugs  | P0       |
| Test case generator | LLM inputs + reference solution as oracle          | P0       |
| Auth                | GitHub OAuth via Supabase                          | P1       |
| Feedback card       | LLM explanation of the bug and why the fix works   | P1       |
| Leaderboard         | Fix time, complexity improvement scores            | P1       |
| Hint system         | Graduated hints: bug type → location → explanation | P2       |

---

## 4. Slop Bug Categories

- **Complexity degradation** — O(n²) where O(n) is achievable
- **Off-by-one** — wrong loop bounds, `<` vs `<=`
- **Wrong base case** — incorrect recursion termination
- **Missing edge case** — empty input, negatives, single element
- **Subtle logic error** — wrong operator, flipped condition
- **Redundant work** — recomputing inside a loop that could be cached

---

## 5. Validation

**Correctness — differential testing**
Run user code and reference solution on the same inputs via Judge0. Compare stdout. No hardcoded expected outputs — the reference solution is the oracle.

**Time complexity — three layers**

1. AST analysis (instant) — detect nested loops, sort-inside-loop
2. Empirical profiling — run at `n = [100, 1k, 10k, 50k]`, fit curve with `big_O` library
3. LLM confirmation — explain detected complexity, generate feedback card

**Verdict**

- ✅ Pass — correct output + complexity matches or beats target
- ⚠️ Partial — correct output but complexity not improved
- ❌ Fail — incorrect output on one or more test cases

---

## 6. Tech Stack

| Layer          | Choice                          | Notes                                                    |
| -------------- | ------------------------------- | -------------------------------------------------------- |
| Frontend       | Next.js 14 + Monaco Editor      | SSR, required by class, free on Vercel                   |
| Backend        | FastAPI (Python)                | Hosts ML pipeline: `ast`, `big_O`, LLM calls             |
| Code execution | Judge0 CE (self-hosted)         | Isolate sandbox, deployed on isolated $6/mo DO droplet   |
| Database       | PostgreSQL via Supabase         | Includes auth + row-level security for free              |
| Cache / Queue  | Redis via Upstash               | Async job queue, rate limiting, leaderboard cache        |
| Auth           | Supabase (GitHub OAuth)         | Natural fit for a dev platform                           |
| LLM (prod)     | Groq free tier (Llama 3)        | No credit card, fast, sufficient for slop gen + feedback |
| LLM (dev)      | Ollama + qwen2.5-coder          | Zero cost local inference, same API interface as Groq    |
| Hosting        | Vercel + Railway + DigitalOcean | Next.js, FastAPI, Judge0 each on separate services       |

---

## 7. Data Model

| Table         | Key Columns                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| `problems`    | id, title, description, difficulty, bug_category, slop_code, reference_solution   |
| `test_cases`  | id, problem_id, input, expected_output                                            |
| `submissions` | id, user_id, problem_id, code, language, verdict, complexity_detected, created_at |
| `users`       | id, github_username, email (managed by Supabase Auth)                             |

---

## 8. Architecture — Submission Flow

```
User submits fix
  → Next.js API route → FastAPI
  → FastAPI wraps code in test harness → Judge0 (async)
  → Frontend polls every 1s for result
  → FastAPI runs: differential test + AST check + empirical profiling
  → LLM generates feedback card
  → Verdict returned to frontend
```

**Security:** Each execution runs in an Isolate sandbox (own PID/network namespace). Network disabled. Hard limits: 2s CPU, 256 MB RAM. Judge0 VM is isolated from backend and DB.

---

## 9. Problem Content

Do not scrape LeetCode (ToS violation, copyright). Use:

- **Codeforces** open problems (public, widely reused in research)
- **LLM-generated originals** — the platform's own content, zero copyright exposure

Test cases are generated by LLM (inputs) + reference solution (expected outputs). No hardcoded answers.

---

## 10. Milestones

| Weeks | Deliverable                                                                      |
| ----- | -------------------------------------------------------------------------------- |
| 1–2   | Next.js + Supabase + Monaco + Judge0 via RapidAPI. Core submission loop working. |
| 3–4   | FastAPI + slop generation pipeline + test case generator + problem storage       |
| 5–6   | Self-host Judge0, differential testing, empirical complexity check               |
| 7–8   | AST analysis, feedback card, auth, submission history, bug tagging               |
| 9–10  | Leaderboard, UI polish, seed 50+ problems, deploy, demo prep                     |

---

## 11. Risks

| Risk                                   | Mitigation                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| Judge0 CVE-2024-29021 (sandbox escape) | Run on isolated VM, disable network, never co-locate with DB                    |
| Slop quality                           | Constrain prompts to specific bug categories; manually review first 20 problems |
| Empirical complexity noise             | Run each input size 5× take median; flag inconclusive results                   |
| LeetCode ToS                           | Use Codeforces + LLM-generated content only                                     |
| Groq rate limits                       | 30 req/min free tier; slop is generated offline not on user request             |
