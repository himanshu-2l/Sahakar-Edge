# Deployment Plan

## Development

Use Docker Compose for: - PostgreSQL - central API - web admin

Run trainee PWA and edge server with local developer configuration.

## Public SIH demo

Deploy: - central web/admin - central API - PostgreSQL to a stable
hosting provider selected by the team.

Requirements: - HTTPS - environment secrets - seeded demo account -
health endpoint - no private keys committed to repository

## Edge deployment

Target Linux ARM64.

Provide: - install script - systemd service - local SQLite path - local
asset directory - environment file - backup/export command - health
command

Example services: - `sahakar-edge-api` - `sahakar-sync-agent`

## URLs

Prefer: - `app.<domain>` central portal - `verify.<domain>` credential
verification - local edge hostname such as `sahakar.local`

## CI

On pull request: - lint - typecheck - unit tests - build

On main: - build deployable artifacts - optional deploy

## Secrets

Never commit: - DB credentials - signing private keys - JWT secrets -
third-party credentials

Provide `.env.example`.
