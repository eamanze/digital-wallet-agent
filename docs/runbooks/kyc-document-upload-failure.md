# Runbook: KYC document upload failure

**Severity:** SEV-2; SEV-1 if widespread or data exposure is suspected. **Alerts:** S3 put failures, KYC submission failures, checksum/KMS errors.

## Immediate action

Stop retries for the affected object key, preserve checksum/request ID, and verify no document became public.

## Diagnosis

Check S3/KMS status, bucket policy, presigned URL expiry, object checksum, IAM role, size/type limits, and KYC metadata state.

## Safe remediation / rollback

Issue a new short-lived presigned URL, retry with a new versioned object key, and leave KYC pending until checksum/encryption verification succeeds. Never log or copy document contents.

## Customer communication

“We could not securely receive your document. Please try the upload again from the app.”

## RCA questions

Was the object private and encrypted? Did failure leave orphaned metadata? Were retention and cleanup rules safe?
