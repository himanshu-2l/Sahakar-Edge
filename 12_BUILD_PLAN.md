# Build Plan

## Phase 0 --- Bootstrap

-   monorepo
-   shared config
-   DB
-   auth
-   RBAC
-   seed users
-   CI

## Phase 1 --- Central core

-   institutes
-   programmes
-   batches
-   enrollments
-   sessions
-   courses

Acceptance: Admin can create a complete programme and assign trainees.

## Phase 2 --- Trainee PWA

-   home
-   learning
-   progress
-   assessments
-   offline shell/content manifest

Acceptance: Provisioned trainee can access downloaded/local content.

## Phase 3 --- Edge server

-   SQLite
-   local auth/provisioned identities
-   local API
-   event journal
-   health

Acceptance: Edge survives WAN loss and restart.

## Phase 4 --- Sync

-   handshake
-   event batching
-   idempotent ingestion
-   acknowledgement
-   retries
-   sync UI

Acceptance: Offline events appear centrally after reconnect exactly
once.

## Phase 5 --- Attendance

-   simulation provider
-   QR provider
-   optional camera provider
-   trainer review
-   manual override audit

Acceptance: Attendance works offline.

## Phase 6 --- Credentials

-   completion rules
-   skill evidence
-   signing
-   QR
-   verifier

Acceptance: Issued credential verifies and can be revoked.

## Phase 7 --- Employment

-   skill taxonomy
-   jobs
-   explainable matching

Acceptance: User sees matched and missing skills.

## Phase 8 --- Demo hardening

-   seed/reset
-   offline scenario
-   failure fallbacks
-   performance logging
-   deployment
-   screenshots/PPT evidence

## Priority

If schedule becomes tight: MUST: central + PWA + edge + offline sync +
attendance + assessment. SHOULD: credential verification. COULD:
employment matching, camera PAD experimentation.
