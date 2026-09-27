# Product Requirements Document

## Product

**Sahakar Edge**

## Problem

Cooperative-sector training workflows can be fragmented across
registration, attendance, learning, assessment, certification, logistics
and post-training employment records. Rural deployment also creates
intermittent-connectivity constraints.

## Product principle

Move essential training-centre operations to a local edge node. Cloud
connectivity improves coordination but is not required for the core
local session.

## Users

### Trainee

-   Join assigned programmes.
-   Access downloaded/local course content.
-   Mark/verify attendance through supported mechanism.
-   Complete assessments.
-   View progress.
-   Receive credentials.
-   Maintain skill profile.
-   Discover relevant opportunities.

### Trainer

-   View batches and roster.
-   Start/end sessions.
-   Record or review attendance.
-   Deliver course content.
-   Create/review assessments.
-   View local sync status.

### Institute Admin

-   Manage programmes, batches, trainers and trainees.
-   Manage timetable.
-   Manage basic hostel/resource records.
-   Provision edge node.
-   Monitor sync and node health.
-   Review attendance and completion.

### NCCT / Central Admin

-   Manage institutes.
-   View consolidated programme metrics.
-   Manage central course catalogue.
-   Manage issuer keys/policies.
-   View node fleet status.

### Employer / Recruiter

-   Publish opportunities.
-   Define required skills.
-   Verify presented credentials.
-   View candidate skill evidence where authorized.

## MVP functional requirements

### Authentication & RBAC

Roles: - SUPER_ADMIN - INSTITUTE_ADMIN - TRAINER - TRAINEE - EMPLOYER

### Institute management

-   Institutes
-   users
-   programmes
-   batches
-   sessions
-   timetable

### LMS

-   course/module/lesson hierarchy
-   downloadable/local content metadata
-   progress
-   quiz/assessment
-   submission/result

### Attendance

-   session creation
-   attendance event
-   verification method enum:
    -   SIMULATED_FACE
    -   QR
    -   NFC
    -   MANUAL_OVERRIDE
-   confidence/quality metadata when applicable
-   override requires reason + actor + audit record

### Edge operation

When WAN is unavailable: - trainee login for provisioned users - local
programme roster - local course access - progress - assessments -
attendance - local event journal - sync status

### Synchronization

-   append local events with UUID
-   idempotent ingestion
-   event status: LOCAL, QUEUED, SYNCED, FAILED
-   server acknowledgement
-   retry with backoff
-   conflict log
-   never silently overwrite conflicting authoritative data

### Credentials

-   assessment/completion evidence
-   credential record
-   signed payload abstraction
-   QR representation
-   verification screen
-   key-management abstraction
-   MVP may use application-managed Ed25519 signing keys in a protected
    server secret store; production KMS is future work

### Skills

-   skill entity
-   course-to-skill mapping
-   evidence record
-   trainee skill profile

### Employment

-   job/opportunity
-   required skills
-   deterministic eligibility filters
-   baseline relevance score
-   explain matching by matched/missing skills
-   never display invented "AI accuracy"

### Analytics

Show: - enrolled trainees - attendance - completion - assessments - sync
backlog - node health - credentials issued

## Non-functional requirements

-   responsive
-   PWA installable
-   local-first edge UI
-   accessibility-conscious
-   auditable mutations
-   typed API contracts
-   automated tests
-   demo seed/reset
-   no dependence on external paid API for critical demo flow

## Explicit non-goals for MVP

-   national production scale
-   final biometric accuracy claims
-   full PACS/NCCT external API integration without official API access
-   production biometric legal/compliance certification
-   blockchain
-   autonomous AI career decisions
-   native iOS app unless time remains; PWA is primary
