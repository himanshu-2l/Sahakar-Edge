import type { SyncEvent } from '@sahakar/types';

export interface SyncResult {
  success: boolean;
  count: number;
  destination?: 'EDGE_NODE' | 'CENTRAL_CLOUD';
  nodeId?: string;
  message?: string;
  error?: string;
}

export interface ConnectivityState {
  mode: 'EDGE_NODE' | 'CENTRAL_CLOUD' | 'OFFLINE';
  edgeOnline: boolean;
  centralOnline: boolean;
  edgeLatencyMs?: number;
  centralLatencyMs?: number;
}

const EDGE_SERVER_URL =
  (typeof window !== 'undefined' && (window as any).__EDGE_SERVER_URL) ||
  'http://localhost:4100';

const CENTRAL_API_URL =
  (typeof window !== 'undefined' && (window as any).__CENTRAL_API_URL) ||
  'http://localhost:4000';

export class NetworkSyncService {
  private edgeUrl: string;
  private centralUrl: string;

  constructor() {
    this.edgeUrl = EDGE_SERVER_URL;
    this.centralUrl = CENTRAL_API_URL;
  }

  public getEdgeUrl(): string {
    return this.edgeUrl;
  }

  public getCentralUrl(): string {
    return this.centralUrl;
  }

  /**
   * Probes both Edge Server and Central Cloud API to check reachability
   */
  public async probeConnectivity(): Promise<ConnectivityState> {
    let edgeOnline = false;
    let centralOnline = false;
    let edgeLatencyMs: number | undefined;
    let centralLatencyMs: number | undefined;

    // Probe Edge Node
    try {
      const t0 = performance.now();
      const res = await fetch(`${this.edgeUrl}/api/v1/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        edgeOnline = true;
        edgeLatencyMs = Math.round(performance.now() - t0);
      }
    } catch {
      edgeOnline = false;
    }

    // Probe Central API
    try {
      const t0 = performance.now();
      const res = await fetch(`${this.centralUrl}/api/v1/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        centralOnline = true;
        centralLatencyMs = Math.round(performance.now() - t0);
      }
    } catch {
      centralOnline = false;
    }

    let mode: 'EDGE_NODE' | 'CENTRAL_CLOUD' | 'OFFLINE' = 'OFFLINE';
    if (edgeOnline) {
      mode = 'EDGE_NODE';
    } else if (centralOnline) {
      mode = 'CENTRAL_CLOUD';
    }

    return {
      mode,
      edgeOnline,
      centralOnline,
      edgeLatencyMs,
      centralLatencyMs,
    };
  }

  /**
   * Sync queued events to Edge Node or fallback to Central Cloud
   */
  public async syncEvents(
    nodeId: string,
    events: SyncEvent[]
  ): Promise<SyncResult> {
    if (!events || events.length === 0) {
      return { success: true, count: 0, message: 'No events to sync.' };
    }

    const payload = {
      nodeId,
      events,
    };

    // 1. Try local Edge Node first (Local-first architecture)
    try {
      const edgeRes = await fetch(`${this.edgeUrl}/api/v1/sync/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer trainee-edge-token',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });

      if (edgeRes.ok) {
        const json = await edgeRes.json();
        return {
          success: true,
          count: events.length,
          destination: 'EDGE_NODE',
          nodeId,
          message: `Synced ${events.length} events to Edge Node (${this.edgeUrl}). Server ack: ${json.processedCount || events.length} processed.`,
        };
      }
    } catch (e) {
      // Edge node unreachable, fallback to Central Cloud
    }

    // 2. Fallback to Central Cloud API directly
    try {
      const centralRes = await fetch(`${this.centralUrl}/api/v1/sync/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer trainee-central-token',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (centralRes.ok) {
        const json = await centralRes.json();
        return {
          success: true,
          count: events.length,
          destination: 'CENTRAL_CLOUD',
          nodeId,
          message: `Synced ${events.length} events to Central Cloud (${this.centralUrl}). Server ack: ${json.processedCount || events.length} processed.`,
        };
      } else {
        const errJson = await centralRes.json().catch(() => ({}));
        return {
          success: false,
          count: 0,
          error: `Central Cloud rejected sync: ${errJson.error || centralRes.statusText}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        error: `Sync failed: neither local Edge Node nor Central Cloud was reachable. (${err.message})`,
      };
    }
  }

  /**
   * Query central AI Career Counselor with local offline fallback
   */
  public async queryCounselor(
    query: string,
    candidateId: string,
    language: 'EN' | 'HI' = 'EN'
  ): Promise<{ reply: string; time: string; tags: string[] }> {
    try {
      const res = await fetch(`${this.centralUrl}/api/v1/counselor/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer trainee-counselor-token',
        },
        body: JSON.stringify({ query, candidateId, language }),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          reply: data.reply,
          time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tags: data.tags || ['NCCT Verified'],
        };
      }
    } catch {
      // Fallback handled by caller
    }

    throw new Error('Central counselor API unavailable');
  }
}

export const networkSync = new NetworkSyncService();
