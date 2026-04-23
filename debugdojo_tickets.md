# DebugDojo — Ticket Backlog

**Timeline:** 3 sprints × 2 weeks = 6 weeks   **Team:** 4 generalists   **Budget:** \$0 (free tiers + local only)

---

## Legend

- **Sprint:** 1 / 2 / 3 / stretch
- **Points:** S ≈ half-day, M ≈ 1–2 days, L ≈ 3–4 days
- **Area:** `FE` frontend, `BE` backend, `AI` LLM/analysis, `DB` data/SQL, `INFRA` deploy/CI, `AUTH` auth-specific, `CONTENT` problem-seeding, `DOC` docs
- **Depends on:** ticket IDs that must be merged first

**Ticket ID prefixes:** `DD-###` (DebugDojo-nnn). Numbering is stable — do not renumber tickets after sprint starts.

---

## Sprint Overview

| Sprint | Theme | Ticket count | Focus |
| ------ | ----- | ------------ | ----- |
| 1 | Walking skeleton | 12 | Local app → edit → submit → verdict. Single hardcoded problem, no auth, no AI. |
| 2 | Slop pipeline + auth | 15 | Auth, LLM pipeline, 10+ real problems, differential testing, feedback card. |
| 3 | Judge + polish + demo | 10 | AST complexity, leaderboard, 15 problems, polish, README. |
| Stretch | Post-MVP if time allows | 2 | Empirical profiling, Sentry (free tier). |

**Total: ~39 tickets** (including stretch). Capacity: 4 devs × 6 weeks ≈ 48 dev-weeks, so ~1.25 tickets / dev / week after overhead. All tooling free-tier or local — no budget required.

---

## Sprint 1 — Walking Skeleton (Weeks 1–2)

**Goal:** A locally running app where any visitor picks the one hardcoded problem, edits Python in Monaco, clicks Submit, and sees "correct" / "incorrect" from a real (self-hosted) Judge0 run.

**Sprint 1 dependency graph (high level):**

```
DD-001 (repo) ──► DD-002 (CI) ──► DD-003 (FE scaffold) ──► DD-004 (Monaco)
                                                             │
                 DD-005 (FastAPI scaffold) ──► DD-006 (Judge0 adapter)
                                                │
                 DD-007 (Supabase schema v1) ──► DD-008 (seed 1 problem)
                                                │
                 (DD-004, 006, 008) ──► DD-009 (submit endpoint)
                                         ──► DD-010 (submit UI flow)
                                         ──► DD-011 (local dev setup)
                                         ──► DD-012 (E2E smoke test)
```

---

### DD-001: Monorepo scaffold & conventions
**Sprint:** 1   **Points:** S   **Depends on:** —   **Area:** INFRA   **Assigned to:** Saurish
**Description:** Initialize `frontend/` (Next.js) and `backend/` (FastAPI) in the existing git repo. Add root-level `README.md`, `.editorconfig`, `.gitignore`, and `.nvmrc` / `.python-version`.
**Acceptance criteria:**
- [ ] `frontend/` and `backend/` directories created with placeholder READMEs
- [ ] Root README links to both and documents how to run each locally
- [ ] `.gitignore` excludes `node_modules/`, `.venv/`, `.env*`, `.next/`, `__pycache__/`
- [ ] PR merged to `main`

---

### DD-002: GitHub Actions CI
**Sprint:** 1   **Points:** S   **Depends on:** DD-001   **Area:** INFRA   **Assigned to:** Saurish
**Description:** Two workflows — `frontend.yml` runs `pnpm lint && pnpm typecheck` on PRs touching `frontend/**`; `backend.yml` runs `ruff check && mypy` on PRs touching `backend/**`.
**Acceptance criteria:**
- [ ] Failing lint blocks PR merge
- [ ] Workflows only trigger on the matching paths (use `paths:` filter)
- [ ] Green check on a test PR

---

