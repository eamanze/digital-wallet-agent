# S3 Module

## Purpose

Creates encrypted object storage for KYC documents, reconciliation files, audit archives, and build artifacts.

## Owner

Cloud platform engineering.

## What Should Go Inside

- Buckets
- KMS encryption
- Lifecycle policies
- Versioning and access logging
- Public access blocks

## What Should Not Go Inside

- Public KYC documents
- Meaningful filenames containing identity numbers
- Plaintext sensitive exports
- Application source code

