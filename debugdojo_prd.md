# DebugDojo — Product Requirements Document

**Version:** 1.0   **Date:** April 2026   **Status:** Approved for Sprint 1
**Team:** 4 developers (generalists)   **Timeline:** 3 sprints × 2 weeks = 6 weeks

---

## 1. Overview

**DebugDojo** is a coding-practice platform that flips the LeetCode premise: instead of writing solutions from scratch, users are handed **deliberately broken or inefficient AI-generated code** and must fix it. The platform trains what we believe is the most under-served, fastest-growing skill in software engineering today — **evaluating and correcting AI-generated output**.

**Differentiator:** LeetCode teaches you to write code. DebugDojo teaches you to read it critically. Every problem is a piece of "slop" — subtly wrong code produced by an LLM under controlled prompting — and your job is to find the bug, fix it, and (when applicable) improve the complexity.

**Target user:** CS students, early-career engineers, and interview candidates who already use AI coding assistants and need to build taste for when the AI is wrong.

---

## 2. Goals & Non-Goals

### In scope (MVP, 6 weeks)

- Deployable web platform with a production URL (not a localhost demo)
- LLM pipeline that generates categorized buggy Python code from correct solutions
- Sandboxed code execution via Judge0 (RapidAPI tier for MVP)
- Differential testing: user's fix compared against a known-correct reference solution
- AST-based complexity analysis (detect nested loops, redundant work)
- GitHub OAuth via Supabase
- Problem browser, Monaco code editor, feedback card, submission history, basic leaderboard
- 15 LLM-generated problems seeded and human-reviewed before launch

### Explicitly out of scope

- **Multi-language submissions** — Python-only for MVP. Adding a second language multiplies AST analyzer, reference-solution format, and Judge0 language IDs. Revisit post-MVP.
- **Empirical complexity profiling** (`big_O` library, n=100…50k curve fitting) — stretch goal. AST analysis is the MVP signal.
- **Hints system** — cut entirely.
- **Self-hosted Judge0** — stretch; we start on Judge0 RapidAPI free tier (50 req/day is enough for dev + demo).
- **Codeforces problem import** — cut. All MVP content is LLM-generated.
- LeetCode feature parity (contests, forums, company tags, discuss threads).
- Mobile app, real-time collaboration, paid tier, premium features.

---

## 3. Users & User Stories

| # | As a… | I want to… | So that… |
| - | ----- | ---------- | -------- |
| US-1 | visitor | browse problems without logging in | I can preview what the platform offers before committing |
| US-2 | logged-in user | filter problems by difficulty and bug category | I can target specific weaknesses |
| US-3 | logged-in user | open a problem and see the slop code in a Monaco editor | I can read and edit it in a familiar interface |
| US-4 | logged-in user | submit my fix and see a verdict within ~5 seconds | I get fast feedback like any modern judge |
| US-5 | logged-in user | read an LLM-generated explanation of the bug after I pass | I learn *why* my fix works, not just *that* it works |
| US-6 | logged-in user | view my submission history | I can re-read past attempts and track progress |
| US-7 | logged-in user | see a global leaderboard by problems solved | I have a low-stakes competitive hook to come back |

---

## 4. Core Features (priority for 6-week MVP)

