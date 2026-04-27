# Backend

The backend will contain the Debug Dojo FastAPI service for
submissions, Judge0 integration, Supabase access, and Python
code analysis.

DD-001 creates the monorepo location and conventions. The
executable FastAPI scaffold will be added by DD-005.

## Local Development

Use the Python version from the root `.python-version`.

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The local API should run at <http://localhost:8000> once the
FastAPI scaffold is in place.
