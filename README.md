# Debug Dojo

**A coding-practice platform where you fix deliberately buggy AI-generated code.**

![Debug Dojo](frontend/public/logo.png)

## What is Debug Dojo?

Debug Dojo presents "slop" -- AI-generated code with intentional bugs -- and
challenges you to find and fix the defect. The platform judges your fix for
correctness (all test cases must pass) and efficiency (Big-O complexity
analysis against a target bound).

## Tech Stack

| Layer | Technology |
|----------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Monaco Editor, Tailwind CSS |
| Backend | FastAPI (Python 3.12), Judge0 CE (Docker) |
| Database | Supabase (Postgres) with Row-Level Security |
| AI | Google Gemini 2.5 Flash -- slop generation, test case generation, feedback cards |

## Architecture

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│ Browser  │────>│ Next.js  │────>│ FastAPI  │
└─────────┘     └──────────┘     └────┬─────┘
                                      │
                        ┌─────────────┼─────────────┐
                        │             │             │
                   ┌────▼───┐  ┌─────▼────┐  ┌─────▼────┐
                   │ Judge0 │  │ Supabase │  │ Gemini   │
                   └────────┘  └──────────┘  └──────────┘
```

## Getting Started

### Prerequisites

- Node.js 22+
- Python 3.12+
- Docker
- Supabase account
- Gemini API key

### Setup

```bash
# Clone
git clone https://github.com/MatthewBlam/debug-dojo.git
cd debug-dojo

# Install
make install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit both files with your Supabase and Gemini credentials

# Start services (Judge0)
docker compose up -d

# Run
make dev
```

## Project Structure

```
debug-dojo/
├── frontend/          # Next.js app
│   ├── src/app/       # Pages (App Router)
│   ├── src/components # UI components
│   └── src/lib/       # Hooks, utils, tokens
├── backend/           # FastAPI server
│   ├── analysis/      # AST complexity analyzer
│   ├── llm/           # Gemini client + feedback
│   ├── cli/           # Slop gen, test gen, seeder CLIs
│   ├── judge0/        # Judge0 sandboxed runner
│   ├── seeds/         # Problem YAML specs
│   └── supabase/      # SQL migrations
└── docker-compose.yml # Judge0 CE services
```

## Seeding Problems

```bash
cd backend
python -m cli.seed_problem seeds/001_two_sum.yaml --dry-run
python -m cli.seed_problem "seeds/*.yaml"
```

## Three-Tier Verdicts

| Verdict | Meaning |
|---------|---------|
| Pass    | All tests correct + complexity <= target |
| Partial | All tests correct but complexity too high |
| Fail    | At least one test case wrong |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Open a pull request against `main`

## License

This is a class project. No license file is currently provided.