| Feature | Description | Priority | Sprint |
| ------- | ----------- | -------- | ------ |
| Problem browser + filters | List view, filter by difficulty & bug category | P0 | 2 |
| Monaco code editor | VS Code-grade editor via `@monaco-editor/react`, SSR-safe | P0 | 1 |
| Slop display | Show buggy code pre-loaded in the editor; show problem statement alongside | P0 | 1–2 |
| Code execution | Submit code to FastAPI → Judge0 → return stdout/stderr | P0 | 1 |
| Differential testing | Run user code + reference solution on same inputs; compare stdout | P0 | 2 |
| Slop generation pipeline | Offline batch: LLM produces categorized buggy variants from correct solutions | P0 | 2 |
| Test case generator | LLM generates inputs; reference solution produces expected outputs | P0 | 2 |
| AST complexity check | Detect nested loops, sort-inside-loop, redundant work | P0 | 3 |
| Verdict logic | Combines correctness + complexity into pass / partial / fail | P0 | 3 |
| GitHub OAuth | Supabase Auth with GitHub provider | P1 | 2 |
| Feedback card | LLM-generated explanation shown after verdict | P1 | 2 |
| Submission history | User's past submissions, sorted by recency | P1 | 2 |
| Leaderboard | Simple global ranking by # problems solved | P1 | 3 |
| Empirical complexity profiling | Run at n=[100, 1k, 10k], fit curve | P2 (stretch) | 3 |
| Self-hosted Judge0 | Move off RapidAPI to own DigitalOcean droplet | P2 (stretch) | 3 |

---

## 5. Slop Bug Categories

Every problem is tagged with one primary bug category. The LLM is prompted to introduce *only* that category's class of bug.

1. **Complexity degradation** — O(n²) where O(n) is achievable (nested loop where a dict lookup works)
2. **Off-by-one** — wrong loop bounds, `<` vs `<=`, `range(n)` vs `range(n+1)`
3. **Wrong base case** — incorrect recursion termination (returns wrong value, wrong condition)
4. **Missing edge case** — empty input, negatives, single element, all duplicates
5. **Subtle logic error** — wrong operator (`and` vs `or`), flipped condition, wrong variable used
6. **Redundant work** — recomputing inside a loop that could be cached outside

---

## 6. Validation Logic

### Correctness — Differential Testing

The platform never hardcodes "expected output" strings. Instead, for every problem we store a **reference solution** that we trust. On submission:

1. Wrap user's code and reference code in identical test harnesses
2. Send both to Judge0 with the same stdin (one test case at a time)
3. Compare stdout byte-for-byte
4. Repeat for all 5–10 test cases per problem

Benefit: test cases can be LLM-generated without manually computing expected outputs — the reference solution is the oracle.

### Complexity — AST Analysis (MVP)

Python's built-in `ast` module, walked by a custom visitor. Detects:
- Nested `for` / `while` loops (flag as O(n²) or worse)
- Sorting inside a loop
- Linear search inside a loop (when a set/dict would be O(1))
- Recomputed expressions inside loops

Outputs a detected complexity tier: `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(n³+)`, `unknown`.

### Empirical Profiling (stretch, sprint 3)

If capacity allows: run user's code at `n = [100, 1000, 10000]`, measure wall time, fit a curve with `big_O`. Median of 3 runs per size to reduce noise.

### Verdict

| Verdict | Condition |
| ------- | --------- |
| ✅ **Pass** | All test cases correct AND detected complexity ≤ target complexity |
| ⚠️ **Partial** | All test cases correct BUT complexity worse than target |
| ❌ **Fail** | At least one test case incorrect (or timeout / runtime error) |

---

## 7. Tech Stack (verified April 2026)

### Summary

| Layer | Choice | Version |
| ----- | ------ | ------- |
| Frontend framework | Next.js App Router + TypeScript | Next.js 16 |
| Code editor | `@monaco-editor/react` (dynamic import) | latest |
| UI styling | Tailwind CSS + shadcn/ui | latest |
| Backend | FastAPI (Python 3.12) | 0.128 |
| Database + Auth | Supabase (Postgres + GitHub OAuth) | SSR client |
| Code sandbox | Judge0 CE via RapidAPI (MVP) → self-host (stretch) | CE |
| LLM | Google Gemini 2.5 Flash (free tier) | 2.5-flash |
| Cache (optional) | Upstash Redis | serverless |
| Hosting (FE) | Vercel | hobby tier |
| Hosting (BE) | Railway | free tier |

### Alternatives considered

