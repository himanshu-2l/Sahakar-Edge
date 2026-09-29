import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import {
  AttendanceProvider,
  SimulatedAttendanceProvider,
  QrAttendanceProvider,
  CameraAttendanceProvider,
  CaptureContext,
  AttendanceEvidence,
  DeviceHealth,
} from '@sahakar/hardware-adapters';
import { AttendanceVerificationMethod, AttendanceResult } from '@sahakar/types';
import { EdgeJournalService } from './journal-service.js';

export class EdgeAttendanceManager {
  private providers: Map<AttendanceVerificationMethod, AttendanceProvider> = new Map();
  private journalService: EdgeJournalService;
  private db: DatabaseSync;
  private nodeId: string;

  constructor(
    db: DatabaseSync,
    journalService: EdgeJournalService,
    nodeId = 'edge-node-ricm-bhopal-01'
  ) {
    this.db = db;
    this.journalService = journalService;
    this.nodeId = nodeId;

    // Register 3 attendance providers
    const sim = new SimulatedAttendanceProvider();
    const qr = new QrAttendanceProvider();
    const cam = new CameraAttendanceProvider();

    this.providers.set(AttendanceVerificationMethod.SIMULATED_FACE, sim);
    this.providers.set(AttendanceVerificationMethod.QR, qr);
  }

  public async initialize(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.initialize();
    }
  }

  public getProvider(method: AttendanceVerificationMethod): AttendanceProvider | undefined {
    return this.providers.get(method);
  }

  /**
   * Capture attendance through selected hardware adapter (Simulated Face, Session QR)
   */
  public async processCapture(
    context: CaptureContext,
    method: AttendanceVerificationMethod
  ): Promise<{ evidence: AttendanceEvidence; event?: any }> {
    const provider = this.getProvider(method) || this.providers.get(AttendanceVerificationMethod.QR)!;
    const evidence = await provider.capture(context);

    if (!evidence.verified || !evidence.traineeId) {
      return { evidence };
    }

    const recordId = randomUUID();
    const occurredAt = new Date().toISOString();

    const payload = {
      recordId,
      sessionId: context.sessionId,
      traineeId: evidence.traineeId,
      method: evidence.method,
      result: evidence.result,
      confidence: evidence.confidence ?? null,
      quality: evidence.quality ?? null,
      metadata: evidence.metadata || {},
      createdBy: context.actorId,
      occurredAt,
    };

    const event = this.journalService.appendEventInTransaction({
      aggregateType: 'ATTENDANCE',
      aggregateId: context.sessionId,
      eventType: 'ATTENDANCE_RECORDED',
      payload,
      operationalCallback: (txDb) => {
        txDb
          .prepare(`
            INSERT INTO local_attendance_records (
              id, session_id, trainee_id, node_id, method, result,
              confidence, quality, occurred_at, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            recordId,
            context.sessionId,
            evidence.traineeId,
            this.nodeId,
            evidence.method,
            evidence.result,
            evidence.confidence ?? null,
            evidence.quality ?? null,
            occurredAt,
            context.actorId
          );
      },
    });

    return { evidence, event };
  }

  /**
   * Trainer manual review and override with mandatory audit record
   */
  public overrideAttendance(
    recordId: string,
    reason: string,
    actorId: string,
    result: AttendanceResult = AttendanceResult.PRESENT
  ): any {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Override reason is required for statutory audit');
    }

    const existing = this.db
      .prepare('SELECT * FROM local_attendance_records WHERE id = ?')
      .get(recordId) as any;

    if (!existing) {
      throw new Error('Attendance record not found');
    }

    const occurredAt = new Date().toISOString();
    const payload = {
      recordId,
      sessionId: existing.session_id,
      traineeId: existing.trainee_id,
      previousResult: existing.result,
      newResult: result,
      overrideReason: reason,
      overriddenBy: actorId,
      occurredAt,
    };

    const event = this.journalService.appendEventInTransaction({
      aggregateType: 'ATTENDANCE',
      aggregateId: existing.session_id,
      eventType: 'ATTENDANCE_OVERRIDDEN',
      payload,
      operationalCallback: (txDb) => {
        txDb
          .prepare(`
            UPDATE local_attendance_records
            SET result = ?, override_reason = ?
            WHERE id = ?
          `)
          .run(result, reason, recordId);
      },
    });

    return { record: payload, event };
  }

  /**
   * Health of all attached attendance hardware adapters
   */
  public async getProvidersHealth(): Promise<DeviceHealth[]> {
    const healthList: DeviceHealth[] = [];
    for (const provider of this.providers.values()) {
      healthList.push(await provider.health());
    }
    return healthList;
  }
}
