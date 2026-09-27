# Testing, Validation and SIH Demo Plan

## Testing pyramid

### Unit

-   RBAC
-   assessment scoring
-   skill mapping
-   credential signing/verifying
-   event serialization
-   conflict classification
-   job scoring

### Integration

-   API + DB
-   edge SQLite + event journal
-   sync upload/ack
-   credential lifecycle
-   offline course manifest

### E2E

-   admin creates programme
-   trainee enrolls
-   trainer starts session
-   attendance
-   learning
-   assessment
-   credential
-   job match
-   sync

## Required offline tests

1.  Start online and provision edge.
2.  Disconnect WAN.
3.  Restart edge.
4.  Login locally.
5.  Record attendance.
6.  complete lesson.
7.  submit assessment.
8.  verify queued events.
9.  reconnect.
10. verify central state.
11. repeat same event upload; confirm idempotency.

## Hardware tests

-   CPU temperature under load
-   disk usage
-   local response latency
-   10/25/40 simulated clients where possible
-   abrupt power interruption recovery
-   network flap

Do not put unmeasured targets in PPT as achieved metrics.

## SIH demo script

### Scene 1

Show central admin programme and provisioned edge node.

### Scene 2

Physically disconnect internet.

### Scene 3

Open trainee PWA through local edge network. Show visible OFFLINE
banner.

### Scene 4

Record attendance.

### Scene 5

Open course and complete quiz.

### Scene 6

Show local event queue.

### Scene 7

Reconnect internet.

### Scene 8

Show queue dropping to zero and central dashboard updating.

### Scene 9

Show credential and verification.

### Scene 10

Show skill profile and explainable job match.

## Failure fallback

If camera fails: - QR attendance provider. If cloud deployment fails: -
local central Docker stack. If internet at venue fails: - demo is
intentionally offline-capable.
