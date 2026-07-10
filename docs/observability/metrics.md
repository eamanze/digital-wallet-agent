# Metrics

Every service exposes `GET /metrics` in Prometheus text format through the shared request middleware.

Technical RED metrics:

- `http_requests_total{method,route,status}`
- `http_client_errors_total{method,route,status}`
- `http_server_errors_total{method,route,status}`
- `http_request_duration_ms_count/sum{method,route}`

Services should increment these business counters at their domain boundaries:

- `transaction_success_total`, `transaction_failed_total`, `transaction_pending_total`
- `wallet_funding_volume_minor`, `withdrawal_volume_minor`, `bill_payment_volume_minor`, `airtime_volume_minor`
- `fraud_block_total`, `reconciliation_exception_total`, `provider_callback_duplicate_total`

CloudWatch receives ECS/container metrics and application metrics through the CloudWatch agent/OTel collector. Dimensions are `Environment`, `Service`, and `Route` where available. Money metrics use minor units and are never derived from logs.