**Next.js 16 vs. Vite + React Router.** Chose Next.js for built-in SSR (class requirement), Vercel zero-config deploy, and file-system App Router that a 4-person team can navigate without conventions debates. Vite is simpler but we'd rebuild auth middleware, routing, and deploy ourselves. Next.js 16 brings React 19.2, Turbopack as default, and the React Compiler out of the box — less manual perf work.

**`@monaco-editor/react` vs. CodeMirror 6.** Monaco is the actual VS Code editor; users recognize it instantly, which matters for a demo. CodeMirror is lighter and more customizable but needs more assembly. We don't need customization — we need "looks like VS Code" in one import. Must be loaded via `next/dynamic` with `ssr: false` since Monaco touches `document` at import time.

**FastAPI vs. Flask vs. Express.** Python is non-negotiable because the slop-generation pipeline, `ast` analyzer, and potential `big_O` profiler all live here. FastAPI beats Flask on async support (important for long-poll submission endpoints) and auto-generates OpenAPI docs that our TS frontend can consume for typed clients. Express would force us to rewrite the Python pipeline in Node, which is a non-starter.

**Supabase vs. Neon+Clerk vs. Firebase.** Supabase bundles Postgres, Auth, and row-level security in one free-tier dashboard. Neon+Clerk requires integrating two products. Firebase is NoSQL, which is a poor fit for our relational data (problems ↔ test_cases ↔ submissions ↔ users). Supabase's SSR client (`/supabase/ssr`) has first-class Next.js App Router support.

**Judge0 vs. Piston vs. E2B.** Piston's public API became non-commercial / auth-only on Feb 15, 2026, so it's effectively out. E2B is excellent but paid. Judge0 CE is the battle-tested choice — the CVE-2024-29021 sandbox-escape is real but mitigated by (a) running on an isolated VM, (b) disabling network access, (c) never co-locating with the database. RapidAPI hosts it for free up to 50 requests/day, which is sufficient for development and a demo; self-hosting is a sprint 3 stretch if we need volume.

**Gemini 2.5 Flash vs. Groq Llama 3.3 vs. Cerebras.** Gemini's free tier offers 1500 req/day and a 1M-token context, both meaningfully larger than Groq's 1000/day and Cerebras's ~1700/day. For slop generation — which is a *batch offline* workload, not latency-sensitive — throughput-per-day matters more than tokens-per-second. Gemini also scores higher on code-generation benchmarks. If feedback-card latency becomes a UX issue later, we can add Groq as a secondary provider for that hot path.

**Upstash Redis vs. in-memory vs. none.** Deferred — add only if the leaderboard query is slow or we need rate limiting. For MVP, Postgres indexes are enough.

---

## 8. Data Model

All tables live in Supabase Postgres. Row-level security (RLS) enforced.

### `problems`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `title` | text | |
| `description` | text | Markdown |
| `difficulty` | enum: easy/medium/hard | |
| `bug_category` | enum (6 slop types) | |
| `target_complexity` | text | e.g., "O(n)" |
| `slop_code` | text | The broken code shown to the user |
| `reference_solution` | text | Correct code, never shown to user |
| `function_signature` | text | e.g., `def two_sum(nums: list[int], target: int) -> list[int]` |
| `status` | enum: draft/reviewed/published | Human-review gate |
| `created_at` | timestamptz | |

### `test_cases`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `problem_id` | uuid FK → problems | |
| `input` | text | stdin passed to Judge0 |
| `is_hidden` | bool | Hidden cases run on submission only |

(Expected outputs are computed at runtime from `reference_solution`, not stored.)

### `submissions`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `problem_id` | uuid FK → problems | |
| `code` | text | User's submitted code |
| `verdict` | enum: pass/partial/fail | |
| `complexity_detected` | text | From AST analyzer |
| `cases_passed` | int | |
| `cases_total` | int | |
| `feedback_card` | text | LLM output, nullable (async) |
| `created_at` | timestamptz | |

