# Azure VM Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Debug Dojo backend (FastAPI + Judge0 + Postgres + Redis) to an Azure VM with Docker Compose so the frontend (local dev or Vercel) can connect to a real Judge0 instance.

**Architecture:** A single Azure Linux VM runs all services via Docker Compose. Caddy sits in front as a reverse proxy, providing automatic HTTPS via Let's Encrypt when a domain is configured (or plain HTTP on port 80 for IP-only dev usage). The FastAPI backend talks to Judge0 over Docker's internal network. The frontend points `NEXT_PUBLIC_API_BASE_URL` at the VM's public address.

**Tech Stack:** Docker, Docker Compose, Caddy, Azure CLI, Python 3.12, FastAPI, Judge0 1.13.1

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `backend/Dockerfile` | Containerize the FastAPI backend |
| Create | `deploy/Caddyfile` | Reverse proxy config (HTTPS termination, proxy to backend) |
| Create | `deploy/docker-compose.prod.yml` | Production compose file (backend + Judge0 stack + Caddy) |
| Create | `deploy/setup-vm.sh` | One-shot VM bootstrap script (install Docker, clone repo, start services) |
| Create | `deploy/.env.example` | Template for production secrets |
| Modify | `backend/main.py:14-20` | Make CORS origins configurable via env var |
| Modify | `backend/judge0/config.py:31-34` | Also load `.env` from parent of working dir (for Docker context) |

---

### Task 1: Backend Dockerfile

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`

- [ ] **Step 1: Create `.dockerignore`**

```
.venv/
__pycache__/
.pytest_cache/
*.pyc
.env
tests/
.mypy_cache/
supabase/
```

- [ ] **Step 2: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY judge0/ judge0/
COPY main.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 3: Verify the image builds locally**

Run: `cd /Users/mattyb/Projects/debug-dojo && docker build -t debug-dojo-backend ./backend`
Expected: Image builds successfully, final line shows `Successfully tagged debug-dojo-backend:latest`

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "feat: add Dockerfile for FastAPI backend"
```

---

### Task 2: Make CORS origins configurable

The backend currently hardcodes `localhost:3000` as the only allowed CORS origin. For production, it needs to accept requests from the Vercel deployment domain (and any other origins set via env var).

**Files:**
- Modify: `backend/main.py:14-20`

- [ ] **Step 1: Update CORS config in `main.py`**

Replace the hardcoded origins list with an env-var-driven approach. Change lines 13-22 to:

```python
import os

# ... (after app = FastAPI())

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

_extra_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
_origins = _default_origins + [o.strip() for o in _extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

This preserves localhost for local dev and adds any comma-separated origins from the `CORS_ALLOWED_ORIGINS` env var.

- [ ] **Step 2: Verify backend still starts locally**

Run: `cd /Users/mattyb/Projects/debug-dojo/backend && uv run uvicorn main:app --host 127.0.0.1 --port 8000 &`
Then: `curl -s http://127.0.0.1:8000/health`
Expected: `{"status":"ok"}`
Cleanup: kill the background uvicorn process.

- [ ] **Step 3: Commit**

```bash
git add backend/main.py
git commit -m "feat: make CORS origins configurable via CORS_ALLOWED_ORIGINS env var"
```

---

### Task 3: Fix Judge0 config env loading for Docker context

The current `get_judge0_url()` resolves the `.env` file relative to `Path(__file__).parents[2]`, which assumes the repo root is two directories up from `config.py`. Inside Docker, the working directory is `/app` and `config.py` lives at `/app/judge0/config.py`, so `parents[2]` would be `/` — not where `.env` lives. The fix: also check the working directory.

**Files:**
- Modify: `backend/judge0/config.py:31-34`

- [ ] **Step 1: Update `get_judge0_url` to also check CWD**

Replace lines 31-34:

```python
def get_judge0_url() -> str:
    repo_root = Path(__file__).resolve().parents[2]
    _load_env_file(repo_root / ".env")
    _load_env_file(Path.cwd() / ".env")
    return os.getenv("JUDGE0_URL", DEFAULT_JUDGE0_URL).rstrip("/")
```

Since `_load_env_file` skips keys already in `os.environ`, the repo-root `.env` takes precedence (loaded first), and the CWD `.env` fills in anything missing. In Docker, `JUDGE0_URL` is set via the compose environment anyway, so this is a safety net.

- [ ] **Step 2: Commit**

```bash
git add backend/judge0/config.py
git commit -m "fix: load .env from CWD as fallback for Docker context"
```

---

### Task 4: Production Docker Compose file

**Files:**
- Create: `deploy/docker-compose.prod.yml`
- Create: `deploy/.env.example`

- [ ] **Step 1: Create `deploy/.env.example`**

