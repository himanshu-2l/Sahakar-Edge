# Sahakar Edge --- Start Here

## Goal

Build a deployable SIH prototype for an **offline-first cooperative
training, administration, credential and employment ecosystem** backed
by a local edge node.

The prototype must prove one core idea:

> A training centre can continue core operations locally when WAN
> connectivity is unavailable, then safely synchronize with the central
> platform when connectivity returns.

## Product surfaces

1.  **Web Admin Portal** --- NCCT/institute administrators, trainers,
    employers.
2.  **Trainee PWA / Mobile App** --- learning, assessments, credentials,
    profile, opportunities.
3.  **Edge Node Service** --- local Wi-Fi-accessible LMS/ERP subset,
    event store, identity/attendance interface, sync agent.
4.  **Central Backend** --- identity, institutes, courses, events,
    credentials, jobs, analytics and synchronization.
5.  **Hardware Adapter Layer** --- camera/QR/NFC/edge-device interfaces.
    The application must run in simulation mode before physical hardware
    is connected.

## Demo story

1.  Admin creates programme and enrolls trainees.
2.  Edge node receives programme/course data.
3.  WAN is switched OFF.
4.  Trainee connects locally.
5.  Attendance is recorded locally.
6.  Course content and assessment work locally.
7.  Completion produces credential-ready evidence.
8.  Local events remain queued.
9.  WAN returns.
10. Events synchronize to central server.
11. Admin dashboard updates.
12. Trainee sees verified skill/credential and relevant opportunities.

## Engineering rules

-   Offline-first, not "online app with caching".
-   Never claim experimental accuracy that has not been measured.
-   Do not market RGB/NIR, face recognition, QR, CRDTs, digital
    credentials, or edge computing individually as novel.
-   Hardware integrations must be behind interfaces so simulation and
    real hardware can coexist.
-   No blockchain.
-   No unnecessary LLM dependency.
-   No fake AI percentages.
-   Privacy: store minimum biometric information; prefer
    embeddings/templates over raw images where the final hardware flow
    permits.
-   Build for demo reliability first, then optional enhancements.

## Recommended implementation order

1.  Monorepo + auth + roles.
2.  Core central data model.
3.  Admin portal.
4.  Trainee PWA.
5.  Edge local server + local database.
6.  Offline event journal.
7.  Sync protocol.
8.  Attendance adapter in simulation mode.
9.  Assessment → skill evidence → credential.
10. Employment opportunity matching baseline.
11. Hardware adapter.
12. Demo seed data + deployment + test scripts.

Read all MD files before writing production code.
