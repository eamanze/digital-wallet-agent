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

queues=(
  "${QUEUE_AUDIT_EVENTS:-audit-events}"
  "${QUEUE_NOTIFICATION_JOBS:-notification-jobs}"
  "${QUEUE_PROVIDER_CALLBACKS:-provider-callbacks}"
  "${QUEUE_RECONCILIATION_JOBS:-reconciliation-jobs}"
  "${QUEUE_FRAUD_ENRICHMENT:-fraud-enrichment}"
  "${QUEUE_SEARCH_INDEXING:-search-indexing}"
)

for queue in "${queues[@]}"; do
  dlq="${queue}-dlq"
  echo "Ensuring SQS DLQ ${dlq}"
  docker compose exec -T localstack awslocal sqs create-queue \
    --queue-name "$dlq" >/dev/null

  dlq_arn="$(docker compose exec -T localstack awslocal sqs get-queue-attributes \
    --queue-url "http://sqs.${AWS_REGION:-us-east-1}.localhost.localstack.cloud:4566/000000000000/${dlq}" \
    --attribute-names QueueArn \
    --query 'Attributes.QueueArn' \
    --output text | tr -d '\r')"

  redrive_policy="{\"deadLetterTargetArn\":\"${dlq_arn}\",\"maxReceiveCount\":\"5\"}"

  echo "Ensuring SQS queue ${queue}"
  docker compose exec -T localstack awslocal sqs create-queue \
    --queue-name "$queue" \
    --attributes "VisibilityTimeout=30,MessageRetentionPeriod=1209600,RedrivePolicy=${redrive_policy}" >/dev/null
done

echo "LocalStack queues are ready."

