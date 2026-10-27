import { SyncEvent, SyncStatus } from '@sahakar/types';

/**
 * Right rotate a 32-bit integer by b bits.
 */
function rotr32(n: number, b: number): number {
  return (n >>> b) | (n << (32 - b));
}

/**
 * FIPS 180-4 compliant pure TypeScript SHA-256 implementation.
 * Zero external dependencies; runs identically in Node, Browser, Web Worker, and Edge.
 */
export function sha256Hex(ascii: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const encoder = new TextEncoder();
  const bytes = encoder.encode(ascii);
  const l = bytes.length * 8;
  const k = (448 - ((l + 8) % 512) + 512) % 512;
  const totalLen = (l + 8 + k + 64) / 8;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(totalLen - 8, BigInt(l));

  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const W = new Uint32Array(64);

  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(i + t * 4);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr32(W[t - 15], 7) ^ rotr32(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rotr32(W[t - 2], 17) ^ rotr32(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) | 0;
      const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

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
  return sha256Hex(content);
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
