# RDS Module

## Purpose

Creates managed PostgreSQL databases for service-owned data and ledger storage.

## Owner

Cloud database platform team.

## What Should Go Inside

- RDS instances or clusters
- Subnet groups
- Parameter groups
- Backup and PITR configuration
- KMS encryption settings

## What Should Not Go Inside

- Public database exposure
- Database passwords in code
- Application migrations
- Manual SQL data fixes

