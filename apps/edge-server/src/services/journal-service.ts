import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { calculateEventHash, canonicalJsonStringify } from '@sahakar/sync-protocol';
import type { SyncEvent } from '@sahakar/types';
import { SyncStatus } from '@sahakar/types';

export interface AppendEventParams<T extends Record<string, unknown>> {
  aggregateType: SyncEvent['aggregateType'];
  aggregateId: string;
  eventType: string;
  payload: T;
  nodeId?: string;
  schemaVersion?: number;
  operationalCallback?: (db: DatabaseSync) => void;
}

export class EdgeJournalService {
  private db: DatabaseSync;
  private nodeId: string;

  constructor(db: DatabaseSync, nodeId = 'edge-node-ricm-bhopal-01') {
    this.db = db;
    this.nodeId = nodeId;
  }

  /**
   * Returns current maximum logical sequence recorded in SQLite.
   * Ensures sequence monotonicity survives node restart.
   */
  public getNextLogicalSequence(): number {
    const row = this.db
      .prepare('SELECT COALESCE(MAX(logical_sequence), 0) as max_seq FROM local_event_journal')
      .get() as { max_seq: number };
    return (row?.max_seq || 0) + 1;
  }

  /**
   * Local Transaction Rule (04_OFFLINE_SYNC_PROTOCOL.md):
   * 1. Validate
   * 2. Write business state
   * 3. Append event
   * 4. Commit atomically
   */
  public appendEventInTransaction<T extends Record<string, unknown>>(
    params: AppendEventParams<T>
  ): SyncEvent<T> {
    const eventId = randomUUID();
    const nodeId = params.nodeId || this.nodeId;
    const logicalSequence = this.getNextLogicalSequence();
    const occurredAt = new Date().toISOString();
    const schemaVersion = params.schemaVersion || 1;

    // Deterministic canonical SHA-256 hash
    const hash = calculateEventHash(
      params.aggregateType,
      params.aggregateId,
      params.eventType,
      params.payload,
      logicalSequence
    );

    this.db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Operational business write
      if (params.operationalCallback) {
        params.operationalCallback(this.db);
      }

      // 2. Append to local_event_journal
      this.db
        .prepare(`
          INSERT INTO local_event_journal (
            id, node_id, aggregate_type, aggregate_id, event_type,
            payload_json, schema_version, occurred_at, logical_sequence,
            hash, sync_status, retry_count, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', 0, ?)
        `)
        .run(
          eventId,
          nodeId,
          params.aggregateType,
          params.aggregateId,
          params.eventType,
          canonicalJsonStringify(params.payload),
          schemaVersion,
          occurredAt,
          logicalSequence,
          hash,
          occurredAt
        );

      // 3. Update edge node sequence tracker
      this.db
        .prepare(`
          UPDATE edge_node_state
          SET last_logical_sequence = ?, updated_at = ?
          WHERE node_id = ?
        `)
        .run(logicalSequence, occurredAt, nodeId);

      this.db.exec('COMMIT;');

      return {
        id: eventId,
        nodeId,
        aggregateType: params.aggregateType,
        aggregateId: params.aggregateId,
        eventType: params.eventType,
        payload: params.payload,
        schemaVersion,
        occurredAt,
        logicalSequence,
        hash,
        syncStatus: SyncStatus.QUEUED,
        retryCount: 0,
      };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Ingest an event from a local client (PWA, terminal) with deduplication (idempotent).
   */
  public ingestClientEvent(event: SyncEvent): void {
    const existing = this.db
      .prepare('SELECT id FROM local_event_journal WHERE id = ?')
      .get(event.id);
    if (existing) {
      return; // Idempotent deduplication
    }

    const logicalSequence = this.getNextLogicalSequence();
    const occurredAt = event.occurredAt || new Date().toISOString();
    const hash =
      event.hash ||
      calculateEventHash(
        event.aggregateType,
        event.aggregateId,
        event.eventType,
        event.payload,
        logicalSequence
      );

    this.db
      .prepare(`
        INSERT INTO local_event_journal (
          id, node_id, aggregate_type, aggregate_id, event_type,
          payload_json, schema_version, occurred_at, logical_sequence,
          hash, sync_status, retry_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', 0, ?)
      `)
      .run(
        event.id,
        event.nodeId || this.nodeId,
        event.aggregateType,
        event.aggregateId,
        event.eventType,
        canonicalJsonStringify(event.payload),
        event.schemaVersion || 1,
        occurredAt,
        logicalSequence,
        hash,
        occurredAt
      );

    this.db
      .prepare(`
        UPDATE edge_node_state
        SET last_logical_sequence = ?, updated_at = ?
        WHERE node_id = ?
      `)
      .run(logicalSequence, occurredAt, this.nodeId);
  }

  /**
   * Retrieves pending events waiting for WAN sync upload.
   */
  public getQueuedEvents(limit = 100): SyncEvent[] {
    const rows = this.db
      .prepare(`
        SELECT * FROM local_event_journal
        WHERE sync_status IN ('QUEUED', 'LOCAL')
        ORDER BY logical_sequence ASC
        LIMIT ?
      `)
      .all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      nodeId: r.node_id,
      aggregateType: r.aggregate_type,
      aggregateId: r.aggregate_id,
      eventType: r.event_type,
      payload: JSON.parse(r.payload_json),
      schemaVersion: r.schema_version,
      occurredAt: r.occurred_at,
      logicalSequence: r.logical_sequence,
      hash: r.hash,
      syncStatus: r.sync_status as SyncStatus,
      retryCount: r.retry_count,
    }));
  }

  /**
   * Acknowledges successfully synced events.
   */
  public markEventsSynced(eventIds: string[], centralSequence?: number): void {
    if (eventIds.length === 0) return;

    this.db.exec('BEGIN TRANSACTION;');
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(`
        UPDATE local_event_journal
        SET sync_status = 'SYNCED', last_error = NULL
        WHERE id = ?
      `);

      for (const id of eventIds) {
        stmt.run(id);
      }

      if (centralSequence !== undefined) {
        this.db
          .prepare(`
            UPDATE edge_node_state
            SET last_central_sequence = ?, last_sync_at = ?, updated_at = ?
            WHERE node_id = ?
          `)
          .run(centralSequence, now, now, this.nodeId);
      } else {
        this.db
          .prepare(`
            UPDATE edge_node_state
            SET last_sync_at = ?, updated_at = ?
            WHERE node_id = ?
          `)
          .run(now, now, this.nodeId);
      }

      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Returns complete journal history for auditing.
   */
  public getJournalHistory(limit = 50): any[] {
    return this.db
      .prepare(`
        SELECT id, aggregate_type, aggregate_id, event_type, logical_sequence,
               hash, sync_status, retry_count, occurred_at
        FROM local_event_journal
        ORDER BY logical_sequence DESC
        LIMIT ?
      `)
      .all(limit);
  }

  /**
   * Aggregated queue statistics.
   */
  public getStats(): {
    queuedCount: number;
    syncedCount: number;
    failedCount: number;
    totalCount: number;
    lastLogicalSequence: number;
    lastSyncAt: string | null;
  } {
    const counts = this.db
      .prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN sync_status IN ('QUEUED', 'LOCAL') THEN 1 ELSE 0 END) as queued,
          SUM(CASE WHEN sync_status = 'SYNCED' THEN 1 ELSE 0 END) as synced,
          SUM(CASE WHEN sync_status = 'FAILED' THEN 1 ELSE 0 END) as failed
        FROM local_event_journal
      `)
      .get() as any;

    const state = this.db
      .prepare(`
        SELECT last_logical_sequence, last_sync_at
        FROM edge_node_state
        WHERE node_id = ?
      `)
      .get(this.nodeId) as any;

    return {
      queuedCount: counts?.queued || 0,
      syncedCount: counts?.synced || 0,
      failedCount: counts?.failed || 0,
      totalCount: counts?.total || 0,
      lastLogicalSequence: state?.last_logical_sequence || 0,
      lastSyncAt: state?.last_sync_at || null,
    };
  }
}
