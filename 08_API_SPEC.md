# API Contract Outline

Prefix: `/api/v1`

## Auth

-   POST `/auth/login`
-   POST `/auth/refresh`
-   POST `/auth/logout`
-   GET `/me`

## Institutes

-   GET/POST `/institutes`
-   GET/PATCH `/institutes/:id`

## Programmes

-   GET/POST `/programmes`
-   GET/PATCH `/programmes/:id`
-   POST `/programmes/:id/enrollments`

## Courses

-   GET/POST `/courses`
-   GET `/courses/:id`
-   GET `/courses/:id/content-manifest`

## Sessions

-   POST `/sessions`
-   GET `/sessions/:id`
-   POST `/sessions/:id/start`
-   POST `/sessions/:id/end`

## Attendance

-   POST `/attendance/events`
-   GET `/sessions/:id/attendance`
-   POST `/attendance/:id/override`

## Progress

-   POST `/progress/events`
-   GET `/trainees/:id/progress`

## Assessments

-   GET `/assessments/:id`
-   POST `/assessments/:id/submissions`

## Credentials

-   POST `/credentials/issue`
-   GET `/credentials/:id`
-   POST `/credentials/:id/revoke`
-   POST `/credentials/verify`

## Skills

-   GET `/skills`
-   GET `/trainees/:id/skills`

## Jobs

-   GET/POST `/jobs`
-   GET `/jobs/:id`
-   GET `/trainees/:id/job-matches`

## Edge nodes

-   POST `/edge/register`
-   GET `/edge/:id/health`
-   POST `/edge/:id/heartbeat`

## Sync

-   POST `/sync/handshake`
-   POST `/sync/events`
-   GET `/sync/delta`
-   GET `/sync/status/:nodeId`

## Rules

-   typed request/response schemas
-   validation at boundary
-   consistent error envelope
-   request ID
-   pagination
-   RBAC middleware
-   idempotency for sync and issuance operations
