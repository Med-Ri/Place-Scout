#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm run build

# Recompile on TypeScript changes; Node restarts when dist output changes.
tsc -p tsconfig.build.json --watch --preserveWatchOutput &
TSC_PID=$!

cleanup() {
  kill "$TSC_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

node --watch dist/main.js
