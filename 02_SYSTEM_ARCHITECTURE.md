# System Architecture

## Logical architecture

``` text
                    CENTRAL / CLOUD
┌────────────────────────────────────────────────────┐
│ Web Admin │ Employer Portal │ Central API          │
│ Central DB │ Credential Service │ Analytics        │
│ Sync Ingestion │ Institute/Course/Job Services     │
└───────────────────────▲────────────────────────────┘
                        │ HTTPS / authenticated sync
                        │
                  WAN available
                        │
┌───────────────────────┴────────────────────────────┐
│                  SAHAKAR EDGE NODE                 │
│ Local API │ Local DB │ Event Journal │ Sync Agent  │
│ Local LMS │ Attendance Adapter │ Device Health     │
│ Local Wi-Fi accessible Trainee/Trainer PWA         │
└───────────────▲───────────────────▲────────────────┘
                │                   │
        local browser/PWA      hardware adapters
                │                   │
             Trainees       Camera / QR / NFC
```

## Recommended monorepo

``` text
/apps
  /web-admin
  /trainee-pwa
  /edge-server
  /api
/packages
  /ui
  /types
  /validation
  /sync-protocol
  /credential-core
  /config
  /test-fixtures
/infra
/docs
/scripts
```

## Recommended stack

Coding agent may adjust only with documented reason.

-   TypeScript monorepo
-   Next.js for central web/admin
-   React/Next PWA for trainee surface
-   Node.js API (NestJS/Fastify/Express acceptable; prefer one
    consistent framework)
-   PostgreSQL central DB
-   SQLite on edge node
-   Prisma or Drizzle ORM
-   Zod/shared schema validation
-   Service Worker + IndexedDB for browser-level offline cache where
    useful
-   Docker for central services
-   Edge service deployable directly on Linux SBC
-   REST API first; avoid unnecessary microservices

## Architecture boundaries

### Central authoritative entities

-   institute
-   user identity
-   programme definition
-   course catalogue
-   issuer policy
-   job/opportunity

### Edge-created events

-   attendance
-   progress
-   assessment submission
-   local session events
-   device health

### Sync rule

Prefer event ingestion rather than copying entire mutable tables.

## Hardware abstraction

Define:

``` ts
interface AttendanceProvider {
  initialize(): Promise<void>
  capture(input: CaptureContext): Promise<AttendanceEvidence>
  health(): Promise<DeviceHealth>
}
```

Implement: - `SimulatedAttendanceProvider` - `QrAttendanceProvider` -
optional `CameraAttendanceProvider` - optional `NfcAttendanceProvider`

Do not tightly couple UI or attendance business logic to a specific
camera SDK.

## Edge node states

-   ONLINE_SYNCED
-   ONLINE_SYNCING
-   OFFLINE_READY
-   OFFLINE_DEGRADED
-   STORAGE_WARNING
-   HARDWARE_WARNING

Display state prominently in trainer UI.