### DD-003: Next.js 16 scaffold + Tailwind + shadcn/ui
**Sprint:** 1   **Points:** M   **Depends on:** DD-001   **Area:** FE   **Assigned to:** Matt
**Description:** `create-next-app` with TypeScript, App Router, Tailwind. Install `shadcn/ui` CLI and initialize. Remove boilerplate; add a simple `/` landing route.
**Acceptance criteria:**
- [ ] Next.js 16, App Router, TypeScript strict mode enabled
- [ ] Tailwind working; shadcn `Button` component renders on `/`
- [ ] `pnpm dev` runs without warnings
**Notes:** Pin Next.js to 16.x latest stable. Do NOT enable experimental features.

---

### DD-004: Monaco editor integration
**Sprint:** 1   **Points:** M   **Depends on:** DD-003   **Area:** FE   **Assigned to:** Matt
**Description:** Install `@monaco-editor/react` and `monaco-editor`. Create `<CodeEditor />` component that loads Monaco via `next/dynamic` with `ssr: false`. Default language Python, dark theme.
**Acceptance criteria:**
- [ ] Editor renders on a test page `/editor-test`
- [ ] Python syntax highlighting works
- [ ] `onChange` prop receives updated code string
- [ ] No hydration warnings in console
**Notes:** `import dynamic from 'next/dynamic'; const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });`. Prior art: https://dev.to/swyx/how-to-add-monaco-editor-to-a-next-js-app-ha3

---

### DD-005: FastAPI backend scaffold
**Sprint:** 1   **Points:** S   **Depends on:** DD-001   **Area:** BE   **Assigned to:** Arti
**Description:** Initialize FastAPI app in `backend/`. Add `GET /health` returning `{"status": "ok"}`. Add `poetry` or `uv` for dependency management. Set up `ruff` + `mypy` configs.
**Acceptance criteria:**
- [ ] `uvicorn main:app --reload` runs locally
- [ ] `GET /health` returns 200 with JSON body
- [ ] `ruff check` and `mypy` pass on the scaffold
**Notes:** Python 3.12. Prefer `uv` over `poetry` for faster installs.

---

### DD-006: Self-hosted Judge0 (Docker) + Python adapter
**Sprint:** 1   **Points:** M   **Depends on:** DD-005   **Area:** BE   **Assigned to:** Arti
**Description:** Add a `docker-compose.yml` at the repo root that runs Judge0 CE locally (Judge0 server + worker + Postgres + Redis, all from the official images). Bind to `127.0.0.1` only. Then write a thin Python wrapper in `backend/judge0/client.py` with `async def run_python(code: str, stdin: str) -> RunResult` that POSTs to the local Judge0, polls for completion, and returns stdout/stderr/status.
**Acceptance criteria:**
- [ ] `docker compose up judge0` starts Judge0 and `curl http://127.0.0.1:2358/about` returns a JSON response
- [ ] Judge0 services bind to `127.0.0.1` only (not `0.0.0.0`)
- [ ] `run_python` returns `RunResult(stdout, stderr, status, time_ms)`
- [ ] Unit test with a mocked `httpx` client
- [ ] `JUDGE0_URL` (default `http://127.0.0.1:2358`) loaded from `.env`; no API key required
**Notes:** Judge0 language_id for Python 3: 71. Use the `judge0/judge0:1.13.1` image series (pin the exact tag in compose). Set `ENABLE_NETWORK=false` and standard resource limits in the Judge0 config. See https://github.com/judge0/judge0 for INSTALL.md.

---

### DD-007: Supabase project + schema v1
**Sprint:** 1   **Points:** M   **Depends on:** DD-001   **Area:** DB   **Assigned to:** Rayan
**Description:** Create Supabase project (free tier). Write initial SQL migration for `problems`, `test_cases`, `submissions`, `profiles` tables per PRD §8. Commit migration to `backend/migrations/0001_init.sql`.
**Acceptance criteria:**
- [ ] Migration applied to Supabase via `supabase db push`
- [ ] Enums for `difficulty`, `bug_category`, `verdict`, `status` created
- [ ] Foreign keys + indexes on `submissions.user_id`, `submissions.problem_id`
- [ ] Migration file committed to git
**Notes:** Use Supabase CLI — `npx supabase init && npx supabase link --project-ref ...`. Keep a single `anon` key and `service_role` key in team 1Password.

