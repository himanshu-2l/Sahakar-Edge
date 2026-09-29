import { EdgeJournalService } from './journal-service.js';
import type { SyncBatchResponse } from '@sahakar/sync-protocol';
import type { DeviceTelemetry, EdgeNodeHealthStatus } from '@sahakar/types';

export interface SyncClientConfig {
  centralApiUrl: string;
  nodeId: string;
  instituteId: string;
}

export interface SyncResult {
  success: boolean;
  acceptedCount: number;
  rejectedCount: number;
  remainingQueued: number;
  error?: string;
  details?: unknown;
}

export class EdgeSyncClient {
  private config: SyncClientConfig;
  private journalService: EdgeJournalService;
  private customHttpHandler?: (
    url: string,
    options: { method: string; body?: unknown }
  ) => Promise<{ status: number; json: () => Promise<any> }>;

  constructor(
    config: SyncClientConfig,
    journalService: EdgeJournalService,
    customHttpHandler?: (
      url: string,
      options: { method: string; body?: unknown }
    ) => Promise<{ status: number; json: () => Promise<any> }>
  ) {
    this.config = config;
    this.journalService = journalService;
    this.customHttpHandler = customHttpHandler;
  }

  private async request(url: string, body?: unknown): Promise<any> {
    if (this.customHttpHandler) {
      const res = await this.customHttpHandler(url, {
        method: 'POST',
        body,
      });
      if (res.status >= 400) {
        throw new Error(`Sync HTTP error: ${res.status}`);
      }
      return res.json();
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Sync HTTP error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Step 1: Handshake with Central Cloud API
   */
  public async handshake(): Promise<{ accepted: boolean; centralSequence: number }> {
    const stats = this.journalService.getStats();
    const url = `${this.config.centralApiUrl}/api/v1/sync/handshake`;
    const res = await this.request(url, {
      nodeId: this.config.nodeId,
      instituteId: this.config.instituteId,
      edgeVersion: '1.0.0',
      lastAcknowledgedSequence: stats.lastLogicalSequence,
    });
    return res;
  }

  /**
   * Step 2 & 3: Upload batch of queued events and process acknowledgment
   */
  public async syncBatch(batchSize = 100): Promise<SyncResult> {
    const queuedEvents = this.journalService.getQueuedEvents(batchSize);
    if (queuedEvents.length === 0) {
      const stats = this.journalService.getStats();
      return {
        success: true,
        acceptedCount: 0,
        rejectedCount: 0,
        remainingQueued: stats.queuedCount,
      };
    }

    try {
      // 1. Handshake verification
      await this.handshake();

      // 2. Upload batch to Central
      const syncUrl = `${this.config.centralApiUrl}/api/v1/sync/events`;
      const batchRes: SyncBatchResponse = await this.request(syncUrl, {
        nodeId: this.config.nodeId,
        events: queuedEvents,
      });

      // 3. Mark accepted events as SYNCED in local SQLite WAL
      if (batchRes.accepted && batchRes.accepted.length > 0) {
        this.journalService.markEventsSynced(batchRes.accepted, batchRes.centralSequence);
      }

      const updatedStats = this.journalService.getStats();
      return {
        success: true,
        acceptedCount: batchRes.accepted.length,
        rejectedCount: batchRes.rejected ? batchRes.rejected.length : 0,
        remainingQueued: updatedStats.queuedCount,
        details: batchRes,
      };
    } catch (err: any) {
      const stats = this.journalService.getStats();
      return {
        success: false,
        acceptedCount: 0,
        rejectedCount: 0,
        remainingQueued: stats.queuedCount,
        error: err?.message || 'Sync failed',
      };
    }
  }

  /**
   * Step 4: Transmit Edge Device Telemetry Heartbeat per 08_API_SPEC.md & 05_HARDWARE_EDGE.md
   */
  public async sendHeartbeat(
    telemetry: DeviceTelemetry,
    healthStatus?: EdgeNodeHealthStatus
  ): Promise<{ acknowledged: boolean; serverTime: string }> {
    const url = `${this.config.centralApiUrl}/api/v1/edge/${this.config.nodeId}/heartbeat`;
    return this.request(url, { telemetry, healthStatus });
  }
}
