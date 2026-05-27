# Backend

The backend contains the Debug Dojo FastAPI service for submissions,
Judge0 integration, Supabase access, and Python code analysis.

## Local Development

Use the Python version from the root `.python-version` (3.12).

Copy environment values before running locally:

```sh
cp .env.example .env
```

With `uv`:

```sh
cd backend
uv sync
uv run uvicorn main:app --reload
```

Without `uv`:

```sh
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The local API runs at <http://localhost:8000>.

## Quality Checks

```sh
cd backend
uv run ruff check .
uv run mypy .
```
