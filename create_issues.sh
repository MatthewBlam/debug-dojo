#!/usr/bin/env bash
set -euo pipefail

REPO="MatthewBlam/debug-dojo"

echo "==> Creating labels..."

create_label() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" 2>/dev/null || \
  gh label edit "$1" --repo "$REPO" --color "$2" --description "$3" 2>/dev/null || true
}

# Category labels
create_label "FE"      "0075ca" "Frontend"
create_label "BE"      "e4e669" "Backend"
create_label "INFRA"   "d93f0b" "Infrastructure / CI / Deploy"
create_label "AI"      "7057ff" "LLM / Analysis"
create_label "DB"      "006b75" "Database / SQL"
create_label "AUTH"    "e11d48" "Authentication"
create_label "CONTENT" "f9d0c4" "Problem seeding / content"
create_label "DOC"     "cfd3d7" "Documentation"

# Size labels
create_label "size:S"  "c2e0c6" "~half day"
create_label "size:M"  "fef2c0" "~1-2 days"
create_label "size:L"  "f9d0c4" "~3-4 days"

echo "==> Creating milestones..."

create_milestone() {
  gh api repos/"$REPO"/milestones \
    --method POST \
    --field title="$1" \
    --field description="$2" \
    --silent 2>/dev/null || true
}

create_milestone "Sprint 1 — Walking Skeleton" "Local app where visitors pick a hardcoded problem, edit Python, submit, and get a pass/fail verdict from a self-hosted Judge0."
create_milestone "Sprint 2 — Slop Pipeline + Auth" "Logged-in users browse 10+ LLM-generated problems, fix one, see differential-test verdict + LLM feedback card."
create_milestone "Sprint 3 — Judge + Polish + Demo" "Complexity analysis integrated, leaderboard live, 15 problems published, production polish, demo recorded."
create_milestone "Stretch" "Post-MVP tickets if time allows."

echo "==> Creating issues..."

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local milestone="$4"
  local assignee="$5"

  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    --milestone "$milestone" \
    --assignee "$assignee"
}

# ─── Sprint 1 ─────────────────────────────────────────────────────────────────

create_issue \
  "[DD-001] Monorepo scaffold & conventions" \
  "**Depends on:** —

