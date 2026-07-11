# Frontend Security Model

## Token handling

Do not store access tokens, refresh tokens, session IDs, OTPs or transaction PINs in localStorage or sessionStorage.

Use a BFF/API Gateway with `HttpOnly`, `Secure`, `SameSite` cookies.

## Sensitive input

The frontend collects transaction PIN only when required and never logs it. Backend validation is mandatory.

## CSP and headers

Security headers are configured in `next.config.mjs`. CSP should be tightened for production by listing exact API, analytics, image and monitoring domains.

## Admin access

Admin pages are UI only. Authorization must be enforced by the backend. MFA and RBAC are mandatory for admin operations.

## Client validation

Client validation improves UX but is not a security boundary. The backend must enforce all security, compliance, fraud, fee and limit rules.
