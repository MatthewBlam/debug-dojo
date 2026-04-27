# Debug Dojo

Debug Dojo is a Python debugging practice app. The monorepo is
organized around a Next.js frontend and a FastAPI backend.

## Project Structure

- [frontend/](frontend/README.md) - Next.js App Router UI
- [backend/](backend/README.md) - FastAPI API, execution, and
  analysis services

## Tool Versions

- Node.js: see [.nvmrc](.nvmrc)
- Python: see [.python-version](.python-version)

Run `nvm use` from the repo root before working on frontend
code. Use the Python version listed in `.python-version` for
backend work.

## Local Development

This repository currently contains the DD-001 monorepo scaffold.
The runnable Next.js and FastAPI applications will be added in
later tickets. These are the intended local entrypoints once
those scaffolds land.

### Frontend

```sh
cd frontend
pnpm install
pnpm dev
```

The frontend should run at <http://localhost:3000>.

### Backend

```sh
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend should run at <http://localhost:8000>.
