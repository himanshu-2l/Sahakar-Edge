# Problem-to-Solution Traceability Matrix

## Purpose

This file prevents feature drift. Every major subsystem must answer:

> **Which SIH requirement or research-backed failure does this solve,
> and how will we demonstrate it?**

## Architecture Principle

The project is an **integrated NCCT training and employment ecosystem
with a central web platform plus a local edge/offline execution layer**.

The edge node is not a replacement for the central platform. It exists
to keep selected training-centre functions usable when WAN connectivity
is unavailable.

------------------------------------------------------------------------

## 1. Official PS → Product Mapping

  ----------------------------------------------------------------------------------------------------------------------------
  Official SIH requirement          Problem addressed      Our subsystem     Surface        Demonstration
  --------------------------------- ---------------------- ----------------- -------------- ----------------------------------
  Online programme registration &   fragmented/manual      Programme &       Web/Admin      Admin creates programme and
  nomination                        enrolment              Nomination                       enrolls/nominates trainees
                                                           Management                       

  Participant/institution/trainee   inadequate trainee     Unified Profiles  Web + PWA +    Open trainee profile with
  profiles                          tracking                                 API            programme history

  Interactive multilingual          limited digital        LMS / Learning    PWA + Edge     Trainee opens local training
  e-learning                        learning access        Experience                       module

  Digital attendance via face       manual/unlinked        Attendance        Edge +         Record attendance while WAN is off
  recognition / QR                  attendance             Service + Adapter Hardware +     
                                                           Layer             Trainer UI     

  Timetable management              fragmented scheduling  Timetable         Web + PWA      Show trainee/trainer schedule

  Hostel management                 disconnected logistics Hostel/Resource   Web/Admin      Allocate/view hostel resource
                                                           Module                           

  Logistics management              inefficient programme  Logistics Module  Web/Admin      Show programme logistics record
                                    administration                                          

  LMS assessments                   paper/unstandardized   Assessment Engine PWA + Edge +   Complete quiz offline
                                    assessment workflow                      API            

  Certification                     completion not         Credential        API + PWA/Web  Issue credential after passing
                                    connected to digital   Pipeline                         
                                    record                                                  

  Skill certification repository    skills not visible     Credential &      Web + PWA      Show trainee verified skills
                                    after training         Skill Repository                 

  Certification verification        difficult/manual       Verification      Public/Web     Scan/open credential verification
                                    verification           Service                          

  Career counselling chatbot        weak post-training     Career Guidance   PWA/Web        Ask constrained career/course
                                    guidance               Interface                        question

  Employer/recruiter dashboard      poor employment        Employer Portal   Web            Employer creates/views opportunity
                                    linkage                                                 

  Mobile-friendly platform          rural users may        Trainee PWA       Mobile Web/PWA Install/open on phone
                                    primarily use phones                                    

  Offline-accessible learning       connectivity can       Edge LMS + Local  Edge + PWA     Disable WAN; lesson still opens
                                    interrupt access       PWA                              

  Centralized database              fragmented records     Central Data      Backend/DB     Synced records visible centrally
                                                           Platform                         

  Future outreach & monitoring      no unified             Analytics &       Web/Admin      Filter completed
                                    post-training          Outreach Data                    trainees/programmes
                                    visibility                                              

  Data analytics                    limited learning       Analytics         Web            Attendance/completion/assessment
                                    analytics              Dashboard                        metrics
  ----------------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 2. Current Failure → Engineering Response

### Failure A --- Fragmented workflow

**Current issue:** registration, attendance, learning, assessments,
certification, logistics and employment linkage can exist as
separate/manual workflows.

**Response:** One shared domain model connecting:

``` text
Trainee
→ Enrollment
→ Programme
→ Session
→ Attendance
→ Course Progress
→ Assessment
→ Skill Evidence
→ Credential
→ Opportunity
```

**Proof:** evaluator follows one trainee across the complete lifecycle.

------------------------------------------------------------------------

### Failure B --- Offline-accessible learning requirement

**Current issue:** a cloud-only design cannot provide the intended
offline-accessible experience during WAN loss.

**Response:** Local edge node hosts provisioned course content and local
APIs.

``` text
Trainee Phone
      ↓ local Wi-Fi
Edge Node
      ├── course content
      ├── attendance
      ├── progress
      ├── assessment
      └── local event journal
```

**Proof:** physically/simulated WAN OFF while local operations continue.

**Classification:** PS_REQUIRED + ENGINEERING_ENABLER.

------------------------------------------------------------------------

### Failure C --- Local activity must reach the central platform

**Current issue:** offline activity is useless if records are lost or
duplicated after reconnect.

**Response:** Event-first synchronization: - globally unique event IDs -
local event journal - queued status - idempotent central ingestion -
acknowledgement - retry/backoff - explicit conflict logging

**Proof:** create events offline, reconnect, show central update exactly
once.

**Classification:** ENGINEERING_ENABLER / RESEARCH_DIFFERENTIATOR.

------------------------------------------------------------------------

### Failure D --- Attendance is physically tied to the training venue

**PS requirement:** face recognition / QR attendance.

**Response:** Attendance adapter abstraction: - QR provider as reliable
MVP path - simulated provider for development - camera provider when
hardware is connected - manual override with audit reason

**Proof:** attendance recorded locally with method and audit metadata.

**Important:** Face recognition itself is not claimed as novel.

------------------------------------------------------------------------

### Failure E --- Training ends but skills need persistent visibility

**PS requirements:** certification repository, verification and
employment linkage.

**Response:**

``` text
Assessment
→ Completion
→ Skill Evidence
→ Credential
→ Skill Profile
→ Opportunity Matching
```

