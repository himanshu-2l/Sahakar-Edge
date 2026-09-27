# Coding Agent Rules

## Before coding

Read every markdown file in this folder.

Then produce: 1. assumptions 2. final chosen stack 3. repository tree 4.
phased task list 5. risks/blockers

Do not start by generating dozens of pages.

## Development behavior

-   Implement vertical slices.
-   Keep app runnable after each phase.
-   Prefer boring, reliable libraries.
-   Avoid premature microservices.
-   Use strict TypeScript.
-   Add migrations.
-   Add seed data.
-   Add tests with each domain.
-   Maintain README and API docs.

## Architecture discipline

-   central and edge responsibilities must remain separate
-   no cloud dependency in critical offline flow
-   hardware behind adapters
-   sync operations idempotent
-   all important manual overrides audited
-   credentials immutable after issue
-   job matching explainable

## UI discipline

-   professional government/engineering visual language
-   responsive
-   no excessive animations
-   no fake charts
-   no placeholder lorem ipsum in final demo
-   all dashboards driven by seed/database data

## Claim discipline

Do not put these in UI unless measured: - 98% accuracy - \<200 ms - 40+
clients - zero conflicts - zero data loss - \>40°C robustness

## Git discipline

Suggested commits: - chore: bootstrap monorepo - feat: auth and rbac -
feat: programme domain - feat: trainee pwa - feat: edge event journal -
feat: synchronization - feat: attendance adapters - feat: credential
pipeline - feat: skills and jobs - test: offline demo scenario - docs:
deployment and demo
