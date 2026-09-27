# SIH Problem Context --- PS 26087

## Source of Truth

This file captures the official SIH problem statement context for the
project. Product and engineering decisions should remain traceable to
these requirements.

## Official Problem Statement

  -----------------------------------------------------------------------
  Field                               Value
  ----------------------------------- -----------------------------------
  Problem Statement ID                **26087**

  Title                               **AI & LMS - Enabled Cooperative
                                      Capacity Building, ERP & Employment
                                      Ecosystem**

  Organization                        **Ministry of Cooperation**

  Department                          **National Council for Cooperative
                                      Training (NCCT)**

  Category                            **Hardware**

  Theme                               **Smart Education**

  Proposed Mode                       **Software + Hardware**
  -----------------------------------------------------------------------

## Background

NCCT, through VAMNICOM, RICMs and ICMs, conducts large-scale training
programmes for cooperative personnel, PACS members, SHGs, dairy
cooperatives, farmers and rural youth.

The official problem statement says trained rural youth can face
difficulty accessing: - employment opportunities, - entrepreneurship
support, - digital learning resources, - visibility of skill
certifications.

Existing systems are described as largely **manual or fragmented**,
causing: - duplication of effort, - inadequate trainee tracking, -
limited learning analytics, - poor employment linkage, - inefficient
programme administration.

## Exact Problem Being Asked

Develop an **integrated digital ecosystem for cooperative training
institutions** combining:

-   ERP-based training management,
-   e-learning,
-   data analytics,
-   skill development,
-   digital literacy,
-   employment exchange services,

for cooperative stakeholders and rural youth.

## Official Scope

The system should be a:

> **centralized, scalable and web-based digital platform capable of
> integrating all major training-management activities under NCCT
> institutions.**

The architecture may add an edge/offline layer, but it must still
satisfy this central platform requirement.

## Official Expected Solution Features

### Training administration

1.  Online programme registration and nomination management
2.  Participant, institution and trainee profile management
3.  Timetable management
4.  Hostel management
5.  Logistics management

### Learning

6.  Interactive multilingual e-learning modules
7.  LMS integration
8.  Assessments
9.  Certification
10. Mobile-friendly learning
11. Offline-accessible learning

### Attendance and identity

12. Digital attendance through **face recognition / QR code**

### Skills and credentials

13. Skill certification repository
14. Skill certification verification

### Career and employment

15. Career counselling chatbot
16. Employer and recruiter dashboard

### Data and monitoring

17. Centralized database for future programme outreach and monitoring
18. Data analytics

## Official Technology Components

The PS explicitly mentions: - Learning Management Systems (LMS) -
Cloud-Based ERP Platform - Data Analytics - Mobile Applications -
Multimedia & Interactive Learning Tools - Face Recognition / QR
Technologies

## Primary Users

### Direct

-   NCCT administrators
-   VAMNICOM / RICM / ICM administrators
-   trainers/faculty
-   cooperative personnel
-   PACS members/personnel
-   SHG stakeholders
-   dairy cooperative stakeholders
-   farmers
-   rural youth

### Employment side

-   employers
-   recruiters

## Core Product Journey

``` text
Programme Registration / Nomination
              ↓
        Trainee Profile
              ↓
       Training / LMS
              ↓
     Digital Attendance
              ↓
        Assessment
              ↓
        Certification
              ↓
      Verified Skill Record
              ↓
Career Guidance / Employment Exchange
              ↓
Future Outreach & Monitoring
```

## What the PS Does NOT Explicitly Require

Do not present the following as official SIH requirements unless
separately validated:

-   blockchain
-   CRDTs
-   NIR cameras
-   PIR sensors
-   Raspberry Pi specifically
-   a particular face-recognition model
-   a particular anti-spoofing algorithm
-   W3C Verifiable Credentials
-   Ed25519
-   a particular database
-   a particular cloud provider
-   an LLM
-   a specific job-matching algorithm

These are possible implementation choices, not requirements stated in
the PS.

## Research-Derived Context --- Separate From Official PS

Our research indicates that fragmented systems and intermittent rural
connectivity create an engineering opportunity for an offline-first edge
layer. Research also raises issues around field hardware reliability,
synchronization, identity verification, storage/power resilience,
credential verification and cooperative-specific skill representation.

These findings inform **how we engineer the system**, but they must not
be misrepresented as wording from the official PS.

## Project Interpretation

The project should therefore have two complementary layers:

### Central ecosystem

Provides: - administration, - consolidated data, - analytics, - central
course/programme management, - employer/recruiter services, -
monitoring.

### Local/edge ecosystem

Provides selected critical operations during connectivity loss: -
locally provisioned trainee access, - offline learning, - attendance, -
assessment/progress capture, - queued local events, - later
synchronization.

## Success Definition

The prototype succeeds when an evaluator can see that:

1.  the official NCCT lifecycle is covered end-to-end;
2.  the solution is more than a generic LMS;
3.  the hardware/edge component has a clear operational purpose;
4.  critical learning activity can continue offline;
5.  local records can later reach the central platform;
6.  skills/certifications remain visible and verifiable;
7.  employers/recruiters have a usable interface;
8.  every major feature maps back to an explicit PS requirement or a
    clearly labelled research-backed engineering response.

## Guardrail for Coding Agents

Before adding a feature, classify it as one of:

-   **PS_REQUIRED** --- explicitly requested by SIH;
-   **ENGINEERING_ENABLER** --- needed to make a PS requirement
    reliable;
-   **RESEARCH_DIFFERENTIATOR** --- addresses a research-backed gap;
-   **OPTIONAL** --- useful but not required.

Do not allow OPTIONAL features to delay PS_REQUIRED features.
