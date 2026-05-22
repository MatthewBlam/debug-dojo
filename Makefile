SHELL := /bin/sh

.PHONY: install dev dev-no-judge0 stop backend-dev backend-smoke frontend-dev judge0-up judge0-down check-docker test

install:
	cd frontend && CI=true corepack pnpm install --frozen-lockfile
	if command -v uv >/dev/null 2>&1; then \
		cd backend && uv sync; \
	else \
		python3 -m venv backend/.venv && \
		backend/.venv/bin/python -m pip install --upgrade pip && \
		backend/.venv/bin/python -m pip install -r backend/requirements.txt; \
	fi

dev:
	$(MAKE) judge0-up
	( \
		$(MAKE) backend-dev & \
		backend_pid=$$!; \
		$(MAKE) frontend-dev & \
		frontend_pid=$$!; \
		trap 'kill $$backend_pid $$frontend_pid 2>/dev/null || true' INT TERM EXIT; \
		wait $$backend_pid $$frontend_pid \
	)

dev-no-judge0:
	( \
		$(MAKE) backend-dev & \
		backend_pid=$$!; \
		$(MAKE) frontend-dev & \
		frontend_pid=$$!; \
		trap 'kill $$backend_pid $$frontend_pid 2>/dev/null || true' INT TERM EXIT; \
		wait $$backend_pid $$frontend_pid \
	)

backend-dev:
	if command -v uv >/dev/null 2>&1; then \
		cd backend && uv run uvicorn main:app --reload --host 127.0.0.1 --port 8000; \
	elif [ -x backend/.venv/bin/uvicorn ]; then \
		cd backend && .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000; \
	else \
		echo "Backend dependencies are not installed."; \
		echo "Run: make install"; \
		exit 127; \
	fi

backend-smoke:
	if command -v uv >/dev/null 2>&1; then \
		cd backend && uv run uvicorn main:app --host 127.0.0.1 --port 8000; \
	elif [ -x backend/.venv/bin/uvicorn ]; then \
		cd backend && .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000; \
	else \
		echo "Backend dependencies are not installed."; \
		echo "Run: make install"; \
		exit 127; \
	fi

frontend-dev:
	cd frontend && corepack pnpm dev

check-docker:
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "Docker CLI is required to start Judge0."; \
		echo "Install/start Docker Desktop, then rerun: make dev"; \
		echo "For UI/backend work without Judge0, run: make dev-no-judge0"; \
		exit 127; \
	fi

judge0-up: check-docker
	docker compose up -d judge0

judge0-down: check-docker
	docker compose stop judge0 judge0-worker postgres redis

stop: judge0-down

test:
	cd backend && python3 -m pytest
	cd frontend && corepack pnpm lint
	cd frontend && corepack pnpm typecheck
