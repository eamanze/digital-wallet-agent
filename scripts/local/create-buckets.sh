#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

buckets=(
  "${BUCKET_KYC_DOCUMENTS:-wallet-kyc-documents-local}"
  "${BUCKET_RECONCILIATION_REPORTS:-wallet-reconciliation-reports-local}"
  "${BUCKET_AUDIT_ARCHIVE:-wallet-audit-archive-local}"
  "${BUCKET_APP_ARTIFACTS:-wallet-app-artifacts-local}"
)

for bucket in "${buckets[@]}"; do
  echo "Ensuring S3 bucket ${bucket}"
  docker compose exec -T localstack awslocal s3 mb "s3://${bucket}" >/dev/null 2>&1 || true
  docker compose exec -T localstack awslocal s3api put-bucket-versioning \
    --bucket "$bucket" \
    --versioning-configuration Status=Enabled >/dev/null
done

docker compose exec -T localstack awslocal secretsmanager create-secret \
  --name local/provider/mock-payment/api-key \
  --secret-string '{"api_key":"local_mock_payment_key","webhook_secret":"local_mock_payment_webhook_secret"}' >/dev/null 2>&1 || true

docker compose exec -T localstack awslocal secretsmanager create-secret \
  --name local/notifications/mock-sms/api-key \
  --secret-string '{"api_key":"local_mock_sms_key"}' >/dev/null 2>&1 || true

echo "LocalStack buckets and development secrets are ready."

