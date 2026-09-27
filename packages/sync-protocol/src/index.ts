import { createHash } from 'node:crypto';
import { SyncEvent, SyncStatus } from '@sahakar/types';

/**
 * Deterministically serialize an object to JSON with sorted keys.
 * Conforms to RFC 8785 canonical JSON principles.
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalJsonStringify(item)).join(',')}]`;
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${canonicalJsonStringify(val)}`;
  });

  return `{${pairs.join(',')}}`;
}

/**
 * Compute SHA-256 hash over an event payload for tamper evidence and duplicate detection.
 */
export function calculateEventHash(
  aggregateType: string,
  aggregateId: string,
  eventType: string,
  payload: Record<string, unknown>,
  logicalSequence: number
): string {
  const content = `${aggregateType}:${aggregateId}:${eventType}:${logicalSequence}:${canonicalJsonStringify(payload)}`;
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Verifies if an event's hash matches its payload and metadata.
 */
export function verifyEventHash(event: SyncEvent): boolean {
  const expectedHash = calculateEventHash(
    event.aggregateType,
    event.aggregateId,
    event.eventType,
    event.payload as Record<string, unknown>,
    event.logicalSequence
  );
  return event.hash === expectedHash;
}

/**
 * Factory helper to construct a valid SyncEvent ready for local queueing.
 */
export function createSyncEvent<T extends Record<string, unknown>>(params: {
  id: string;
  nodeId: string;
  aggregateType: SyncEvent['aggregateType'];
  aggregateId: string;
  eventType: string;
  payload: T;
  logicalSequence: number;
  occurredAt?: string;
  schemaVersion?: number;
}): SyncEvent<T> {
  const occurredAt = params.occurredAt || new Date().toISOString();
  const schemaVersion = params.schemaVersion || 1;
  const hash = calculateEventHash(
    params.aggregateType,
    params.aggregateId,
    params.eventType,
    params.payload,
    params.logicalSequence
  );

  return {
    id: params.id,
    nodeId: params.nodeId,
    aggregateType: params.aggregateType,
    aggregateId: params.aggregateId,
    eventType: params.eventType,
    payload: params.payload,
    schemaVersion,
    occurredAt,
    logicalSequence: params.logicalSequence,
    hash,
    syncStatus: SyncStatus.QUEUED,
    retryCount: 0,
  };
}

/**
 * Response structure returned by Central API during batch sync ingestion.
 */
export interface SyncBatchResponse {
  accepted: string[]; // event IDs accepted and ingested
  rejected: Array<{
    eventId: string;
    reason: string;
  }>;
  centralSequence: number;
  timestamp: string;
}

/**
 * Conflict classification categories defined in 04_OFFLINE_SYNC_PROTOCOL.md
 */
export enum ConflictStrategy {
  APPEND_MERGE = 'APPEND_MERGE', // Additive facts (attendance, assessment submission)
  CENTRAL_WINS = 'CENTRAL_WINS', // Official catalogue (course updates, batch changes)
  MANUAL_AUDIT = 'MANUAL_AUDIT', // Overrides recorded with actor + reason
}

export function getConflictStrategyForAggregate(
  aggregateType: SyncEvent['aggregateType']
): ConflictStrategy {
  switch (aggregateType) {
    case 'ATTENDANCE':
    case 'PROGRESS':
    case 'ASSESSMENT':
      return ConflictStrategy.APPEND_MERGE;
    case 'SESSION':
    case 'NODE_HEALTH':
    default:
      return ConflictStrategy.CENTRAL_WINS;
  }
}
