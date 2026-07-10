# Production environment

Production uses three AZs, Multi-AZ-capable sizing, encrypted private data services, and must use a separately managed remote state backend with locking. Supply the database password through Secrets Manager/CI secret injection; never commit it. Require manual approval for every production plan/apply.