### `users`

Managed by Supabase Auth (`auth.users`). We only add a public `profiles` view for joins on leaderboard:

| Column | Type |
| ------ | ---- |
| `id` | uuid (= auth.users.id) |
| `github_username` | text |
| `avatar_url` | text |

### RLS policies (summary)

- `problems`, `test_cases` (non-hidden): readable by anyone
- `test_cases` (hidden): backend service role only
- `submissions`: user can read their own; leaderboard aggregates via `SECURITY DEFINER` function
- `profiles`: public read

---

## 9. Architecture — Submission Flow

```
┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌────────┐
│ Next.js  │───▶│  Next.js API │───▶│  FastAPI  │───▶│ Judge0 │
│ (editor) │    │    (proxy)   │    │  (judge)  │    │  (exec)│
└──────────┘    └──────────────┘    └───────────┘    └────────┘
     ▲                                     │
     │                                     ▼
     │                              ┌────────────┐
     │                              │  Supabase  │
     └──── poll GET /submissions ──▶│  Postgres  │
                                    └────────────┘
```

### Request lifecycle

1. User clicks **Submit** in Monaco editor
2. Next.js API route `POST /api/submissions` forwards to FastAPI with Supabase JWT
3. FastAPI creates a `submissions` row with `verdict='pending'`, returns submission id
4. FastAPI kicks off (async background task):
   a. Wrap user code in test harness
   b. For each test case: send user code + reference code to Judge0 in parallel
   c. Compare stdouts (differential testing)
   d. Run AST analyzer on user code
   e. Compute verdict
   f. Call Gemini for feedback card (fire-and-forget; updated when done)
   g. Update `submissions` row with results
5. Frontend polls `GET /api/submissions/{id}` every 1s until `verdict != 'pending'`
6. Frontend renders verdict + feedback card

### Security

- **Sandbox:** Judge0 runs every execution in an `isolate` sandbox — own PID/network namespace, disabled network, 2s CPU limit, 256 MB RAM limit
- **Isolation:** Judge0 host VM is separate from backend and DB hosts
- **Auth:** Supabase JWT verified on every FastAPI request via `supabase-py`; user id comes from the JWT, never from the request body
- **RLS:** enforced at Postgres layer even if backend code is wrong
- **API keys:** Gemini and Judge0 keys live only in Railway environment variables; never in client bundle

---

## 10. Slop Generation Pipeline

**Offline batch process**, not user-triggered. Run by a team member via CLI, reviewed manually, then imported to Supabase.

### Steps per problem

