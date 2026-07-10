#!/usr/bin/env sh
set -eu

echo "Applying wallet database migrations..."
for migration in /workspace/infrastructure/db/migrations/*.sql; do
  echo "Applying ${migration}"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --file "$migration"
done

echo "Applying wallet local seed data..."
for seed in /workspace/scripts/seed/*.sql; do
  echo "Applying ${seed}"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --file "$seed"
done

echo "Database initialization complete."

