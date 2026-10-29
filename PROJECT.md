# Project: Sahakar Edge — Phase 9: Enterprise National Rollout, Hardware IoT Hub & Multi-Tier Federation

## Architecture
Sahakar Edge Phase 9 expands the platform into an enterprise-grade national training, hardware-assisted attendance, oral assessment, multi-tier governance, and employment system for the Ministry of Cooperation and NCCT (SIH PS 26087).

```
                      ┌────────────────────────────────────────┐
                      │ Tier 1: Apex (VAMNICOM Pune / MoC HQ)  │
                      └──────────────────┬─────────────────────┘
                                         │
                      ┌──────────────────▼─────────────────────┐
                      │  Tier 2: 5 Regional Institutes (RICMs) │
                      │  Bhopal, Gandhinagar, Kalyani,         │
                      │  Patna, Bengaluru                      │
                      └──────────────────┬─────────────────────┘
                                         │
                      ┌──────────────────▼─────────────────────┐
                      │  Tier 3: 14 ICMs & 63,000 Field PACS   │
                      │  Grassroots Cooperative Training & ERP │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
┌───────▼──────────────┐       ┌─────────▼──────────────┐       ┌─────────▼──────────────┐
│ Apps/Central-API     │       │ Apps/Edge-Server       │       │ Apps/Trainee-PWA       │
│ - Multi-Tier Rollup  │       │ - Hardware IoT Hub     │       │ - Oral Viva Assessment │
│ - Recruiter Pipeline │       │ - RFID / Smart Card    │       │ - Speech Synthesis     │
│ - Ed25519 Offer Sign │       │ - Hotspot & Health     │       │ - Keyword Scoring      │
└───────┬──────────────┘       └─────────┬──────────────┘       └─────────┬──────────────┘
        │                                │                                │
┌───────▼──────────────┐                 │                      ┌─────────▼──────────────┐
│ Apps/Web-Admin       │                 │                      │ @sahakar/sync-protocol │
│ - National Map View  │                 │                      │ - RFC 8785 Canonical   │
│ - Recruiter Kanban   │                 │                      │ - SHA-256 Event Hash   │
└──────────────────────┘                 │                      └────────────────────────┘
                               ┌─────────▼──────────────┐
                               │ packages/              │
                               │ hardware-adapters      │
                               │ - ISO 14443A / KCC UID │
                               │ - Sub-50ms tap latency │
                               └────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | USB RFID / Smart Card Provider | `RfidSmartCardProvider` in `packages/hardware-adapters` supporting ISO 14443A and Kisan Credit Card UIDs with sub-50ms tap latency | M1 | ORIGINAL_REQUEST §1 |
| 2 | Edge Hotspot Automation Script | `apps/edge-server/scripts/edge-hotspot.sh` for Linux Wi-Fi AP configuration (SSID `SahakarEdge-RICM-Bhopal-01`, subnet `192.168.4.1/24`) | M1 | ORIGINAL_REQUEST §1 |
| 3 | Network Health & Hardware Telemetry Daemon | `apps/edge-server/src/services/health-daemon.ts` tracking CPU temperature, memory usage, and SQLite journal/WAL size | M1 | ORIGINAL_REQUEST §1 |
| 4 | Edge Hardware Status Endpoint | `GET /api/v1/hardware/status` on Edge Server exposing hardware health and telemetry | M1 | ORIGINAL_REQUEST §1 |
| 5 | Edge RFID Attendance Endpoint | `POST /api/v1/attendance/rfid` on Edge Server recording attendance under 50ms and queueing `ATTENDANCE_RECORDED` event | M1 | ORIGINAL_REQUEST §1 |
| 6 | Oral Viva Speech Synthesis & Recognition | Hindi (`hi-IN`) and English (`en-IN`) question playback and trainee voice capture in `apps/trainee-pwa` | M2 | ORIGINAL_REQUEST §2 |
| 7 | Client-side Keyword Scoring Engine | Keyword matching logic evaluating cooperative accounting terminology (Daybook, Rojnamcha, Cashbook, Loan Asset Debit, 25% Reserve Fund) | M2 | ORIGINAL_REQUEST §2 |
| 8 | Interactive Oral Assessment Modal | UI component in `apps/trainee-pwa` for voice viva assessment, realtime feedback, and submission | M2 | ORIGINAL_REQUEST §2 |
| 9 | Oral Assessment Sync Event | `ORAL_ASSESSMENT_SUBMITTED` event generated with RFC 8785 canonical JSON and SHA-256 hash | M2 | ORIGINAL_REQUEST §2 |
| 10 | Offline Event Journal Queueing | Offline queuing of oral assessment events in `apps/trainee-pwa/src/services/offline-store.ts` for upstream synchronization | M2 | ORIGINAL_REQUEST §2 |
| 11 | National Multi-Tier Rollup Logic | 3-tier aggregation in `apps/central-api`: Tier 1 (VAMNICOM/HQ), Tier 2 (5 RICMs), Tier 3 (14 ICMs + PACS) | M3 | ORIGINAL_REQUEST §3 |
| 12 | 20-Node National Institutes Seed Roster | Seed data expansion in `@sahakar/test-fixtures` covering 1 Apex, 5 RICMs, and 14 ICMs with geo coordinates and zones | M3 | ORIGINAL_REQUEST §3 |
| 13 | Federation Analytics Endpoint | `GET /api/v1/analytics/federation` in `apps/central-api` returning aggregated outreach across all 3 tiers | M3 | ORIGINAL_REQUEST §3 |
| 14 | Interactive National Federation Map/View | Vector/SVG national map and multi-tier hierarchy dashboard view in `apps/web-admin` | M3 | ORIGINAL_REQUEST §3 |
| 15 | Recruiter Application Status Workflow | `POST /api/v1/jobs/applications/:id/status` transitioning status across `SCHEDULED`, `OFFERED`, and `PLACED` | M4 | ORIGINAL_REQUEST §4 |
| 16 | Ed25519 Digital Offer Letter Issuance | `POST /api/v1/jobs/offers/issue` generating canonical offer payload signed with Ed25519 private key, signature hex, and verification URL | M4 | ORIGINAL_REQUEST §4 |
| 17 | Employer Recruiter View in Web Admin | Recruiter Kanban/pipeline view showing applicants, skill match breakdown, interview progression, and offer modal | M4 | ORIGINAL_REQUEST §4 |
| 18 | Automated Phase 9 E2E Test Suite | `scripts/test-phase9.ts` verifying all 4 workstreams with automated end-to-end assertions and tamper tests | M5 | ORIGINAL_REQUEST §Verification |
| 19 | Monorepo Test Suite Integration | Wiring `scripts/test-phase9.ts` into `scripts/run-all-tests.ts` as test suite 12 | M5 | ORIGINAL_REQUEST §Verification |
| 20 | Full Monorepo Typecheck, Build & Test | Verifying `pnpm run typecheck`, `pnpm -r run build`, and `pnpm test` pass 100% cleanly | M5 | ORIGINAL_REQUEST §Verification |
| 21 | Atomic Git Commits | Clean, atomic git commits per completed milestone adhering to Karpathy guidelines | M5 | ORIGINAL_REQUEST §Verification |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Hardware IoT Hub & Smart Card Reader | `packages/hardware-adapters`, `packages/types`, `packages/validation`, `apps/edge-server` | none | DONE |
| M2 | Oral Viva Assessment Player | `packages/types`, `packages/sync-protocol`, `packages/test-fixtures`, `apps/trainee-pwa` | none | DONE |
| M3 | National Multi-Tier Federation API | `packages/types`, `packages/test-fixtures`, `packages/db-central`, `apps/central-api`, `apps/web-admin` | none | DONE |
| M4 | Recruiter Pipeline & Digital Offer Letters | `packages/types`, `packages/validation`, `packages/db-central`, `packages/credential-core`, `apps/central-api`, `apps/web-admin` | none | DONE |
| M5 | E2E Test Suite & Monorepo Integration | `scripts/test-phase9.ts`, `scripts/run-all-tests.ts`, full verification & git commits | M1, M2, M3, M4 | DONE |

## Interface Contracts

### Hardware Adapters ↔ Edge Server (M1)
```ts
export interface RfidTapResult {
  cardUid: string;
  cardType: 'ISO_14443A' | 'KISAN_CREDIT_CARD';
  traineeId: string;
  traineeName: string;
  latencyMs: number;
  timestamp: string;
}

