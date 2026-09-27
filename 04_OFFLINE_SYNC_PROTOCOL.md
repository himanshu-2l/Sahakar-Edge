# Offline-First and Synchronization Protocol

## Objective

The edge node must remain useful without WAN connectivity.

## Event-first model

Local mutations produce domain events.

Example:

``` json
{
  "id": "uuid",
  "nodeId": "uuid",
  "aggregateType": "ATTENDANCE",
  "aggregateId": "uuid",
  "eventType": "ATTENDANCE_RECORDED",
  "schemaVersion": 1,
  "occurredAt": "ISO-8601",
  "logicalSequence": 1042,
  "payload": {},
  "hash": "..."
}
```

## Local transaction rule

For every local action: 1. validate 2. write business state 3. append
event 4. commit atomically 5. UI confirms local success 6. sync happens
independently

Never block local success on cloud availability when the operation is
allowed offline.

## Sync handshake

1.  edge authenticates
2.  sends node metadata + last acknowledged sequence
3.  uploads batch of unsynced events
4.  central validates schema/auth
5.  central performs idempotent ingestion
6.  central returns accepted/rejected event IDs
7.  edge marks accepted events SYNCED
8.  edge receives allowed downstream deltas

## Conflict policy

Do not silently "last-write-wins" critical records.

Classes: - append-only evidence: merge - central-authoritative
catalogue: central wins; edge receives new version - manual profile
edits: conflict record if both changed - finite resources: MVP should
use server-authorized allocations when online; if implementing offline
capacity rights, treat it as experimental and document separately

## Demo network switch

Add an explicit demo control in development: -
`WAN_SIMULATION=online|offline|flaky` - UI banner must indicate
simulation - production mode must derive real connectivity state

## Sync dashboard

Show: - queued - syncing - synced - failed - last sync - bytes/events
transferred - conflict count

## Tests

-   duplicate upload
-   out-of-order events
-   retry after timeout
-   edge reboot with queued events
-   central restart
-   malformed event
-   schema mismatch
-   1000 queued events
-   simulated intermittent connectivity