1. **Seed problem** — human writes (or LLM drafts + human edits) a problem statement + correct Python reference solution
2. **Generate slop variants** — LLM prompt: *"Given this correct Python solution, produce a version that contains exactly one bug of category X. Do not add comments. Return only the modified function."* One call per bug category we want to cover.
3. **Generate test cases** — LLM prompt: *"Given this function signature and problem description, generate 8 test case inputs covering edge cases: empty, single element, duplicates, negatives, large, typical."*
4. **Verify oracle** — run reference solution on all test cases; if any raise an exception, regenerate that test case
5. **Verify slop is actually broken** — run slop on all test cases; require it fails at least one (otherwise the "bug" isn't testable)
6. **Human review** — a team member reads the problem + slop + fix, confirms the bug is real and the category is accurate, sets `status='reviewed'`

### Review gate

- First 15 problems: **100% human-reviewed** before `status='published'`
- Beyond 15: sampling review (review 1 in 3)

### Prompt templates

Stored in `backend/prompts/` as versioned `.txt` files so diffs are traceable in git.

---

## 11. Security

| Concern | Mitigation |
| ------- | ---------- |
| Judge0 sandbox escape (CVE-2024-29021) | Run on isolated VM; network disabled; Judge0 never co-located with DB or backend; API key rotation monthly |
| Prompt injection in user-submitted code affecting LLM feedback card | Feedback card is generated from submission metadata only (bug category, test results), NOT from user code content |
| Supabase RLS misconfig leaking other users' submissions | Integration test per sprint that verifies user A cannot read user B's submission row |
| API key leakage | All keys in Railway / Vercel env vars; git pre-commit hook scans for `GEMINI_` and `JUDGE0_` patterns |
| Rate-limit abuse | Per-user limit (10 submissions / minute) enforced at FastAPI layer via simple in-memory sliding window; upgrade to Upstash if abused |
| Denial of service via infinite loops | Judge0's 2s CPU limit + 256 MB memory limit catches these automatically |

---

## 12. Milestones (3 sprints × 2 weeks)

| Sprint | Theme | End-of-sprint demo |
| ------ | ----- | ------------------ |
| **1** | Walking skeleton | Logged-out user opens a deployed URL, picks one hardcoded problem, edits Python in Monaco, submits → sees "correct" / "incorrect" from Judge0. No AI, no auth. |
| **2** | Slop pipeline + auth | Logged-in user browses 10+ LLM-generated problems, picks one, sees slop pre-loaded in editor, fixes it, sees differential-test verdict + LLM feedback card. Submission history works. |
| **3** | Judge + polish + demo | AST complexity analyzer integrated; verdict shows pass/partial/fail with complexity detail; leaderboard live; 15+ problems seeded; production deploy; README + demo script complete. Stretch: self-hosted Judge0, empirical profiling. |

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Team unfamiliar with Next.js App Router | Sprint 1 slips | Pair-programming first week; Sprint 1 deliverable is deliberately small (walking skeleton) |
| LLM-generated slop is too obvious or too subtle | Problems feel boring | Manual review gate on first 15 problems; iterate on prompts in sprint 2 |
| Judge0 RapidAPI 50/day cap hit during demo | Demo breaks | Have self-host as sprint 3 stretch; cache verdicts per (code, problem) hash so retries don't re-bill |
| AST analyzer has false positives on correct code | User frustration | For MVP, complexity only affects `pass` vs `partial` — never downgrades to `fail`. Safer to under-report than over-report |
| Supabase free tier limits (500 MB DB, 50K monthly active users) | Unlikely to hit in class | Acknowledge; would need paid tier only if project lives beyond class |
| Gemini free tier quota exhaustion | Slop gen blocked | Slop generation is offline/batch, not user-triggered; 1500 req/day is ~10× what we need for 15 problems |
| Team member dropping class or under-contributing | Sprint slippage | Generalist staffing + no single-owner critical paths; pair-review on all PRs |

---

## 14. Open Questions (resolve in Sprint 1)

1. **Which 15 problems?** Target mix: 5 easy / 7 medium / 3 hard. Need a problem-selection lead on the team. Suggested domains: arrays, strings, hash maps, recursion, trees. (No graph/DP in MVP — too many edge cases to slop-ify cleanly.)
2. **Who owns the Gemini prompts?** Recommend one team member as "slop lead" for sprint 2 to keep prompt style consistent.
3. **Branch strategy?** Trunk-based with short-lived feature branches vs. GitFlow. Recommend trunk-based given team size.
4. **CI provider?** GitHub Actions (free for public repo) — recommended. Lint + typecheck on PR; no deploy-on-merge for MVP (manual deploys to Vercel/Railway).
5. **Demo script ownership?** Assign in sprint 2 retro, draft by end of sprint 3 week 1.

---

## Appendix A — Glossary

- **Slop** — intentionally-flawed LLM-generated code; our platform's core content
- **Differential testing** — running two implementations on the same input and comparing outputs
- **Oracle** — the trusted reference that defines "correct" in differential testing (here: the reference solution)
- **Verdict** — the pass/partial/fail result returned after submission
- **Isolate** — the Linux sandbox used by Judge0 (not to be confused with JS-isolates)
