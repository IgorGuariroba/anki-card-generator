#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"

# Encerra somente processos Next.js que estejam escutando a porta de desenvolvimento.
if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN || true)"
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
    for _ in {1..20}; do
      sleep 0.1
      remaining="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN || true)"
      [[ -z "$remaining" ]] && break
    done
    [[ -n "${remaining:-}" ]] && kill -9 $remaining 2>/dev/null || true
  fi
fi

exec next dev "$@"
