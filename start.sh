#!/bin/bash
set -e

export PORT=5000
export BASE_PATH="/"
export API_PORT=3000

echo "Building API server..."
pnpm --filter @workspace/api-server run build

echo "Starting API server on port $API_PORT..."
PORT=$API_PORT node --enable-source-maps ./artifacts/api-server/dist/index.mjs &
API_PID=$!

echo "Starting chess-game frontend on port $PORT..."
pnpm --filter @workspace/chess-game run dev

wait $API_PID
