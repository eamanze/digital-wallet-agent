# Data classification and handling

| Classification | Examples | Storage/access | Logging |
|---|---|---|---|
| Public | API docs, health status | public edge where intended | allowed |
| Internal | service IDs, metrics, runbooks | private systems, role access | minimize |
| PII | name, phone, email, device/IP | encrypted, purpose-limited access | masked |
| Sensitive PII | BVN/NIN, KYC documents, selfie | KMS-encrypted private S3/RDS, strict RBAC, retention policy | never log |
| Secret | password, PIN, OTP, token, webhook secret | hash or Secrets Manager; short TTL/rotation | never log |
| Financial/PCI | ledger entries, provider references, card tokens | encrypted append-only stores; tokenization boundary | mask identifiers |

Exports require an approved purpose, least data, watermarking, audit event, and expiry.
