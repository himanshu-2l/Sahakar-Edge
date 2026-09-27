# Starter Prompt for Codex

You are the lead engineer for **Sahakar Edge**, an SIH hardware +
software prototype.

The current folder contains the complete product and engineering
specification in Markdown files.

## First action

Read **every `.md` file in this folder before writing code**.

Treat these documents as the source of truth. Do not silently redesign
the product. If documents conflict, stop and report the conflict with
file names and the smallest reasonable resolution.

## Goal

Build a production-quality SIH prototype demonstrating an
**offline-first cooperative training ecosystem backed by a local edge
node**.

The critical demo is:

**Provision online → disconnect WAN → attendance + learning + assessment
continue locally → events queue locally → reconnect → idempotent central
synchronization → credential/skill record becomes visible centrally.**

## Important constraints

-   Do not add blockchain.
-   Do not add random AI features.
-   Do not require a paid external API for the critical demo.
-   Do not claim unmeasured biometric/performance numbers.
-   Hardware integrations must use adapters and have simulation/fallback
    modes.
-   Build the PWA before considering separate native mobile apps.
-   Critical offline actions must never wait for cloud availability.
-   Use an event-first synchronization model.
-   Keep all manual attendance overrides auditable.
-   Keep job matching explainable.
-   Prefer NVMe-ready edge architecture and expose node health.
-   Never commit secrets.

## What I want from you BEFORE implementation

Return only: 1. concise understanding of the product 2. assumptions 3.
proposed exact technology stack with reasons 4. final monorepo directory
tree 5. database/edge-storage plan 6. sync design summary 7.
implementation phases with acceptance criteria 8. biggest technical
risks 9. questions/blockers that truly prevent coding

Do not generate application code in this first response.

After I approve the plan, start with **Phase 0**, keep the repository
runnable, and work phase-by-phase. At the end of every phase: - run
lint - run typecheck - run tests - run build - report changed files -
report commands used - report remaining issues

Use the Markdown specs rather than inventing features.
