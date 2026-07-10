# SQS Module

## Purpose

Creates queues and DLQs for asynchronous workflows.

## Owner

Cloud platform engineering.

## What Should Go Inside

- SQS queues
- DLQs
- Redrive policies
- Visibility timeout configuration
- Queue alarms

## What Should Not Go Inside

- Consumer business logic
- Unbounded retry policies
- Secret payloads
- Unversioned event contracts