Initialize \`frontend/\` (Next.js) and \`backend/\` (FastAPI) in the existing git repo. Add root-level \`README.md\`, \`.editorconfig\`, \`.gitignore\`, and \`.nvmrc\` / \`.python-version\`.

**Acceptance criteria:**
- [ ] \`frontend/\` and \`backend/\` directories created with placeholder READMEs
- [ ] Root README links to both and documents how to run each locally
- [ ] \`.gitignore\` excludes \`node_modules/\`, \`.venv/\`, \`.env*\`, \`.next/\`, \`__pycache__/\`
- [ ] PR merged to \`main\`" \
  "INFRA,size:S" \
  "Sprint 1 — Walking Skeleton" \
  "SaurSum8"

create_issue \
  "[DD-002] GitHub Actions CI" \
  "**Depends on:** DD-001

Two workflows — \`frontend.yml\` runs \`pnpm lint && pnpm typecheck\` on PRs touching \`frontend/**\`; \`backend.yml\` runs \`ruff check && mypy\` on PRs touching \`backend/**\`.

**Acceptance criteria:**
- [ ] Failing lint blocks PR merge
- [ ] Workflows only trigger on the matching paths (use \`paths:\` filter)
- [ ] Green check on a test PR" \
  "INFRA,size:S" \
  "Sprint 1 — Walking Skeleton" \
  "SaurSum8"

create_issue \
  "[DD-003] Next.js 16 scaffold + Tailwind + shadcn/ui" \
  "**Depends on:** DD-001

\`create-next-app\` with TypeScript, App Router, Tailwind. Install \`shadcn/ui\` CLI and initialize. Remove boilerplate; add a simple \`/\` landing route.

**Acceptance criteria:**
- [ ] Next.js 16, App Router, TypeScript strict mode enabled
- [ ] Tailwind working; shadcn \`Button\` component renders on \`/\`
- [ ] \`pnpm dev\` runs without warnings

**Notes:** Pin Next.js to 16.x latest stable. Do NOT enable experimental features." \
  "FE,size:M" \
  "Sprint 1 — Walking Skeleton" \
  "MatthewBlam"

create_issue \
  "[DD-004] Monaco editor integration" \
  "**Depends on:** DD-003

Install \`@monaco-editor/react\` and \`monaco-editor\`. Create \`<CodeEditor />\` component that loads Monaco via \`next/dynamic\` with \`ssr: false\`. Default language Python, dark theme.

**Acceptance criteria:**
- [ ] Editor renders on a test page \`/editor-test\`
- [ ] Python syntax highlighting works
- [ ] \`onChange\` prop receives updated code string
- [ ] No hydration warnings in console

**Notes:** \`import dynamic from 'next/dynamic'; const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });\`" \
  "FE,size:M" \
  "Sprint 1 — Walking Skeleton" \
  "MatthewBlam"

create_issue \
  "[DD-005] FastAPI backend scaffold" \
  "**Depends on:** DD-001

Initialize FastAPI app in \`backend/\`. Add \`GET /health\` returning \`{\"status\": \"ok\"}\`. Add \`poetry\` or \`uv\` for dependency management. Set up \`ruff\` + \`mypy\` configs.

**Acceptance criteria:**
- [ ] \`uvicorn main:app --reload\` runs locally
- [ ] \`GET /health\` returns 200 with JSON body
- [ ] \`ruff check\` and \`mypy\` pass on the scaffold

**Notes:** Python 3.12. Prefer \`uv\` over \`poetry\` for faster installs." \
  "BE,size:S" \
  "Sprint 1 — Walking Skeleton" \
  "artiomcovali"

create_issue \
  "[DD-006] Self-hosted Judge0 (Docker) + Python adapter" \
  "**Depends on:** DD-005

Add a \`docker-compose.yml\` at the repo root that runs Judge0 CE locally (Judge0 server + worker + Postgres + Redis, all from the official images). Bind to \`127.0.0.1\` only. Then write a thin Python wrapper in \`backend/judge0/client.py\` with \`async def run_python(code: str, stdin: str) -> RunResult\` that POSTs to the local Judge0, polls for completion, and returns stdout/stderr/status.

**Acceptance criteria:**
- [ ] \`docker compose up judge0\` starts Judge0 and \`curl http://127.0.0.1:2358/about\` returns a JSON response
- [ ] Judge0 services bind to \`127.0.0.1\` only (not \`0.0.0.0\`)
- [ ] \`run_python\` returns \`RunResult(stdout, stderr, status, time_ms)\`
- [ ] Unit test with a mocked \`httpx\` client
- [ ] \`JUDGE0_URL\` (default \`http://127.0.0.1:2358\`) loaded from \`.env\`; no API key required

**Notes:** Judge0 language_id for Python 3: 71. Use the \`judge0/judge0:1.13.1\` image series (pin the exact tag in compose). Set \`ENABLE_NETWORK=false\` and standard resource limits in the Judge0 config. See https://github.com/judge0/judge0 for INSTALL.md." \
  "BE,size:M" \
  "Sprint 1 — Walking Skeleton" \
  "artiomcovali"

create_issue \
  "[DD-007] Supabase project + schema v1" \
  "**Depends on:** DD-001

Create Supabase project (free tier). Write initial SQL migration for \`problems\`, \`test_cases\`, \`submissions\`, \`profiles\` tables per PRD §8. Commit migration to \`backend/migrations/0001_init.sql\`.

**Acceptance criteria:**
- [ ] Migration applied to Supabase via \`supabase db push\`
- [ ] Enums for \`difficulty\`, \`bug_category\`, \`verdict\`, \`status\` created
- [ ] Foreign keys + indexes on \`submissions.user_id\`, \`submissions.problem_id\`
- [ ] Migration file committed to git

**Notes:** Use Supabase CLI — \`npx supabase init && npx supabase link --project-ref ...\`. Keep a single \`anon\` key and \`service_role\` key in team 1Password." \
  "DB,size:M" \
  "Sprint 1 — Walking Skeleton" \
  "rayanezaz"

create_issue \
  "[DD-008] Seed one hardcoded problem" \
  "**Depends on:** DD-007

Manually author one problem (Two Sum with a nested-loop slop variant). Write a SQL insert script in \`backend/seeds/0001_two_sum.sql\` that inserts the \`problems\` row + 3 \`test_cases\` rows.

**Acceptance criteria:**
- [ ] Problem statement describes Two Sum
- [ ] \`slop_code\` has a nested-loop O(n²) implementation
- [ ] \`reference_solution\` has an O(n) hashmap implementation
- [ ] 3 test cases including an edge case (empty-ish, duplicates)
- [ ] \`status='published'\`

**Notes:** This is the ONLY problem in sprint 1. Real content starts sprint 2." \
  "CONTENT,size:S" \
  "Sprint 1 — Walking Skeleton" \
  "rayanezaz"

create_issue \
  "[DD-009] Submission endpoint (sync v1)" \
  "**Depends on:** DD-006, DD-007, DD-008

\`POST /api/v1/submissions\` with body \`{problem_id, code}\`. Synchronously runs user code against the first test case via Judge0, returns \`{verdict: \"pass\" | \"fail\", stdout}\`. No auth yet. No differential testing yet.

**Acceptance criteria:**
- [ ] Endpoint responds in < 10s for the Two Sum problem
- [ ] Returns 400 on invalid problem_id
- [ ] Returns 502 on Judge0 failure (not 500)
- [ ] Integration test runs against a real Judge0 call (can be skipped in CI with env flag)

**Notes:** Sync is fine for sprint 1 because we have one test case. Sprint 2 upgrades to async + multi-case." \
  "BE,size:M" \
  "Sprint 1 — Walking Skeleton" \
  "artiomcovali"

create_issue \
  "[DD-010] Problem page with editor + submit" \
  "**Depends on:** DD-004, DD-009

Route \`/problems/[id]\` — fetches problem from Supabase (client-side is fine for sprint 1), shows description on left, Monaco editor pre-loaded with \`slop_code\` on right, Submit button calls FastAPI and shows result banner.

**Acceptance criteria:**
- [ ] Problem description renders markdown
- [ ] Monaco loads slop_code as initial value
- [ ] Submit button disabled while request in flight
- [ ] Green \"Passed\" or red \"Failed\" banner after response
- [ ] Works for the Two Sum seeded problem

**Notes:** Use Supabase anon key for read. Fine to call FastAPI directly from the browser in sprint 1; we'll add a Next.js API proxy in sprint 2." \
  "FE,size:M" \
  "Sprint 1 — Walking Skeleton" \
  "MatthewBlam"

create_issue \
  "[DD-011] One-command local dev setup" \
  "**Depends on:** DD-010

Make the full stack runnable from a clean clone with minimal ceremony. Create a root \`docker-compose.yml\` (extends DD-006's Judge0 compose) and a \`Makefile\` (or \`justfile\`) with targets: \`make install\`, \`make dev\` (starts Judge0 + FastAPI + Next.js), \`make stop\`. Wire env vars via \`.env.example\` files for both \`frontend/\` and \`backend/\`.

**Acceptance criteria:**
- [ ] Fresh clone → \`make install && make dev\` → app reachable at \`http://localhost:3000\`
- [ ] \`.env.example\` in both \`frontend/\` and \`backend/\` lists every required var (Supabase URL, anon key, service role, Gemini key, \`JUDGE0_URL\`)
- [ ] Frontend reads \`NEXT_PUBLIC_API_URL\` (default \`http://localhost:8000\`)
- [ ] README documents the setup in < 10 lines

**Notes:** No paid hosting. Class demo runs on a laptop. If someone wants a public URL later, Vercel hobby (free) for FE + Fly.io / Render free for BE are both options — not required for MVP." \
  "INFRA,size:M" \
  "Sprint 1 — Walking Skeleton" \
  "SaurSum8"

create_issue \
  "[DD-012] End-to-end smoke test & sprint 1 demo" \
  "**Depends on:** DD-011

Record a 30-second screen capture on a local run: open \`http://localhost:3000\` → click problem → edit slop → submit → pass. Check into \`docs/demos/sprint1.mp4\`. Write 5-line smoke-test checklist in README.

**Acceptance criteria:**
- [ ] Video checked in (or linked)
- [ ] Smoke-test checklist in root README
- [ ] Tagged release \`v0.1-sprint1\` in git" \
  "INFRA,size:S" \
  "Sprint 1 — Walking Skeleton" \
  "SaurSum8"

# ─── Sprint 2 ─────────────────────────────────────────────────────────────────

create_issue \
  "[DD-013] Supabase GitHub OAuth setup" \
  "**Depends on:** DD-007

Create a GitHub OAuth app (homepage: \`http://localhost:3000\`, callback: Supabase's hosted \`/auth/v1/callback\`), enable GitHub provider in Supabase dashboard. Add \`profiles\` trigger that inserts a row on new user signup copying \`user_metadata.user_name\` → \`github_username\`.

**Acceptance criteria:**
- [ ] \"Sign in with GitHub\" works from the local app at \`http://localhost:3000\`
- [ ] On first signup, a row appears in \`profiles\` with github_username and avatar_url
- [ ] Supabase \"Site URL\" set to \`http://localhost:3000\`; additional redirect URLs include any teammates' local-dev ports if they differ" \
  "AUTH,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "rayanezaz"

create_issue \
  "[DD-014] Next.js auth middleware + Supabase SSR" \
  "**Depends on:** DD-013

Install \`@supabase/ssr\`. Add \`middleware.ts\` that refreshes the session cookie on every request. Add \`/login\` page with GitHub button and \`/account\` protected page showing username.

**Acceptance criteria:**
- [ ] \`/login\` → clicking GitHub redirects and returns authenticated
- [ ] \`/account\` returns 302 to \`/login\` when logged out
- [ ] \`createServerClient\` / \`createBrowserClient\` both work per Supabase SSR docs

**Notes:** Follow \`/supabase/ssr\` package README exactly. Common pitfall: forgetting to call \`supabase.auth.getUser()\` in middleware." \
  "FE,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "MatthewBlam"

create_issue \
  "[DD-015] RLS policies for submissions" \
  "**Depends on:** DD-013

Migration \`0002_rls.sql\`. Enable RLS on \`submissions\`. Policies: (a) authenticated user can INSERT with their own user_id, (b) authenticated user can SELECT rows where user_id = auth.uid(), (c) nobody can UPDATE or DELETE (backend uses \`service_role\` for write-after-judging).

**Acceptance criteria:**
- [ ] Integration test: user A cannot SELECT user B's submission (with anon key)
- [ ] Backend's service_role key bypasses RLS as expected
- [ ] RLS also enabled on \`test_cases\` (hidden cases: service_role only)" \
  "DB,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "SaurSum8"

create_issue \
  "[DD-016] Gemini client wrapper" \
  "**Depends on:** DD-005

Install \`google-genai\` SDK. Wrap in \`backend/llm/gemini.py\` with \`async def chat(prompt: str, system: str | None = None) -> str\`. Reads \`GEMINI_API_KEY\` from env. Uses model \`gemini-2.5-flash\`.

**Acceptance criteria:**
- [ ] Returns string response
- [ ] Handles 429 with exponential backoff (3 retries)
- [ ] Unit test with mocked SDK

**Notes:** Get key at aistudio.google.com. Free tier: 1500 req/day, no credit card." \
  "AI,size:S" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "rayanezaz"

create_issue \
  "[DD-017] Slop-generation prompt + CLI" \
  "**Depends on:** DD-016

Prompt template (\`backend/prompts/slop_gen.txt\`) that takes a correct reference solution + bug category and returns a modified function with exactly that bug. CLI: \`python -m backend.cli.slopify --reference file.py --category off_by_one\`.

**Acceptance criteria:**
- [ ] Prompt produces a valid Python function (syntactically parseable)
- [ ] Tested against all 6 bug categories on a seed \`two_sum.py\` reference
- [ ] Output is the function only, no markdown fences
- [ ] CLI prints slop to stdout or writes to \`--out file.py\`" \
  "AI,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "rayanezaz"

create_issue \
  "[DD-018] Test case generator prompt + CLI" \
  "**Depends on:** DD-016

Prompt template that generates 8 test case inputs given a function signature + description. CLI: \`python -m backend.cli.gen_tests --signature \"def two_sum(nums, target):\" --description \"...\"\`.

**Acceptance criteria:**
- [ ] Returns 8 newline-delimited stdin strings
- [ ] Includes edge cases: empty/single-element, duplicates, negatives, large
- [ ] Each case tested runnable through the reference solution without raising" \
  "AI,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "rayanezaz"

create_issue \
  "[DD-019] Problem seeder CLI" \
  "**Depends on:** DD-017, DD-018

End-to-end CLI: \`python -m backend.cli.seed_problem --spec spec.yaml\`. Spec contains title, description, difficulty, reference_solution, target_complexity, desired bug categories. Runs slop gen → test gen → oracle verify → slop verify → insert into Supabase as \`status='draft'\`.

**Acceptance criteria:**
- [ ] End-to-end works on two_sum spec
- [ ] Rejects problem if slop passes all test cases (prints reason)
- [ ] Rejects problem if reference raises on any test case
- [ ] Inserts one \`problems\` row + N \`test_cases\` rows

**Notes:** Must be idempotent — re-running with the same spec updates the existing draft row." \
  "AI,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "artiomcovali"

create_issue \
  "[DD-020] LLM feedback card generator" \
  "**Depends on:** DD-016

\`async def generate_feedback(problem, verdict, bug_category, cases_passed, cases_total) -> str\`. Returns 2-3 sentence markdown explaining the bug and why the fix works. Does not take user code as input (prompt injection guard).

**Acceptance criteria:**
- [ ] Returns markdown, not JSON
- [ ] Mentions the bug category by name
- [ ] Returns \`\"\"\` on Gemini quota exhaustion (non-blocking)
- [ ] Unit test with mocked LLM response" \
  "AI,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "rayanezaz"

create_issue \
  "[DD-021] Differential testing harness" \
  "**Depends on:** DD-006

\`async def run_differential(user_code, reference_code, test_cases) -> DifferentialResult\`. For each test case: submit both to Judge0 in parallel, compare stdouts (whitespace-normalized, trailing newline ignored). Returns list of (case_idx, passed, user_stdout, ref_stdout).

**Acceptance criteria:**
- [ ] Parallel execution via \`asyncio.gather\` across cases
- [ ] Whitespace normalization in comparison (strip trailing, normalize \`\\r\\n\` → \`\\n\`)
- [ ] Handles Judge0 compile errors / timeouts gracefully
- [ ] Unit test with mocked Judge0 adapter" \
  "BE,size:L" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "artiomcovali"

create_issue \
  "[DD-022] Async submission endpoint v2" \
  "**Depends on:** DD-015, DD-021

Upgrade \`POST /api/v1/submissions\`: (1) verifies Supabase JWT, (2) inserts \`submissions\` row with \`verdict='pending'\`, (3) kicks off background task for differential testing + feedback card, (4) returns submission id immediately. New \`GET /api/v1/submissions/{id}\` returns current state.

**Acceptance criteria:**
- [ ] \`POST\` returns 202 + \`{id}\` in < 200ms
- [ ] Background task updates the row with verdict when done
- [ ] \`GET\` returns 404 for other users' submissions (RLS enforced)
- [ ] Feedback card is a separate column, written when ready (may lag verdict)

**Notes:** Use FastAPI \`BackgroundTasks\`." \
  "BE,size:L" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "artiomcovali"

create_issue \
  "[DD-023] Next.js API proxy + typed client" \
  "**Depends on:** DD-022

Create \`/api/submissions\` Next.js route handlers that proxy to FastAPI, adding the Supabase JWT. Generate a typed client from FastAPI's OpenAPI schema using \`openapi-typescript\`.

**Acceptance criteria:**
- [ ] No direct browser → FastAPI calls (all through Next.js API routes)
- [ ] JWT attached as \`Authorization: Bearer\` from server-side session
- [ ] Types for request/response bodies in \`frontend/lib/api.ts\`" \
  "FE,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "artiomcovali"

create_issue \
  "[DD-024] Problem browser page" \
  "**Depends on:** DD-014

Route \`/problems\`. Lists all published problems with columns: title, difficulty, bug_category. Basic filter controls: difficulty chips (easy/medium/hard) and bug_category chips. Click row → \`/problems/[id]\`.

**Acceptance criteria:**
- [ ] SSR-renders the list (server component + Supabase server client)
- [ ] Filters update URL query params (e.g. \`?difficulty=easy\`)
- [ ] Empty state if filters match no problems
- [ ] Works logged out (just read access to published problems)" \
  "FE,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "MatthewBlam"

create_issue \
  "[DD-025] Feedback card UI component" \
  "**Depends on:** DD-020, DD-022

After submission verdict returns, render the feedback card below the verdict banner. Skeleton loader while \`feedback_card\` is still \`null\` in the polled response.

**Acceptance criteria:**
- [ ] Shown only on \`verdict === 'pass'\` or after clicking \"See explanation\" on failure
- [ ] Renders markdown (use \`react-markdown\`)
- [ ] Skeleton loader while pending" \
  "FE,size:S" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "artiomcovali"

create_issue \
  "[DD-026] Submission history page" \
  "**Depends on:** DD-015

Route \`/submissions\`. Shows the logged-in user's submissions, newest first, with columns: problem title (link), verdict, cases passed, timestamp. Click a row → \`/submissions/[id]\` showing the submitted code + feedback.

**Acceptance criteria:**
- [ ] Protected route (redirects if logged out)
- [ ] RLS prevents seeing other users' data (tested manually)
- [ ] Pagination or infinite scroll if > 20 submissions (for MVP, show latest 50, no pagination)" \
  "FE,size:M" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "MatthewBlam"

create_issue \
  "[DD-027] Seed 10 reviewed problems" \
  "**Depends on:** DD-019

Write 10 problem specs (spec.yaml files). Run the seeder on each. Two team members cross-review each one, mark \`status='published'\`. Target: 3 easy / 5 medium / 2 hard, covering 4+ of the 6 bug categories.

**Acceptance criteria:**
- [ ] 10 published problems in Supabase
- [ ] Each specs checked into \`backend/seeds/problems/*.yaml\`
- [ ] Review checklist (bug real? category correct? tests cover edges? no copyright?) filled in PR description

**Notes:** Suggested problems: two_sum, reverse_string, fizzbuzz, is_palindrome, max_subarray, binary_search, fibonacci_memo, merge_sorted_arrays, count_primes, rotate_array." \
  "CONTENT,size:L" \
  "Sprint 2 — Slop Pipeline + Auth" \
  "SaurSum8"

# ─── Sprint 3 ─────────────────────────────────────────────────────────────────

create_issue \
  "[DD-028] AST complexity analyzer" \
  "**Depends on:** DD-022

\`def analyze_complexity(python_code: str) -> ComplexityTier\`. Walks AST with a custom \`ast.NodeVisitor\`. Detects: nested loops (O(n²)+), sort inside loop, linear \`in\` on list inside loop, recomputed expressions. Returns one of: \`O(1)\`, \`O(log n)\`, \`O(n)\`, \`O(n log n)\`, \`O(n²)\`, \`O(n³+)\`, \`unknown\`.

**Acceptance criteria:**
- [ ] Correctly classifies 10 hand-crafted test fixtures (one per tier + edge cases)
- [ ] Returns \`unknown\` rather than misclassifying when confused
- [ ] Unit tests in \`backend/tests/test_complexity.py\`

**Notes:** Use Python's \`ast\` module, not \`asttokens\`. No external deps." \
  "AI,size:L" \
  "Sprint 3 — Judge + Polish + Demo" \
  "artiomcovali"

create_issue \
  "[DD-029] Verdict logic v2 (pass/partial/fail)" \
  "**Depends on:** DD-028

Update submission processor: after differential test, run AST analyzer on user code. Compute verdict: \`fail\` — any test case incorrect OR runtime error; \`partial\` — all cases correct but detected complexity > target; \`pass\` — all cases correct and complexity ≤ target.

**Acceptance criteria:**
- [ ] Verdict persisted in \`submissions.verdict\`
- [ ] \`complexity_detected\` persisted
- [ ] Unit tests cover all three verdicts
- [ ] Integration test on Two Sum: nested-loop = \`partial\`, hashmap = \`pass\`" \
  "BE,size:M" \
  "Sprint 3 — Judge + Polish + Demo" \
  "artiomcovali"

create_issue \
  "[DD-030] Verdict UI with complexity breakdown" \
  "**Depends on:** DD-029

Update submission result page to show: overall verdict badge (green/yellow/red), cases passed (\`N/M\`), detected complexity vs. target complexity, feedback card below.

**Acceptance criteria:**
- [ ] Three distinct visuals for pass/partial/fail
- [ ] Complexity shown only on success (partial/pass)
- [ ] Screen-reader-friendly labels (not color only)" \
  "FE,size:M" \
  "Sprint 3 — Judge + Polish + Demo" \
  "MatthewBlam"

create_issue \
  "[DD-031] Leaderboard RPC + query" \
  "**Depends on:** DD-022

Postgres \`SECURITY DEFINER\` function \`leaderboard_top(limit int)\` that returns \`(github_username, avatar_url, problems_solved)\` sorted desc. Counts distinct \`problem_id\` where any submission has \`verdict='pass'\`. Public-readable.

**Acceptance criteria:**
- [ ] Function returns top N users
- [ ] Callable by anon users (no auth required)
- [ ] Indexed query — \`EXPLAIN\` shows index scan not seq scan
- [ ] Migration file \`0003_leaderboard.sql\`" \
  "DB,size:M" \
  "Sprint 3 — Judge + Polish + Demo" \
  "SaurSum8"

create_issue \
  "[DD-032] Leaderboard page" \
  "**Depends on:** DD-031

Route \`/leaderboard\`. Renders top 50 users, their avatar, username, and problems-solved count. Highlights the currently-logged-in user's row if present.

**Acceptance criteria:**
- [ ] SSR-rendered (server component)
- [ ] Links each username to their GitHub
- [ ] Empty state if nobody has solved anything yet" \
  "FE,size:S" \
  "Sprint 3 — Judge + Polish + Demo" \
  "MatthewBlam"

create_issue \
  "[DD-033] Problem filters (advanced)" \
  "**Depends on:** DD-024

Enhance problem browser with a combined filter bar: difficulty multi-select + bug_category multi-select + text search on title. Filter state synced to URL.

**Acceptance criteria:**
- [ ] Multi-select chips (not dropdowns) for both
- [ ] URL is shareable and reproduces the filter state
- [ ] \"Clear filters\" button" \
  "FE,size:S" \
  "Sprint 3 — Judge + Polish + Demo" \
  "MatthewBlam"

create_issue \
  "[DD-034] UX polish pass" \
  "**Depends on:** DD-030

One-day focused polish. Consistent spacing, dark-mode (follow system preference), loading states on every async action, error toasts for network failures, keyboard shortcut \`Cmd+Enter\` to submit from the editor.

**Acceptance criteria:**
- [ ] Dark-mode works on all pages
- [ ] All submit/fetch buttons show a spinner while pending
- [ ] Network failures show a toast, not a console error
- [ ] \`Cmd+Enter\` / \`Ctrl+Enter\` in Monaco triggers submit" \
  "FE,size:M" \
  "Sprint 3 — Judge + Polish + Demo" \
  "MatthewBlam"

create_issue \
  "[DD-035] Seed final 5 problems (total 15)" \
  "**Depends on:** DD-027

Add 5 more problems via the seeder CLI. Focus coverage of any bug categories missed in sprint 2. Target final mix: 5 easy / 7 medium / 3 hard.

**Acceptance criteria:**
- [ ] All 6 bug categories represented across the full 15-problem set
- [ ] 15 published problems in the shared Supabase project
- [ ] Specs committed to \`backend/seeds/problems/\`" \
  "CONTENT,size:M" \
  "Sprint 3 — Judge + Polish + Demo" \
  "SaurSum8"

create_issue \
  "[DD-036] README, demo script, and recorded demo" \
  "**Depends on:** DD-034, DD-035

Rewrite root README with: what it is, live URL, architecture diagram, local-dev setup (frontend + backend), deploy instructions. Write a 2-minute demo script (narrated screen capture). Record it.

**Acceptance criteria:**
- [ ] README has a GIF or image at the top
- [ ] Demo script file \`docs/demo_script.md\` exists
- [ ] Demo video checked into \`docs/demos/final.mp4\` (or linked to YouTube unlisted)
- [ ] \`v1.0-final\` tag in git" \
  "DOC,size:M" \
  "Sprint 3 — Judge + Polish + Demo" \
  "MatthewBlam"

create_issue \
  "[DD-037] Demo readiness checklist" \
  "**Depends on:** DD-034

Before final demo, verify: fresh clone runs end-to-end via \`make install && make dev\`; no console errors in the browser or FastAPI; no secrets in git history (run \`trufflehog\` or \`gitleaks\`); every teammate has rehearsed the demo path on their own laptop at least once.

**Acceptance criteria:**
- [ ] Secret scanner run, clean
- [ ] Fresh clone on a clean laptop reaches verdict for the Two Sum problem in under 5 minutes of setup
- [ ] CORS on FastAPI allows only \`http://localhost:3000\`
- [ ] Two teammates have done a dry run demo on their own machines" \
  "INFRA,size:S" \
  "Sprint 3 — Judge + Polish + Demo" \
  "SaurSum8"

# ─── Stretch ──────────────────────────────────────────────────────────────────

create_issue \
  "[DD-S2] Empirical complexity profiling" \
  "**Depends on:** DD-029

For each submission, run user code at \`n = [100, 1000, 10000]\` (3 runs each, median), fit a curve with \`big_O\` library, compare against AST-detected tier. Persist empirical tier alongside \`complexity_detected\`.

**Acceptance criteria:**
- [ ] Runs in < 5s total per submission
- [ ] Agrees with AST on 8/10 fixtures
- [ ] Flags disagreement as \`complexity_confidence='low'\`" \
  "AI,size:L" \
  "Stretch" \
  "artiomcovali"

create_issue \
  "[DD-S3] Error monitoring (Sentry free tier)" \
  "**Depends on:** DD-011

Sign up for Sentry free. Install \`@sentry/nextjs\` and \`sentry-sdk[fastapi]\`. Wire source maps for Next.js. Set up a dead-letter channel in Discord / Slack for alerts.

**Acceptance criteria:**
- [ ] Uncaught frontend error shows up in Sentry
- [ ] FastAPI 500 shows up in Sentry with stack trace
- [ ] PII scrubbing enabled (no user code in error bodies)" \
  "INFRA,size:S" \
  "Stretch" \
  "SaurSum8"

echo ""
echo "==> Done! Verifying..."
gh issue list --repo "$REPO" --limit 50 --json number,title | jq -r '.[] | "#\(.number) \(.title)"' | sort -t'#' -k2 -n