---

### DD-008: Seed one hardcoded problem
**Sprint:** 1   **Points:** S   **Depends on:** DD-007   **Area:** CONTENT   **Assigned to:** Rayan
**Description:** Manually author one problem (Two Sum with a nested-loop slop variant). Write a SQL insert script in `backend/seeds/0001_two_sum.sql` that inserts the `problems` row + 3 `test_cases` rows.
**Acceptance criteria:**
- [ ] Problem statement describes Two Sum
- [ ] `slop_code` has a nested-loop O(n²) implementation
- [ ] `reference_solution` has an O(n) hashmap implementation
- [ ] 3 test cases including an edge case (empty-ish, duplicates)
- [ ] `status='published'`
**Notes:** This is the ONLY problem in sprint 1. Real content starts sprint 2.

---

### DD-009: Submission endpoint (sync v1)
**Sprint:** 1   **Points:** M   **Depends on:** DD-006, DD-007, DD-008   **Area:** BE   **Assigned to:** Arti
**Description:** `POST /api/v1/submissions` with body `{problem_id, code}`. Synchronously runs user code against the first test case via Judge0, returns `{verdict: "pass" | "fail", stdout}`. No auth yet. No differential testing yet (just exact-match to a hardcoded expected string for the single problem).
**Acceptance criteria:**
- [ ] Endpoint responds in < 10s for the Two Sum problem
- [ ] Returns 400 on invalid problem_id
- [ ] Returns 502 on Judge0 failure (not 500)
- [ ] Integration test runs against a real Judge0 call (can be skipped in CI with env flag)
**Notes:** Sync is fine for sprint 1 because we have one test case. Sprint 2 upgrades to async + multi-case.

---

### DD-010: Problem page with editor + submit
**Sprint:** 1   **Points:** M   **Depends on:** DD-004, DD-009   **Area:** FE   **Assigned to:** Matt
**Description:** Route `/problems/[id]` — fetches problem from Supabase (client-side is fine for sprint 1), shows description on left, Monaco editor pre-loaded with `slop_code` on right, Submit button calls FastAPI and shows result banner.
**Acceptance criteria:**
- [ ] Problem description renders markdown
- [ ] Monaco loads slop_code as initial value
- [ ] Submit button disabled while request in flight
- [ ] Green "Passed" or red "Failed" banner after response
- [ ] Works for the Two Sum seeded problem
**Notes:** Use Supabase anon key for read. Fine to call FastAPI directly from the browser in sprint 1; we'll add a Next.js API proxy in sprint 2.

---