```bash
# === Backend ===
JUDGE0_URL=http://judge0:2358
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=

# === Judge0 (also used by Postgres/Redis) ===
REDIS_PASSWORD=change-me-redis-password
POSTGRES_DB=judge0
POSTGRES_USER=judge0
POSTGRES_PASSWORD=change-me-postgres-password

# === Caddy ===
# Set to your domain (e.g. api.debugdojo.dev) for auto-HTTPS
# Set to :80 for plain HTTP with just an IP address
SITE_ADDRESS=:80
```

- [ ] **Step 2: Create `deploy/docker-compose.prod.yml`**

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    environment:
      - JUDGE0_URL=${JUDGE0_URL:-http://judge0:2358}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS:-}
      - SUPABASE_URL=${SUPABASE_URL:-}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-}
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
    depends_on:
      - judge0
    restart: unless-stopped

  judge0:
    image: judge0/judge0:1.13.1
    environment:
      - VIRTUAL_HOST=localhost
      - VIRTUAL_PORT=2358
      - DAEMON=false
      - JUDGE0_TELEMETRY_ENABLE=false
      - ENABLE_WAIT_RESULT=true
      - ENABLE_COMPILER_OPTIONS=false
      - ENABLE_COMMAND_LINE_ARGUMENTS=false
      - ENABLE_SUBMISSION_DELETE=false
      - MAX_QUEUE_SIZE=100
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=${POSTGRES_DB:-judge0}
      - POSTGRES_USER=${POSTGRES_USER:-judge0}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - CPU_TIME_LIMIT=5
      - MAX_CPU_TIME_LIMIT=15
      - CPU_EXTRA_TIME=1
      - MAX_CPU_EXTRA_TIME=5
      - WALL_TIME_LIMIT=10
      - MAX_WALL_TIME_LIMIT=20
      - MEMORY_LIMIT=128000
      - MAX_MEMORY_LIMIT=512000
      - STACK_LIMIT=64000
      - MAX_STACK_LIMIT=128000
      - MAX_PROCESSES_AND_OR_THREADS=60
      - MAX_MAX_PROCESSES_AND_OR_THREADS=120
      - MAX_FILE_SIZE=1024
      - MAX_MAX_FILE_SIZE=4096
      - ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT=false
      - ALLOW_ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT=false
      - ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT=false
      - ALLOW_ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT=false
      - ALLOW_ENABLE_NETWORK=false
      - ENABLE_NETWORK=false
      - RAILS_ENV=production
    depends_on:
      - judge0-worker
      - postgres
      - redis
    privileged: true
    restart: unless-stopped

  judge0-worker:
    image: judge0/judge0:1.13.1
    command: ["./scripts/workers"]
    environment:
      - DAEMON=false
      - JUDGE0_TELEMETRY_ENABLE=false
      - ENABLE_WAIT_RESULT=true
      - ENABLE_COMPILER_OPTIONS=false
      - ENABLE_COMMAND_LINE_ARGUMENTS=false
      - ENABLE_SUBMISSION_DELETE=false
      - MAX_QUEUE_SIZE=100
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_DB=${POSTGRES_DB:-judge0}
      - POSTGRES_USER=${POSTGRES_USER:-judge0}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - CPU_TIME_LIMIT=5
      - MAX_CPU_TIME_LIMIT=15
      - CPU_EXTRA_TIME=1
      - MAX_CPU_EXTRA_TIME=5
      - WALL_TIME_LIMIT=10
      - MAX_WALL_TIME_LIMIT=20
      - MEMORY_LIMIT=128000
      - MAX_MEMORY_LIMIT=512000
      - STACK_LIMIT=64000
      - MAX_STACK_LIMIT=128000
      - MAX_PROCESSES_AND_OR_THREADS=60
      - MAX_MAX_PROCESSES_AND_OR_THREADS=120
      - MAX_FILE_SIZE=1024
      - MAX_MAX_FILE_SIZE=4096
      - ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT=false
      - ALLOW_ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT=false
      - ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT=false
      - ALLOW_ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT=false
      - ALLOW_ENABLE_NETWORK=false
      - ENABLE_NETWORK=false
      - RAILS_ENV=production
    depends_on:
      - postgres
      - redis
    privileged: true
    restart: unless-stopped

  postgres:
    image: postgres:16.2
    environment:
      - POSTGRES_DB=${POSTGRES_DB:-judge0}
      - POSTGRES_USER=${POSTGRES_USER:-judge0}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - judge0-postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7.2.4
    command:
      - bash
      - -c
      - docker-entrypoint.sh --appendonly no --requirepass "$$REDIS_PASSWORD"
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    restart: unless-stopped

volumes:
  judge0-postgres-data:
  caddy-data:
  caddy-config:
