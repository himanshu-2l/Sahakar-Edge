# Edge Hardware & Device Integration

## MVP hardware concept

A portable Linux edge node deployed at a training venue.

### Baseline

-   Raspberry Pi 5 / comparable ARM SBC
-   active cooling
-   NVMe or high-endurance storage; prefer NVMe for serious demo
-   Wi-Fi / Ethernet
-   stable PSU
-   optional UPS/power-loss protection
-   camera/QR/NFC depending on demo
-   status indicator/display optional

## Attendance architecture

The software must not assume that final biometric hardware is already
validated.

### Phase 1 --- Simulation

Use seeded trainee identities and simulated successful/failed evidence.

### Phase 2 --- QR

Implement local session QR as a reliable demo fallback.

### Phase 3 --- Camera adapter

If hardware is available, implement capture and local identity/PAD
experimentation behind adapter.

## Proposed experimental camera path

Where tested: - RGB camera - NIR-capable camera - controlled NIR
illumination - optional PIR trigger

These are engineering candidates, not novelty claims.

## Device health

Collect: - CPU temperature - CPU load - memory - disk usage - uptime -
network state - app version - last sync

Expose `/health` locally and centrally.

## Thermal behavior

Implement: - warning threshold - critical threshold - UI health
warning - log throttling state if readable - do not claim \>40°C
robustness without test evidence

## Power loss

-   transactional local writes
-   WAL/appropriate SQLite settings
-   graceful shutdown where UPS integration supports it
-   recovery test script

## Privacy

-   raw face image storage disabled by default
-   if biometric prototype uses embeddings/templates, encrypt at rest
-   enrollment requires explicit consent field
-   manual/QR fallback must exist for demo

## Hardware demo requirement

The prototype should visibly prove that the edge node is not
decorative: - disconnect WAN - local PWA still works - local event
recorded - reconnect WAN - event appears centrally