### DD-011: One-command local dev setup
**Sprint:** 1   **Points:** M   **Depends on:** DD-010   **Area:** INFRA   **Assigned to:** Saurish
**Description:** Make the full stack runnable from a clean clone with minimal ceremony. Create a root `docker-compose.yml` (extends DD-006's Judge0 compose) and a `Makefile` (or `justfile`) with targets: `make install`, `make dev` (starts Judge0 + FastAPI + Next.js), `make stop`. Wire env vars via `.env.example` files for both `frontend/` and `backend/`.
**Acceptance criteria:**
- [ ] Fresh clone → `make install && make dev` → app reachable at `http://localhost:3000`
- [ ] `.env.example` in both `frontend/` and `backend/` lists every required var (Supabase URL, anon key, service role, Gemini key, `JUDGE0_URL`)
- [ ] Frontend reads `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- [ ] README documents the setup in < 10 lines
**Notes:** No paid hosting. Class demo runs on a laptop. If someone wants a public URL later, Vercel hobby (free) for FE + Fly.io / Render free for BE are both options — not required for MVP.

---

### DD-012: End-to-end smoke test & sprint 1 demo
**Sprint:** 1   **Points:** S   **Depends on:** DD-011   **Area:** INFRA   **Assigned to:** Saurish
**Description:** Record a 30-second screen capture on a local run: open `http://localhost:3000` → click problem → edit slop → submit → pass. Check into `docs/demos/sprint1.mp4`. Write 5-line smoke-test checklist in README.
**Acceptance criteria:**
- [ ] Video checked in (or linked)
- [ ] Smoke-test checklist in root README
- [ ] Tagged release `v0.1-sprint1` in git

---

## Sprint 2 — Slop Pipeline + Auth (Weeks 3–4)

**Goal:** A logged-in user browses 10+ real LLM-generated problems, fixes one, sees a differential-test verdict plus an LLM feedback card. Submissions stored with user id.

**Sprint 2 parallelism:** 4 parallel workstreams — Auth (DD-013–015), AI pipeline (DD-016–020), Backend upgrade (DD-021–022), Frontend UX (DD-023–026). Content seeding (DD-027) is the final gate.

---

### DD-013: Supabase GitHub OAuth setup
**Sprint:** 2   **Points:** M   **Depends on:** DD-007   **Area:** AUTH   **Assigned to:** Rayan
**Description:** Create a GitHub OAuth app (homepage: `http://localhost:3000`, callback: Supabase's hosted `/auth/v1/callback`), enable GitHub provider in Supabase dashboard. Add `profiles` trigger that inserts a row on new user signup copying `user_metadata.user_name` → `github_username`.
**Acceptance criteria:**
- [ ] "Sign in with GitHub" works from the local app at `http://localhost:3000`
- [ ] On first signup, a row appears in `profiles` with github_username and avatar_url
- [ ] Supabase "Site URL" set to `http://localhost:3000`; additional redirect URLs include any teammates' local-dev ports if they differ

---

### DD-014: Next.js auth middleware + Supabase SSR
**Sprint:** 2   **Points:** M   **Depends on:** DD-013   **Area:** FE   **Assigned to:** Matt
**Description:** Install `@supabase/ssr`. Add `middleware.ts` that refreshes the session cookie on every request. Add `/login` page with GitHub button and `/account` protected page showing username.
**Acceptance criteria:**
- [ ] `/login` → clicking GitHub redirects and returns authenticated
- [ ] `/account` returns 302 to `/login` when logged out
- [ ] `createServerClient` / `createBrowserClient` both work per Supabase SSR docs
**Notes:** Follow `/supabase/ssr` package README exactly. Common pitfall: forgetting to call `supabase.auth.getUser()` in middleware.

---

### DD-015: RLS policies for submissions
**Sprint:** 2   **Points:** M   **Depends on:** DD-013   **Area:** DB   **Assigned to:** Saurish
**Description:** Migration `0002_rls.sql`. Enable RLS on `submissions`. Policies: (a) authenticated user can INSERT with their own user_id, (b) authenticated user can SELECT rows where user_id = auth.uid(), (c) nobody can UPDATE or DELETE (backend uses `service_role` for write-after-judging).
**Acceptance criteria:**
- [ ] Integration test: user A cannot SELECT user B's submission (with anon key)
- [ ] Backend's service_role key bypasses RLS as expected
- [ ] RLS also enabled on `test_cases` (hidden cases: service_role only)

---

### DD-016: Gemini client wrapper
**Sprint:** 2   **Points:** S   **Depends on:** DD-005   **Area:** AI   **Assigned to:** Rayan
**Description:** Install `google-genai` SDK. Wrap in `backend/llm/gemini.py` with `async def chat(prompt: str, system: str | None = None) -> str`. Reads `GEMINI_API_KEY` from env. Uses model `gemini-2.5-flash`.
**Acceptance criteria:**
- [ ] Returns string response
- [ ] Handles 429 with exponential backoff (3 retries)
- [ ] Unit test with mocked SDK
**Notes:** Get key at aistudio.google.com. Free tier: 1500 req/day, no credit card.

---

### DD-017: Slop-generation prompt + CLI
**Sprint:** 2   **Points:** M   **Depends on:** DD-016   **Area:** AI   **Assigned to:** Rayan
**Description:** Prompt template (`backend/prompts/slop_gen.txt`) that takes a correct reference solution + bug category and returns a modified function with exactly that bug. CLI: `python -m backend.cli.slopify --reference file.py --category off_by_one`.
**Acceptance criteria:**
- [ ] Prompt produces a valid Python function (syntactically parseable)
- [ ] Tested against all 6 bug categories on a seed `two_sum.py` reference
- [ ] Output is the function only, no markdown fences
- [ ] CLI prints slop to stdout or writes to `--out file.py`

---

### DD-018: Test case generator prompt + CLI
**Sprint:** 2   **Points:** M   **Depends on:** DD-016   **Area:** AI   **Assigned to:** Rayan
**Description:** Prompt template that generates 8 test case inputs given a function signature + description. CLI: `python -m backend.cli.gen_tests --signature "def two_sum(nums, target):" --description "..."`.
**Acceptance criteria:**
- [ ] Returns 8 newline-delimited stdin strings
- [ ] Includes edge cases: empty/single-element, duplicates, negatives, large
- [ ] Each case tested runnable through the reference solution without raising

---

### DD-019: Problem seeder CLI
**Sprint:** 2   **Points:** M   **Depends on:** DD-017, DD-018   **Area:** AI   **Assigned to:** Arti
**Description:** End-to-end CLI: `python -m backend.cli.seed_problem --spec spec.yaml`. Spec contains title, description, difficulty, reference_solution, target_complexity, desired bug categories. Runs slop gen → test gen → oracle verify (reference runs clean) → slop verify (fails at least one case) → insert into Supabase as `status='draft'`.
**Acceptance criteria:**
- [ ] End-to-end works on two_sum spec
- [ ] Rejects problem if slop passes all test cases (prints reason)
- [ ] Rejects problem if reference raises on any test case
- [ ] Inserts one `problems` row + N `test_cases` rows
**Notes:** Must be idempotent — re-running with the same spec updates the existing draft row.

---

### DD-020: LLM feedback card generator
**Sprint:** 2   **Points:** M   **Depends on:** DD-016   **Area:** AI   **Assigned to:** Rayan
**Description:** `async def generate_feedback(problem, verdict, bug_category, cases_passed, cases_total) -> str`. Returns 2-3 sentence markdown explaining the bug and why the fix works. **Does not take user code as input** (prompt injection guard).
**Acceptance criteria:**
- [ ] Returns markdown, not JSON
- [ ] Mentions the bug category by name
- [ ] Returns `""` on Gemini quota exhaustion (non-blocking)
- [ ] Unit test with mocked LLM response

---

### DD-021: Differential testing harness
**Sprint:** 2   **Points:** L   **Depends on:** DD-006   **Area:** BE   **Assigned to:** Arti
**Description:** `async def run_differential(user_code, reference_code, test_cases) -> DifferentialResult`. For each test case: submit both to Judge0 in parallel, compare stdouts (whitespace-normalized, trailing newline ignored). Returns list of (case_idx, passed, user_stdout, ref_stdout).
**Acceptance criteria:**
- [ ] Parallel execution via `asyncio.gather` across cases
- [ ] Whitespace normalization in comparison (strip trailing, normalize `\r\n` → `\n`)
- [ ] Handles Judge0 compile errors / timeouts gracefully
- [ ] Unit test with mocked Judge0 adapter

---

### DD-022: Async submission endpoint v2
**Sprint:** 2   **Points:** L   **Depends on:** DD-015, DD-021   **Area:** BE   **Assigned to:** Arti
**Description:** Upgrade `POST /api/v1/submissions`: (1) verifies Supabase JWT, (2) inserts `submissions` row with `verdict='pending'`, (3) kicks off background task for differential testing + feedback card, (4) returns submission id immediately. New `GET /api/v1/submissions/{id}` returns current state.
**Acceptance criteria:**
- [ ] `POST` returns 202 + `{id}` in < 200ms
- [ ] Background task updates the row with verdict when done
- [ ] `GET` returns 404 for other users' submissions (RLS enforced)
- [ ] Feedback card is a separate column, written when ready (may lag verdict)
**Notes:** Use FastAPI `BackgroundTasks`. For production we'd want a real queue, but BackgroundTasks is fine at class-project scale.

---

### DD-023: Next.js API proxy + typed client
**Sprint:** 2   **Points:** M   **Depends on:** DD-022   **Area:** FE   **Assigned to:** Arti
**Description:** Create `/api/submissions` Next.js route handlers that proxy to FastAPI, adding the Supabase JWT. Generate a typed client from FastAPI's OpenAPI schema using `openapi-typescript`.
**Acceptance criteria:**
- [ ] No direct browser → FastAPI calls (all through Next.js API routes)
- [ ] JWT attached as `Authorization: Bearer` from server-side session
- [ ] Types for request/response bodies in `frontend/lib/api.ts`

---

### DD-024: Problem browser page
**Sprint:** 2   **Points:** M   **Depends on:** DD-014   **Area:** FE   **Assigned to:** Matt
**Description:** Route `/problems`. Lists all published problems with columns: title, difficulty, bug_category. Basic filter controls: difficulty chips (easy/medium/hard) and bug_category chips. Click row → `/problems/[id]`.
**Acceptance criteria:**
- [ ] SSR-renders the list (server component + Supabase server client)
- [ ] Filters update URL query params (e.g. `?difficulty=easy`)
- [ ] Empty state if filters match no problems
- [ ] Works logged out (just read access to published problems)

---

### DD-025: Feedback card UI component
**Sprint:** 2   **Points:** S   **Depends on:** DD-020, DD-022   **Area:** FE   **Assigned to:** Arti
**Description:** After submission verdict returns, render the feedback card below the verdict banner. Skeleton loader while `feedback_card` is still `null` in the polled response.
**Acceptance criteria:**
- [ ] Shown only on `verdict === 'pass'` or after clicking "See explanation" on failure
- [ ] Renders markdown (use `react-markdown`)
- [ ] Skeleton loader while pending

---

### DD-026: Submission history page
**Sprint:** 2   **Points:** M   **Depends on:** DD-015   **Area:** FE   **Assigned to:** Matt
**Description:** Route `/submissions`. Shows the logged-in user's submissions, newest first, with columns: problem title (link), verdict, cases passed, timestamp. Click a row → `/submissions/[id]` showing the submitted code + feedback.
**Acceptance criteria:**
- [ ] Protected route (redirects if logged out)
- [ ] RLS prevents seeing other users' data (tested manually)
- [ ] Pagination or infinite scroll if > 20 submissions (for MVP, show latest 50, no pagination)

---

### DD-027: Seed 10 reviewed problems
**Sprint:** 2   **Points:** L   **Depends on:** DD-019   **Area:** CONTENT   **Assigned to:** Saurish
**Description:** Write 10 problem specs (spec.yaml files). Run the seeder on each. Two team members cross-review each one, mark `status='published'`. Target: 3 easy / 5 medium / 2 hard, covering 4+ of the 6 bug categories.
**Acceptance criteria:**
- [ ] 10 published problems in Supabase
- [ ] Each specs checked into `backend/seeds/problems/*.yaml`
- [ ] Review checklist (bug real? category correct? tests cover edges? no copyright?) filled in PR description
**Notes:** Suggested problems: two_sum, reverse_string, fizzbuzz, is_palindrome, max_subarray, binary_search, fibonacci_memo, merge_sorted_arrays, count_primes, rotate_array.

---

## Sprint 3 — Judge + Polish + Demo (Weeks 5–6)

**Goal:** Complexity analysis wired into the verdict, leaderboard live, 15 problems published, UX polish, demo recorded.

---

### DD-028: AST complexity analyzer
**Sprint:** 3   **Points:** L   **Depends on:** DD-022   **Area:** AI   **Assigned to:** Arti
**Description:** `def analyze_complexity(python_code: str) -> ComplexityTier`. Walks AST with a custom `ast.NodeVisitor`. Detects: nested loops (O(n²)+), sort inside loop, linear `in` on list inside loop, recomputed expressions. Returns one of: `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(n³+)`, `unknown`.
**Acceptance criteria:**
- [ ] Correctly classifies 10 hand-crafted test fixtures (one per tier + edge cases)
- [ ] Returns `unknown` rather than misclassifying when confused
- [ ] Unit tests in `backend/tests/test_complexity.py`
**Notes:** Use Python's `ast` module, not `asttokens`. No external deps.

---

### DD-029: Verdict logic v2 (pass/partial/fail)
**Sprint:** 3   **Points:** M   **Depends on:** DD-028   **Area:** BE   **Assigned to:** Arti
**Description:** Update submission processor: after differential test, run AST analyzer on user code. Compute verdict:
- `fail` — any test case incorrect OR runtime error
- `partial` — all cases correct but detected complexity > target
- `pass` — all cases correct and complexity ≤ target
**Acceptance criteria:**
- [ ] Verdict persisted in `submissions.verdict`
- [ ] `complexity_detected` persisted
- [ ] Unit tests cover all three verdicts
- [ ] Integration test on the Two Sum problem: nested-loop solution = `partial`, hashmap solution = `pass`

---

### DD-030: Verdict UI with complexity breakdown
**Sprint:** 3   **Points:** M   **Depends on:** DD-029   **Area:** FE   **Assigned to:** Matt
**Description:** Update submission result page to show: overall verdict badge (green/yellow/red), cases passed (`N/M`), detected complexity vs. target complexity, feedback card below.
**Acceptance criteria:**
- [ ] Three distinct visuals for pass/partial/fail
- [ ] Complexity shown only on success (partial/pass)
- [ ] Screen-reader-friendly labels (not color only)

---

### DD-031: Leaderboard RPC + query
**Sprint:** 3   **Points:** M   **Depends on:** DD-022   **Area:** DB   **Assigned to:** Saurish
**Description:** Postgres `SECURITY DEFINER` function `leaderboard_top(limit int)` that returns `(github_username, avatar_url, problems_solved)` sorted desc. Counts distinct `problem_id` where any submission has `verdict='pass'`. Public-readable.
**Acceptance criteria:**
- [ ] Function returns top N users
- [ ] Callable by anon users (no auth required)
- [ ] Indexed query — `EXPLAIN` shows index scan not seq scan
- [ ] Migration file `0003_leaderboard.sql`

---

### DD-032: Leaderboard page
**Sprint:** 3   **Points:** S   **Depends on:** DD-031   **Area:** FE   **Assigned to:** Matt
**Description:** Route `/leaderboard`. Renders top 50 users, their avatar, username, and problems-solved count. Highlights the currently-logged-in user's row if present.
**Acceptance criteria:**
- [ ] SSR-rendered (server component)
- [ ] Links each username to their GitHub
- [ ] Empty state if nobody has solved anything yet

---

### DD-033: Problem filters (advanced)
**Sprint:** 3   **Points:** S   **Depends on:** DD-024   **Area:** FE   **Assigned to:** Matt
**Description:** Enhance problem browser with a combined filter bar: difficulty multi-select + bug_category multi-select + text search on title. Filter state synced to URL.
**Acceptance criteria:**
- [ ] Multi-select chips (not dropdowns) for both
- [ ] URL is shareable and reproduces the filter state
- [ ] "Clear filters" button

---

### DD-034: UX polish pass
**Sprint:** 3   **Points:** M   **Depends on:** DD-030   **Area:** FE   **Assigned to:** Matt
**Description:** One-day focused polish. Consistent spacing, dark-mode (follow system preference), loading states on every async action, error toasts for network failures, keyboard shortcut `Cmd+Enter` to submit from the editor.
**Acceptance criteria:**
- [ ] Dark-mode works on all pages
- [ ] All submit/fetch buttons show a spinner while pending
- [ ] Network failures show a toast, not a console error
- [ ] `Cmd+Enter` / `Ctrl+Enter` in Monaco triggers submit

---

### DD-035: Seed final 5 problems (total 15)
**Sprint:** 3   **Points:** M   **Depends on:** DD-027   **Area:** CONTENT   **Assigned to:** Saurish
**Description:** Add 5 more problems via the seeder CLI. Focus coverage of any bug categories missed in sprint 2. Target final mix: 5 easy / 7 medium / 3 hard.
**Acceptance criteria:**
- [ ] All 6 bug categories represented across the full 15-problem set
- [ ] 15 published problems in the shared Supabase project
- [ ] Specs committed to `backend/seeds/problems/`

---

### DD-036: README, demo script, and recorded demo
**Sprint:** 3   **Points:** M   **Depends on:** DD-034, DD-035   **Area:** DOC   **Assigned to:** Matt
**Description:** Rewrite root README with: what it is, live URL, architecture diagram, local-dev setup (frontend + backend), deploy instructions. Write a 2-minute demo script (narrated screen capture). Record it.
**Acceptance criteria:**
- [ ] README has a GIF or image at the top
- [ ] Demo script file `docs/demo_script.md` exists
- [ ] Demo video checked into `docs/demos/final.mp4` (or linked to YouTube unlisted)
- [ ] `v1.0-final` tag in git

---

### DD-037: Demo readiness checklist
**Sprint:** 3   **Points:** S   **Depends on:** DD-034   **Area:** INFRA   **Assigned to:** Saurish
**Description:** Before final demo, verify: fresh clone runs end-to-end via `make install && make dev`; no console errors in the browser or FastAPI; no secrets in git history (run `trufflehog` or `gitleaks`); every teammate has rehearsed the demo path on their own laptop at least once.
**Acceptance criteria:**
- [ ] Secret scanner run, clean
- [ ] Fresh clone on a clean laptop reaches verdict for the Two Sum problem in under 5 minutes of setup
- [ ] CORS on FastAPI allows only `http://localhost:3000`
- [ ] Two teammates have done a dry run demo on their own machines

---

## Stretch Tickets (any sprint, if time allows)

### DD-S2: Empirical complexity profiling
**Sprint:** 3 stretch   **Points:** L   **Depends on:** DD-029   **Area:** AI   **Assigned to:** Arti
**Description:** For each submission, run user code at `n = [100, 1000, 10000]` (3 runs each, median), fit a curve with `big_O` library, compare against AST-detected tier. Persist empirical tier alongside `complexity_detected`.
**Acceptance criteria:**
- [ ] Runs in < 5s total per submission
- [ ] Agrees with AST on 8/10 fixtures
- [ ] Flags disagreement as `complexity_confidence='low'`

---

### DD-S3: Error monitoring (Sentry free tier)
**Sprint:** 3 stretch   **Points:** S   **Depends on:** DD-011   **Area:** INFRA   **Assigned to:** Saurish
**Description:** Sign up for Sentry free. Install `@sentry/nextjs` and `sentry-sdk[fastapi]`. Wire source maps for Next.js. Set up a dead-letter channel in Discord / Slack for alerts.
**Acceptance criteria:**
- [ ] Uncaught frontend error shows up in Sentry
- [ ] FastAPI 500 shows up in Sentry with stack trace
- [ ] PII scrubbing enabled (no user code in error bodies)

---

## Appendix — Parallelism cheat sheet

**Week 1 assignments (example):**
- Dev A: DD-001 → DD-003 → DD-004
- Dev B: DD-001 → DD-005 → DD-006
- Dev C: DD-001 → DD-007 → DD-008
- Dev D: DD-002 then floater — help unblock whichever track is slowest

**Week 2 assignments (example):**
- Dev A: DD-010
- Dev B: DD-009
- Dev C: DD-011
- Dev D: DD-012 + floats to help

**Same pattern in sprints 2 and 3:** one auth track, one AI track, one backend track, one frontend track. Pair on cross-track PRs (frontend dev reviews backend endpoint PRs and vice versa).
