# Distributed tracing

The shared HTTP middleware accepts W3C `traceparent`, creates a span ID, propagates `traceparent`, `X-Request-ID`, and `X-Correlation-ID`, and exposes trace identifiers to service loggers. The deployment target is an OpenTelemetry Collector sidecar/daemon that exports OTLP traces to AWS X-Ray or an approved tracing backend.

Trace critical flows end-to-end: login, KYC, wallet funding, transfer, withdrawal, bill/airtime purchase, provider callback, ledger posting, and reconciliation. Never place tokens, PINs, identity values, or raw provider payloads in span attributes.
