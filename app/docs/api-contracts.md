# API Contracts

## Standard response

```json
{
  "data": {},
  "meta": {
    "requestId": "corr_..."
  }
}
```

## Standard error

```json
{
  "code": "LIMIT_EXCEEDED",
  "message": "Daily transaction limit exceeded",
  "requestId": "corr_...",
  "details": {}
}
```

## Required headers for money operations

```text
Idempotency-Key: transfer_uuid
X-Correlation-Id: corr_uuid
```

## Session

The BFF/API Gateway should set and validate secure HTTP-only cookies. The browser should not read tokens directly.
