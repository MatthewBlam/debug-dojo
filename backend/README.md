# Backend

The backend contains the Debug Dojo FastAPI service for submissions,
Judge0 integration, Supabase access, and Python code analysis.

## Local Development

Use the Python version from the root `.python-version` (3.12).

```sh
cd backend
uv sync
uv run uvicorn main:app --reload
```

The local API runs at <http://localhost:8000>.

## Quality Checks

```sh
cd backend
uv run ruff check .
uv run mypy .
```
