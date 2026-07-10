#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if [ "${1:-}" = "--with-opensearch" ]; then
  docker compose --profile opensearch up -d
else
  docker compose up -d
fi

echo "Waiting for LocalStack to become healthy..."
localstack_ready=0
for _ in $(seq 1 60); do
  if docker compose exec -T localstack curl -fsS http://localhost:4566/_localstack/health >/dev/null 2>&1; then
    localstack_ready=1
    break
  fi
  sleep 2
done

if [ "$localstack_ready" -ne 1 ]; then
  echo "LocalStack did not become healthy in time." >&2
  exit 1
fi

"$ROOT_DIR/scripts/local/create-queues.sh"
"$ROOT_DIR/scripts/local/create-buckets.sh"

cat <<'MSG'

Local wallet environment is running.

PostgreSQL:          localhost:5432
Redis:               localhost:6379
LocalStack:          http://localhost:4566
Mailhog UI:          http://localhost:8025
Mock SMS provider:   http://localhost:8091
Mock payment:        http://localhost:8092
Mock biller:         http://localhost:8093
Mock airtime:        http://localhost:8094

Use './scripts/local/start.sh --with-opensearch' to include OpenSearch.
MSG