```

- [ ] **Step 3: Commit**

```bash
git add deploy/docker-compose.prod.yml deploy/.env.example
git commit -m "feat: add production Docker Compose with Caddy, backend, and Judge0"
```

---

### Task 5: Caddy reverse proxy config

**Files:**
- Create: `deploy/Caddyfile`

- [ ] **Step 1: Create `deploy/Caddyfile`**

```caddyfile
{$SITE_ADDRESS} {
	reverse_proxy backend:8000
}
```

When `SITE_ADDRESS` is a domain like `api.debugdojo.dev`, Caddy automatically provisions a Let's Encrypt TLS certificate. When it's `:80`, Caddy serves plain HTTP — good for dev with a raw IP.

- [ ] **Step 2: Commit**

```bash
git add deploy/Caddyfile
git commit -m "feat: add Caddyfile for reverse proxy"
```

---

### Task 6: VM bootstrap script

This script is run once on a fresh Azure Ubuntu VM. It installs Docker, clones the repo, and starts the services.

**Files:**
- Create: `deploy/setup-vm.sh`

- [ ] **Step 1: Create `deploy/setup-vm.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

# ── Install Docker ──────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo "Docker installed. Log out and back in for group changes, then re-run this script."
  exit 0
fi

# ── Clone repo (if not already present) ─────────────────────────
REPO_DIR="$HOME/debug-dojo"
if [ ! -d "$REPO_DIR" ]; then
  echo "Cloning repository..."
  git clone https://github.com/MatthewBlam/debug-dojo.git "$REPO_DIR"
fi

cd "$REPO_DIR/deploy"

# ── Create .env from template if missing ────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "Created deploy/.env from template."
  echo "Edit it now with your real secrets:"
  echo "  nano $REPO_DIR/deploy/.env"
  echo ""
  echo "Then re-run this script to start services."
  exit 0
fi

# ── Start services ──────────────────────────────────────────────
echo "Starting services..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Services started. Check status with:"
echo "  docker compose -f docker-compose.prod.yml ps"
echo "  docker compose -f docker-compose.prod.yml logs -f backend"
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x deploy/setup-vm.sh`

- [ ] **Step 3: Commit**

```bash
git add deploy/setup-vm.sh
git commit -m "feat: add VM bootstrap script for Azure deployment"
```

---

### Task 7: Azure provisioning commands (reference doc)

This is not a script to run blindly — it's the commands to run interactively from your Mac to create the Azure VM and connect to it.

**Files:**
- Create: `deploy/AZURE-SETUP.md`

- [ ] **Step 1: Create `deploy/AZURE-SETUP.md`**

```markdown
# Azure VM Setup

## Prerequisites

- Azure CLI installed: `brew install azure-cli`
- Logged in: `az login`

## 1. Create resource group and VM

```bash
az group create --name debug-dojo-rg --location eastus

az vm create \
  --resource-group debug-dojo-rg \
  --name debug-dojo-vm \
  --image Ubuntu2404 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

Save the `publicIpAddress` from the output.

## 2. Open ports

```bash
az vm open-port \
  --resource-group debug-dojo-rg \
  --name debug-dojo-vm \
  --port 80 \
  --priority 1000

az vm open-port \
  --resource-group debug-dojo-rg \
  --name debug-dojo-vm \
  --port 443 \
  --priority 1001
```

## 3. SSH into the VM and bootstrap

```bash
ssh azureuser@<PUBLIC_IP>

# On the VM:
curl -fsSL https://raw.githubusercontent.com/MatthewBlam/debug-dojo/main/deploy/setup-vm.sh -o setup-vm.sh
chmod +x setup-vm.sh
./setup-vm.sh
# First run installs Docker — log out and back in, then run again
./setup-vm.sh
# Second run clones repo and creates .env — edit .env with secrets
nano ~/debug-dojo/deploy/.env
./setup-vm.sh
# Third run starts all services
```

## 4. Connect your frontend

Set `NEXT_PUBLIC_API_BASE_URL=http://<PUBLIC_IP>` in:
- `.env.local` for local dev
- Vercel environment variables for production

## 5. Cost management

```bash
# Deallocate to stop compute charges (~$30/mo → ~$5/mo disk only)
az vm deallocate --resource-group debug-dojo-rg --name debug-dojo-vm

# Start it back up
az vm start --resource-group debug-dojo-rg --name debug-dojo-vm
```

## Useful commands

```bash
# SSH in
ssh azureuser@<PUBLIC_IP>

# View logs
cd ~/debug-dojo/deploy
docker compose -f docker-compose.prod.yml logs -f

# Restart everything
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Update code
cd ~/debug-dojo && git pull
cd deploy && docker compose -f docker-compose.prod.yml up -d --build
```
```

- [ ] **Step 2: Commit**

```bash
git add deploy/AZURE-SETUP.md
git commit -m "docs: add Azure VM setup instructions"
```

---

### Task 8: Update `.gitignore` for deploy secrets

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add deploy `.env` to gitignore**

Add to the Environment section of `.gitignore`:

```
deploy/.env
```

This ensures `deploy/.env` (with real passwords) is never committed, while `deploy/.env.example` (the template) is tracked.

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore deploy/.env"
```
