# Chess vs Stockfish

## Overview

A pnpm monorepo workspace for a Chess vs Stockfish AI game application with a React frontend and an Express API server backed by PostgreSQL.

## Architecture

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 20 (Replit) / 24 (target)
- **Package manager**: pnpm
- **Frontend**: React 19 + Vite + Tailwind CSS 4 + Radix UI (`artifacts/chess-game`)
- **Backend**: Express 5 API server (`artifacts/api-server`) on port 3000
- **Database**: PostgreSQL via Replit managed DB + Drizzle ORM (`lib/db`)
- **Chess engine**: Stockfish WASM (in `artifacts/chess-game/public/`)
- **API codegen**: Orval from OpenAPI spec (`lib/api-spec/openapi.yaml`)

## Project Structure

```
artifacts/
  chess-game/        # Main React frontend (port 5000)
  api-server/        # Express API server (port 3000)
  mockup-sandbox/    # UI prototyping environment
lib/
  api-spec/          # OpenAPI spec + Orval config
  api-client-react/  # Generated React Query hooks
  api-zod/           # Generated Zod schemas
  db/                # Drizzle schema + DB connection
scripts/             # Workspace utility scripts
```

## Running Locally

The `start.sh` script at the root launches both services:
- API server builds (esbuild) and starts on port 3000
- Vite dev server starts on port 5000, proxying `/api/*` to port 3000

```
bash start.sh
```

## Environment Variables

- `PORT=5000` — Frontend Vite dev server port
- `BASE_PATH=/` — Vite base path
- `API_PORT=3000` — API server port
- `DATABASE_URL` — PostgreSQL connection (managed by Replit)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — build + run API server locally
- `pnpm --filter @workspace/chess-game run dev` — run frontend only

## Database Schema

Managed by Drizzle ORM. Schema is in `lib/db/src/schema/`. Push changes with:
```
pnpm --filter @workspace/db run push
```

## Deployment

Configured for autoscale deployment:
- Build: installs deps, builds API server and chess-game frontend
- Run: `bash start.sh`
