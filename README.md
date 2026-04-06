# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Chess vs Stockfish game application.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Chess engine**: Stockfish WASM (in `public/stockfish.js` + `public/stockfish.wasm`)
- **Chess logic**: chess.js
- **Frontend**: React + Vite (artifact: chess-game at `/`)

## Chess App Features

- Play against Stockfish AI with adjustable difficulty (1-20)
- Choose player color (white/black)
- Move history in PGN notation
- Captured pieces display
- Game save/review functionality
- Step-through game replay for review

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Stockfish Note

Stockfish WASM files are in `artifacts/chess-game/public/`:
- `stockfish.js` — Stockfish lite-single JavaScript wrapper
- `stockfish.wasm` — The WASM binary (copy of stockfish-18-lite-single.wasm)

Both files are sourced from the `stockfish` npm package's `bin/` directory.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
