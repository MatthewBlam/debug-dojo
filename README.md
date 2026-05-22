# Debug Dojo

Debug Dojo is a Python debugging practice app. It pairs broken starter
solutions with focused problem statements so developers can fix defects,
run code, and compare their answer against expected output.

The current sprint-1 app includes a Next.js frontend, a FastAPI backend,
a local Judge0 runner, Supabase schema/seed files, and a single seeded
Two Sum problem.

## Project Structure

- [frontend/](frontend/README.md) - Next.js App Router UI
- [backend/](backend/README.md) - FastAPI API and Judge0 integration
- [backend/supabase/](backend/supabase) - Supabase schema and seed SQL
- [docs/](docs) - demo script and demo artifact notes

## Requirements

- Node.js: see [.nvmrc](.nvmrc)
- Python: see [.python-version](.python-version)
- Docker Desktop or Docker Engine for Judge0
- `corepack` enabled for pnpm
- Optional: `uv` for faster backend setup

## Local Development

Copy the example env files before running locally:

```sh
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Fill in the Supabase values if you want to load persisted problems from
Supabase. Judge0 defaults to <http://127.0.0.1:2358>, and the backend
defaults to <http://127.0.0.1:8000>.

Install dependencies:

```sh
make install
```

Start the local stack:

```sh
make dev
```

This starts Judge0, FastAPI, and Next.js. The app runs at
<http://localhost:3000>, and the API health check is
<http://127.0.0.1:8000/health>.

Stop the Judge0 containers:

```sh
make stop
```

## Manual Commands

Frontend:

```sh
cd frontend
corepack pnpm install
corepack pnpm dev
```

Backend with `uv`:

```sh
cd backend
uv sync
uv run uvicorn main:app --reload
```

Backend without `uv`:

```sh
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Supabase Seed

Apply the schema in `backend/supabase/migrations/0001_init.sql`, then run
`backend/supabase/seeds/0001_two_sum.sql` to insert the sprint-1 Two Sum
problem. The seed uses the fixed UUID expected by the sprint-1 backend
submission endpoint.

## Smoke Test

1. Run `make install && make dev`.
2. Open <http://localhost:3000> and confirm the landing page renders.
3. Open <http://localhost:3000/login> and confirm the sign-in UI renders.
4. Open <http://localhost:3000/problems> and confirm the problem browser renders.
5. Open the seeded Two Sum problem and submit a known-good `two_sum` solution.
6. Confirm the result banner shows `Passed`.

## Quality Checks

```sh
make test
```

For a real Judge0 integration test, start Judge0 and run:

```sh
cd backend
RUN_JUDGE0_INTEGRATION=1 python3 -m pytest
```
