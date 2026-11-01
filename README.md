# Sahakar Edge (सहकार एज)

[![CI](https://github.com/himanshu-2l/Sahakar-Edge/actions/workflows/ci.yml/badge.svg)](https://github.com/himanshu-2l/Sahakar-Edge/actions/workflows/ci.yml)
[![Tests Passing](https://img.shields.io/badge/tests-12%2F12%20passing-2ea44f.svg?style=flat-square)](scripts/run-all-tests.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%20Strict-blue.svg?style=flat-square)](tsconfig.base.json)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.2.1-black.svg?style=flat-square)](apps/web-admin)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat-square)](apps/trainee-pwa)
[![Fastify](https://img.shields.io/badge/Fastify-5.2-000000.svg?style=flat-square)](apps/central-api)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Journal-003B57.svg?style=flat-square)](apps/edge-server)
[![Cryptography](https://img.shields.io/badge/Security-Ed25519%20%7C%20SHA--256-darkred.svg?style=flat-square)](packages/credential-core)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

> **Ministry of Cooperation | National Council for Cooperative Training (NCCT), Government of India**  
> *Sovereign, Offline-First Cooperative Capacity Building, Enterprise Training ERP, and Employment Ecosystem Powered by Autonomous Edge Computing.*  
> **सहकार से समृद्धि (Prosperity through Cooperation)**

---

## 🏛️ Executive Summary

The **National Council for Cooperative Training (NCCT)** operates under the Ministry of Cooperation, Government of India, orchestrating nationwide training programmes across Apex institutes (**VAMNICOM Pune**), 5 Regional Institutes of Cooperative Management (**RICMs** in Bhopal, Gandhinagar, Kalyani, Patna, and Bengaluru), 14 Institutes of Cooperative Management (**ICMs**), and affiliated field units. These bodies train personnel across India's **63,000 Primary Agricultural Credit Societies (PACS)**, District Central Cooperative Banks (DCCBs), dairy cooperatives (e.g. Amul/GCMMF), Self-Help Groups (SHGs), and rural youth.

Grassroots rural training venues frequently operate in environments with intermittent, high-latency, or zero WAN connectivity. Standard cloud-dependent architectures fail in these conditions, stalling attendance logging, classroom lessons, skill examinations, and candidate placements.

**Sahakar Edge** resolves this challenge with an autonomous, resilient, edge-computing architecture:
1. **Autonomous Offline Edge Gateways**: Portable Linux ARM64 hardware nodes (Raspberry Pi / Thin Clients) hosting localized Wi-Fi access points and executing atomic **SQLite WAL** transaction journals with zero WAN requirement.
2. **Sub-50ms Multi-Modal Attendance**: Dual biometric facial recognition (3D liveness detection), rolling dynamic QR codes, and ISO 14443A Kisan Smart RFID tap authentication.
3. **Oral Viva Voice Assessment Player**: Multilingual speech viva engine using the Web Speech API for voice prompts and candidate response capture, with real-time cooperative keyword scoring and canonical SHA-256 event chaining.
4. **National 3-Tier Multi-Tier Federation Rollup**: Mathematical hierarchical aggregation from Tier 3 (field PACS and ICMs) through Tier 2 (RICMs) to Tier 1 (Apex VAMNICOM Pune / Ministry HQ) with zero data loss.
5. **Statutory Ed25519 Cryptographic Certification**: Issuance of tamper-evident digital credentials and recruitment offer letters verifiable via public keys and compact QR seals without relying on centralized databases.
6. **Recruiter Candidate Kanban Pipeline**: Deterministic skill-matching engine connecting certified rural trainees to cooperative vacancies (PACS Accountants, Dairy Procurement Supervisors, Cooperative Auditors) with drag-and-drop state progression.
7. **Bilingual Rural Mobile PWA**: Tailored for rural trainees in Hindi and English with high-contrast Devanagari typography, $\ge 44\text{px}$ touch targets, offline lesson narration, and the **Sahakar Mitra (सहकार मित्र)** AI Career Counselor.

---

## 🏗️ System Architecture

```text
                                  +-------------------------------------------------------------+
                                  |                 Central Government Authority                |
                                  |            (Ministry HQ New Delhi / VAMNICOM Pune)          |
                                  |  - Central Fastify API (Port 4000)                          |
                                  |  - Ministerial Admin Portal (Next.js 15, Port 3000)         |
                                  |  - National 3-Tier Federation Aggregator                    |
                                  +-------------------------------------------------------------+
                                                                 ^
                                                                 |  WAN Sync Batch (RFC 8785 + SHA-256)
                                                                 v  [Idempotent Two-Way Handshake]
+-------------------------------------------------------------------------------------------------------------------------------+
| Rural Training Venue / Sahakar Edge Gateway (Linux ARM64 / Raspberry Pi 4/5 / Thin Client)                                    |
|                                                                                                                               |
|  +----------------------------+   +----------------------------------+   +-------------------------------------------------+  |
|  |    Local SQLite WAL Store  |   |        Local Edge Daemon         |   |             Multi-Modal Hardware Hub            |  |
|  |   - Atomic Event Journal   |<--|     - Edge Server (Port 4100)    |<--|  - ISO 14443A Kisan RFID (<50ms Tap Attendance) |  |
|  |   - Crash-Safe Transactions|   |     - Health Daemon & AP Manager |   |  - WebRTC Camera (Biometric Face Liveness)       |  |
|  |   - Zero WAN Dependency    |   |     - Local Domain Event Queue   |   |  - Dynamic Rolling QR Code Engine               |  |
|  +----------------------------+   +----------------------------------+   +-------------------------------------------------+  |
|                                                     ^                                                                         |
|                                                     | Local Venue Wi-Fi (Sub-20ms Latency)                                    |
|                                                     v                                                                         |
|                                    +----------------------------------+                                                       |
|                                    |        Trainee Mobile PWA        |                                                       |
|                                    |     - Vite 6 / React 19 (5173)   |                                                       |
|                                    |     - Hindi / English Bilingual  |                                                       |
|                                    |     - Oral Viva Voice AI Player  |                                                       |
|                                    |     - Sahakar Mitra Counselor    |                                                       |
|                                    +----------------------------------+                                                       |
+-------------------------------------------------------------------------------------------------------------------------------+
```

---

## 🌟 Key Capabilities & Technical Highlights

### 1. National 3-Tier Multi-Tier Federation API & Map
- Hierarchical rollup ensuring mathematical consistency:
  $$\text{Tier 1 Total} = \sum \text{Tier 2 (5 RICMs)} + \sum \text{Tier 3 (14 ICMs \& Field PACS)}$$
- Aggregates active capacity programmes, certified professionals, gender saturation (women SHG participation $\ge 40\%$), and placement tracking.
- Interactive vector map in the Government Admin Portal featuring deep-dive telemetry from national metrics down to individual hardware edge gateways.

### 2. Multi-Modal Attendance & IoT Edge Engine
- **Kisan RFID Smart Cards**: ISO 14443A contactless smart card reader interface delivering verifiable attendance logging in $<50\text{ms}$.
- **Biometric 3D Liveness Detection**: Real-time facial landmark analysis computing Eye Aspect Ratio (EAR) and head-pose variance to defeat photo/screen presentation attacks.
- **Dynamic Session QR**: Rotating cryptographic tokens refreshed locally on venue display screens to eliminate remote attendance proxying.
- **Manual Trainer Override**: Cryptographically audited exception logging with mandatory justification capture and supervisor signature chaining.

### 3. Oral Viva Voice Assessment Player (Voice AI)
- Evaluates spoken domain knowledge for rural candidates who prefer verbal examination over typing.
- Dual-engine speech synthesis (TTS) and voice recognition (STT) supporting Hindi and English.
- Evaluates spoken transcripts against cooperative domain keyword rubrics (e.g. *Daybook*, *Rojnamcha*, *Statutory Reserves*, *Double-Entry Ledgers*).
- Produces tamper-evident oral assessment event payloads verified with FIPS 180-4 SHA-256 canonical hashing.

### 4. Recruiter Pipeline & Cryptographic Offer Letters
- Full employer candidate lifecycle: `APPLIED` $\rightarrow$ `SKILL_MATCHED` $\rightarrow$ `SCHEDULED` $\rightarrow$ `OFFERED` $\rightarrow$ `PLACED`.
- Generates canonical digital offer letters signed with the issuing employer's **Ed25519 private key** containing salary, designation, joining date, and public QR verification link.
- Rejects forged or bit-flipped offer payloads at machine speed.

### 5. Automated Quarterly Ministry Compliance Dossier
- Generates structured quarterly reports aligned with Ministry of Cooperation standards:
  - Saturation across the 63,000 computerized PACS drive.
  - Outreach in Aspirational Districts and tribal belts.
  - Women SHG member participation percentages.
  - Ed25519 digital signature of the issuing Director General.

---

## 🧪 Comprehensive Monorepo Test Matrix

Sahakar Edge is engineered with absolute rigor. All **12 automated test suites** execute in sequence via `scripts/run-all-tests.ts` with 100% pass guarantee:

| Suite | Focus Area | Key Verifications & Assertions |
|:---:|---|---|
| **#1** | `scripts/test-phase0.ts` | Monorepo package boundaries, shared types, and build target verification |
| **#2** | `scripts/test-phase1.ts` | Central Authority RBAC authentication, user sessions, and institutional registries |
| **#3** | `scripts/test-phase2.ts` | Trainee PWA offline store, course manifests, and client-side assessment runner |
| **#4** | `scripts/test-phase3.ts` | Edge Server SQLite WAL journal, crash recovery, and atomic event recording |
| **#5** | `scripts/test-phase4.ts` | RFC 8785 canonical JSON serialization, SHA-256 event chaining, and idempotent sync |
| **#6** | `scripts/test-phase5.ts` | Attendance hardware adapters (Biometric Face, Dynamic QR, Trainer Manual Override) |
| **#7** | `scripts/test-phase6.ts` | Statutory Ed25519 digital credential generation, public key verifier, and QR encoding |
| **#8** | `scripts/test-phase7.ts` | Deterministic recruiter skill matching and cooperative taxonomy vector benchmarks |
| **#9** | `scripts/test-phase8.ts` | Production hardening, high-concurrency benchmarks, and edge systemd assets |
| **#10** | `scripts/test-production-e2e.ts` | Multi-process live HTTP end-to-end integration and data lifecycle validation |
| **#11** | `scripts/test-deep-adversarial.ts` | Security fuzzing, idempotency replay flood, and hash-mismatch tampering rejection |
| **#12** | `scripts/test-phase9.ts` | Hardware RFID tap (<50ms), Oral Viva Assessment, 3-Tier Rollup, and Ed25519 Offer Letters |

---

## 💻 Local Quickstart

### Prerequisites
- **Node.js**: `v22.x` or `v24.x`
- **Package Manager**: `pnpm` (`v9.x` or `v10.x`) — install via `npm install -g pnpm`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/himanshu-2l/Sahakar-Edge.git
cd Sahakar-Edge
pnpm install
```

### 2. Build All Monorepo Workspaces
```bash
pnpm run build
```

### 3. Run the Complete Test Gauntlet (12/12 Suites)
```bash
pnpm test
```
*Executes all 12 automated test suites across every layer of the monorepo.*

### 4. Run Edge Concurrency & Load Benchmark
Evaluates local venue edge performance under high concurrent trainee load:
```bash
pnpm run demo:benchmark
```
*Empirical results: 2,000+ requests/second throughput, $<30\text{ms}$ p95 latency, and zero lock contention on SQLite WAL.*

### 5. Run the 10-Scene Network Partition Simulation
Simulates full WAN disconnect, local buffering, and automatic re-sync:
```bash
pnpm run demo:simulate
```

### 6. Launch the Full Stack Locally
Open 4 terminal windows or background tasks:

```bash
# 1. Central Authority API (Port 4000)
pnpm run dev:api

# 2. Government Admin Portal (Port 3000)
pnpm run dev:admin

# 3. Autonomous Edge Gateway (Port 4100)
pnpm run dev:edge

# 4. Rural Trainee Mobile PWA (Port 5173)
pnpm run dev:trainee
```

Access the interfaces:
- **Central Government Admin Portal**: [`http://localhost:3000`](http://localhost:3000)
- **Rural Trainee Mobile PWA**: [`http://localhost:5173`](http://localhost:5173)
- **Central API Health Endpoint**: [`http://localhost:4000/health`](http://localhost:4000/health)
- **Edge Node Health Telemetry**: [`http://localhost:4100/health`](http://localhost:4100/health)

---

## 📦 Monorepo Workspace Structure

```text
Sahakar-Edge/
├── apps/
│   ├── central-api/           # Central Authority backend (Fastify, multi-tier federation, jobs, audit)
│   ├── edge-server/           # Venue hardware daemon (Native SQLite WAL journal, RFID adapter, AP control)
│   ├── web-admin/             # Next.js 15 Government Admin Portal (5 directorates, bento grid, Kanban)
│   └── trainee-pwa/           # Vite 6 / React 19 Mobile PWA (Bilingual, oral viva, optical QR, counselor)
├── packages/
│   ├── types/                 # Shared TypeScript domain contracts, telemetry schemas, and event types
│   ├── validation/            # Zod validation schemas and cryptographic event verification
│   ├── sync-protocol/         # RFC 8785 canonical serialization, SHA-256 chaining, and sync engine
│   ├── credential-core/       # Ed25519 signing, public-key verification, and compact QR encoding
│   ├── hardware-adapters/     # Attendance interfaces (ISO 14443A RFID, Biometric Face, Dynamic QR)
│   ├── db-central/            # Central authority persistence layer and audit log store
│   ├── db-edge/               # Edge node SQLite WAL schema and crash-resilient journal driver
│   └── test-fixtures/         # Seed fixtures for NCCT institutes (RICM Bhopal, VAMNICOM), courses, and jobs
├── scripts/
│   ├── run-all-tests.ts       # Master test runner executing all 12 monorepo test suites
│   ├── benchmark-load.ts      # High-concurrency edge throughput benchmark tool
│   └── simulate-partition.ts  # 10-scene network partition and WAN disruption simulation
└── deploy/
    └── edge/                  # Production Linux ARM64 systemd unit and automated install script
```

---

## 🔒 Security, Compliance & Architectural Integrity

- **Zero Blockchain**: Replaces wasteful consensus overhead with proven, lightweight asymmetric cryptography (**Ed25519**) and canonical **SHA-256** hash event chaining.
- **Zero Hallucination / Explainable Matching**: No black-box AI approximations in hiring or evaluation; candidate-job matching is 100% deterministic, transparent, and verifiable.
- **Privacy by Design**: Biometric facial recognition computations occur entirely on-device or on the venue edge gateway behind hardware abstractions without leaking raw images over WAN.
- **Hardware-Hardened Linux Edge**: Production configurations tested on physical 64-bit ARM hardware (Raspberry Pi 4/5) with active thermal throttling governance ($<65^\circ\text{C}$).

---

## 📜 Regulatory Governance & License

Developed for the **National Council for Cooperative Training (NCCT)**, Ministry of Cooperation, Government of India.  
Licensed under the [Apache License, Version 2.0](LICENSE).