**Proof:** passing assessment creates evidence and credential;
employer/trainee can inspect matched skills.

------------------------------------------------------------------------

## 3. Research-Backed Differentiation Mapping

These are not all explicit SIH requirements. They are engineering
responses informed by research.

  ----------------------------------------------------------------------------
  Research-backed gap  Engineering         Status for        Claim discipline
                       response            prototype         
  -------------------- ------------------- ----------------- -----------------
  Rural/intermittent   local edge          MUST              demonstrate,
  connectivity         execution + delayed                   don't just claim
                       sync                                  

  Combined edge        health telemetry,   SHOULD            no heat
  workload can stress  active cooling,                       robustness claim
  SBC/storage          NVMe-ready design                     before testing

  Camera identity can  pluggable           COULD/Hardware    do not claim
  fail under difficult attendance                            RGB/NIR novelty
  conditions           providers; optional                   
                       RGB/NIR                               
                       experimentation                       

  Offline records can  idempotent event    MUST              validate with
  conflict/duplicate   synchronization +                     partition tests
                       conflict log                          

  Finite resource      keep critical       OPTIONAL          do not claim
  allocation is harder resource allocation EXPERIMENT        invented CRDT
  than append-only     conservative in                       principle
  events               MVP; experimental                     
                       rights/lease                          
                       mechanism only if                     
                       validated                             

  Static credentials   signed credential + SHOULD            signing/QR itself
  are difficult to     verification flow                     is not novel
  verify                                                     

  Generic skill models cooperative skill   SHOULD            dataset/domain
  may miss             taxonomy +                            mapping may be
  cooperative-domain   transparent                           contribution;
  vocabulary           matching                              validate

  Power/storage        transactional       SHOULD            demonstrate
  failures threaten    storage + recovery                    recovery
  local records        tests + UPS-ready                     
                       hardware                              
  ----------------------------------------------------------------------------

------------------------------------------------------------------------

## 4. Component Responsibility Map

### Central Web Platform

Owns: - institute management - programme management - master profiles -
course catalogue - analytics - employer portal - centralized
monitoring - issuer policy

### Trainee PWA

Owns: - learning UX - progress - assessments - credentials - skill
profile - opportunities - online/offline state

### Edge Node

Owns during local operation: - provisioned users - local course assets -
local attendance - local progress - local assessment submissions - event
journal - sync agent - node health

### Hardware Layer

Owns: - edge compute - local networking - optional camera/QR/NFC
interfaces - power/storage/cooling interfaces

### Central Backend

Owns: - API - RBAC - central persistence - sync ingestion - credential
service - analytics - opportunity matching

------------------------------------------------------------------------

## 5. Minimum SIH Demonstration Trace

The demo must tell one coherent story.

``` text
CENTRAL ADMIN
creates programme
      ↓
trainee + course provisioned to edge
      ↓
WAN DISCONNECTED
      ↓
trainee connects locally
      ↓
attendance recorded
      ↓
lesson opened
      ↓
assessment submitted
      ↓
events remain queued locally
      ↓
WAN RESTORED
      ↓
sync agent uploads events
      ↓
central dashboard updates
      ↓
completion / skill evidence
      ↓
credential
      ↓
verification + employment linkage
```

This sequence should drive both development priority and PPT
screenshots.

------------------------------------------------------------------------

## 6. Feature Priority

### P0 --- Must work before PPT/demo link

-   authentication/RBAC
-   programme management
-   trainee profiles
-   course/LMS
-   assessments
-   attendance
-   trainee PWA
-   edge local server
-   local event journal
-   reconnect synchronization
-   central dashboard

### P1 --- Strong SIH completeness

-   credential issuance
-   credential verification
-   skill repository
-   employer/recruiter dashboard
-   job/opportunity matching
-   multilingual UI baseline
-   timetable

### P2 --- Complete official administrative scope

-   nomination workflow refinement
-   hostel
-   logistics
-   outreach/monitoring
-   career counselling interface

### P3 --- Research/hardware enhancement

-   camera attendance
-   PAD experimentation
-   NIR hardware
-   hardware telemetry
-   power-loss tests
-   thermal tests
-   advanced conflict experiments

P0 must never be delayed by P3.

------------------------------------------------------------------------

## 7. Claims We Can Safely Make in the Prototype

If implemented and demonstrated: - offline-accessible local learning -
local event capture during WAN loss - synchronization after reconnect -
unified trainee lifecycle - digital credential verification -
explainable skill-to-opportunity mapping

## Claims Requiring Measurements Before Use

Do not present these as achieved until measured: - biometric accuracy -
spoof rejection rate - sub-200 ms verification - \>40°C reliability -
number of concurrent clients - zero data loss - exact BOM - storage
lifetime - percentage improvement over current NCCT workflow

------------------------------------------------------------------------

## 8. Definition of Done

A feature is done only if:

1.  it maps to this traceability document;
2.  UI exists where required;
3.  backend/domain behavior works;
4.  offline behavior is handled if relevant;
5.  role permissions are enforced;
6.  meaningful errors are shown;
7.  test coverage exists for critical logic;
8.  demo seed data exists;
9.  no unsupported claim is displayed.

------------------------------------------------------------------------

## 9. Coding-Agent Decision Rule

Whenever the coding agent considers adding or changing something, ask:

``` text
Is it explicitly required by PS 26087?
        │
       YES → implement according to priority
        │
        NO
        ↓
Does it enable reliability of a required feature?
        │
       YES → document engineering reason
        │
        NO
        ↓
Does it address a validated research gap?
        │
       YES → keep isolated and measurable
        │
        NO
        ↓
Do not add it to MVP.
```
