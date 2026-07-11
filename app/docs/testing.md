# Testing Strategy

## Unit tests

Use Vitest for pure functions, validators and components.

## E2E tests

Use Playwright to test critical journeys:

- login
- dashboard load
- wallet funding initiation
- transfer review
- withdrawal review
- KYC submission
- admin fraud review
- reconciliation view

## Security tests

Add automated checks for:

- no secrets in frontend bundle
- no token usage in localStorage/sessionStorage
- required idempotency key for money operation clients
- sensitive field masking
- accessibility checks