export interface RfidAttendanceProvider extends AttendanceProvider {
  tapCard(cardUid: string, sessionId?: string): Promise<RfidTapResult>;
}

// Edge Server Routes:
// GET /api/v1/hardware/status -> { cpuTempC: number, memoryUsageMb: number, sqliteJournalBytes: number, rfidReader: DeviceHealth, hotspot: HotspotStatus }
// POST /api/v1/attendance/rfid -> { cardUid: string, sessionId?: string, traineeId?: string } => { success: true, latencyMs: number, record: AttendanceRecord, event: SyncEvent }
```

### Trainee PWA ↔ Central API Sync Protocol (M2)
```ts
export interface OralAssessmentResult {
  assessmentId: string;
  traineeId: string;
  language: 'HI' | 'EN';
  questions: Array<{
    questionId: string;
    prompt: string;
    transcript: string;
    matchedKeywords: string[];
    missingKeywords: string[];
    score: number;
  }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

// Sync Event Type: 'ORAL_ASSESSMENT_SUBMITTED'
// Aggregate Type: 'ASSESSMENT'
// Hash: RFC 8785 Canonical JSON + SHA-256 digest
```

### Central API ↔ Web Admin Federation (M3)
```ts
export interface FederationTierRollup {
  tier: 1 | 2 | 3;
  name: string;
  institutesCount: number;
  institutes: Array<{ id: string; name: string; code: string; locationText: string; state: string; zone: string; lat: number; lng: number }>;
  totalTrainees: number;
  certifiedTrainees: number;
  activeBatches: number;
  attachedPacsCount: number;
  activeEdgeNodes: number;
}

export interface FederationAnalyticsResponse {
  summary: {
    totalInstitutes: number;
    totalTrainees: number;
    certifiedCount: number;
    certificationRate: number;
    totalAttachedPacs: number;
    totalEdgeNodes: number;
    generatedAt: string;
  };
  tiers: {
    tier1_apex: FederationTierRollup;
    tier2_regional: FederationTierRollup;
    tier3_local: FederationTierRollup;
  };
  geoNodes: Array<{ id: string; name: string; code: string; tier: number; state: string; zone: string; lat: number; lng: number; trainees: number; certified: number; pacs: number }>;
}
```

### Central API ↔ Web Admin Recruiter (M4)
```ts
export type JobApplicationStatus = 'APPLIED' | 'SCHEDULED' | 'OFFERED' | 'PLACED' | 'REJECTED';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  candidateId: string;
  candidateName: string;
  status: JobApplicationStatus;
  matchScore: number;
  interviewDate?: string;
  interviewVenue?: string;
  interviewNotes?: string;
  offerLetterId?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface DigitalOfferLetter {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  payload: {
    offerId: string;
    applicationId: string;
    jobId: string;
    jobTitle: string;
    employer: { id: string; name: string; authorizedSignatory: string };
    candidate: { id: string; name: string; emailOrPhone: string };
    designation: string;
    annualCompensationLPA: number;
    monthlyStipendOrSalary: number;
    joiningDate: string;
    postingLocation: string;
    terms: string[];
    issuedAt: string;
    schemaVersion: number;
  };
  signatureHex: string;
  issuerKeyId: string;
  verificationUrl: string;
  status: 'ISSUED' | 'ACCEPTED' | 'DECLINED' | 'REVOKED';
  issuedAt: string;
}
```

## Code Layout
- `packages/types/src/index.ts`: Extended enums (`AttendanceVerificationMethod.RFID`), types for `JobApplication`, `DigitalOfferLetter`, `OralAssessment`, and `FederationRollup`.
- `packages/validation/src/index.ts`: Zod schemas for RFID attendance, application status updates, offer letter issuance.
- `packages/hardware-adapters/src/`: `RfidSmartCardProvider` implementing ISO 14443A and Kisan Credit Card UIDs.
- `packages/test-fixtures/src/index.ts`: Full 20-node national institutes roster, oral viva cooperative accounting questions, demo KCC cards.
- `packages/sync-protocol/src/index.ts`: Support for `ORAL_ASSESSMENT_SUBMITTED` event type and browser-safe canonical hashing.
- `packages/credential-core/src/index.ts`: Ed25519 digital offer letter signing and verification helpers.
- `packages/db-central/src/index.ts`: Drizzle schema updates for `jobApplications` and `offerLetters`.
- `apps/edge-server/`:
  - `src/services/health-daemon.ts`: CPU temp, memory, and SQLite journal monitoring.
  - `scripts/edge-hotspot.sh`: Linux Wi-Fi AP configuration script.
  - `src/routes/hardware.routes.ts`: `GET /api/v1/hardware/status`.
  - `src/routes/attendance.routes.ts`: `POST /api/v1/attendance/rfid`.
- `apps/trainee-pwa/`:
  - `src/components/OralAssessmentModal.tsx`: Voice viva assessment UI.
  - `src/services/offline-store.ts`: `submitOralAssessment` method queueing canonical sync events.
- `apps/central-api/`:
  - `src/store/memory-store.ts`: Federation rollup calculations, job applications map, offer letters map.
  - `src/routes/institutes.routes.ts`: `GET /api/v1/analytics/federation`.
  - `src/routes/jobs.routes.ts`: `POST /api/v1/jobs/applications/:id/status`, `POST /api/v1/jobs/offers/issue`.
- `apps/web-admin/`:
  - `src/app/page.tsx`: National Federation interactive map view and Employer Recruiter Kanban/portal.
  - `src/services/api-client.ts`: API client bindings for federation analytics and recruiter endpoints.
- `scripts/`:
  - `scripts/test-phase9.ts`: Automated E2E verification test suite for Phase 9.
  - `scripts/run-all-tests.ts`: Orchestrated runner including `scripts/test-phase9.ts`.
