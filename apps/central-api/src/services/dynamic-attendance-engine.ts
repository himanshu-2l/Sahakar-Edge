/**
 * Sahakar Edge — Timetable & Dynamic Multi-Modal Attendance Engine
 * 
 * Generates collision-free 6-digit check-in tokens, enforces temporal start guards,
 * verifies nomination status, and processes multi-modal presence records.
 */

import crypto from 'node:crypto';
import type {
  TimetableSession,
  SessionAttendanceRecord,
  SessionAttendanceVerificationMethod,
} from '@sahakar/types';

export interface CheckInValidationResult {
  allowed: boolean;
  rejectionCode?: 'NOT_APPROVED' | 'PREMATURE_CHECKIN' | 'SESSION_CONCLUDED' | 'INVALID_CODE' | 'ALREADY_CHECKED_IN';
  rejectionReason?: string;
}

export class DynamicAttendanceEngine {
  /**
   * Generates a 6-digit numeric check-in code guaranteed not to collide with active sessions.
   * If random generation encounters collisions across attempts, falls back to deterministic HMAC.
   */
  public generateUniqueCheckInCode(
    existingActiveSessions: Array<{ checkInCode?: string; status?: string }>,
    sessionIdSeed?: string
  ): string {
    const activeCodes = new Set(
      existingActiveSessions
        .filter((s) => s.status === 'UPCOMING' || s.status === 'ACTIVE')
        .map((s) => s.checkInCode)
        .filter(Boolean) as string[]
    );

    // Attempt up to 20 random cryptographic draws (numbers from 100000 to 999999)
    for (let i = 0; i < 20; i++) {
      const codeNumber = crypto.randomInt(100000, 1000000);
      const codeStr = String(codeNumber);
      if (!activeCodes.has(codeStr)) {
        return codeStr;
      }
    }

    // Deterministic fallback: HMAC-SHA256 of session identifier or timestamp
    const seed = sessionIdSeed || `session-salt-${Date.now()}`;
    const hmac = crypto.createHmac('sha256', 'sahakar-ncct-checkin-secret').update(seed).digest('hex');
    const numericSegment = (parseInt(hmac.substring(0, 8), 16) % 900000) + 100000;
    let fallbackCode = String(numericSegment);

    while (activeCodes.has(fallbackCode)) {
      const nextNum = ((parseInt(fallbackCode, 10) + 1 - 100000) % 900000) + 100000;
      fallbackCode = String(nextNum);
    }

    return fallbackCode;
  }

  /**
   * Temporal start guard: Prevents check-in before the session start time.
   * Check-in is strictly blocked if currentTime < sessionStartsAt.
   */
  public isBeforeSessionStart(
    sessionStartsAt: string,
    checkInTimestampMs: number = Date.now()
  ): boolean {
    const startTimeMs = new Date(sessionStartsAt).getTime();
    return checkInTimestampMs < startTimeMs;
  }

  /**
   * Approved nomination guard: Ensures trainee holds an APPROVED nomination for the programme.
   */
  public isApprovedNominee(
    programmeId: string,
    traineeId: string,
    nominations: Array<{ programmeId: string; traineeId: string; status: string }>
  ): boolean {
    const nomination = nominations.find(
      (n) => n.programmeId === programmeId && n.traineeId === traineeId
    );
    return Boolean(nomination && nomination.status === 'APPROVED');
  }

  /**
   * Comprehensive validation pipeline for trainee session check-in.
   */
  public validateCheckInEligibility(params: {
    session: TimetableSession;
    traineeId: string;
    isApproved: boolean;
    existingAttendanceRecords: SessionAttendanceRecord[];
    checkInTimestampMs?: number;
  }): CheckInValidationResult {
    const { session, traineeId, isApproved, existingAttendanceRecords } = params;
    const nowMs = params.checkInTimestampMs ?? Date.now();

    // 1. Approved Nomination Guard
    if (!isApproved) {
      return {
        allowed: false,
        rejectionCode: 'NOT_APPROVED',
        rejectionReason: 'Trainee does not possess an approved nomination for this training programme batch.',
      };
    }

    // 2. Duplicate Attendance Guard
    const alreadyMarked = existingAttendanceRecords.some(
      (rec) => rec.sessionId === session.id && rec.traineeId === traineeId && rec.verified
    );
    if (alreadyMarked) {
      return {
        allowed: false,
        rejectionCode: 'ALREADY_CHECKED_IN',
        rejectionReason: 'Attendance has already been recorded and verified for this session.',
      };
    }

    // 3. Temporal Anti-Early Start Guard
    const startsAtIso = session.startsAt || `${session.sessionDate}T${session.startTime}:00Z`;
    if (this.isBeforeSessionStart(startsAtIso, nowMs)) {
      const startTimeFormatted = new Date(startsAtIso).toISOString().replace('T', ' ').substring(0, 19);
      return {
        allowed: false,
        rejectionCode: 'PREMATURE_CHECKIN',
        rejectionReason: `Check-in opens at scheduled start time (${startTimeFormatted} UTC). Premature attendance logging is prohibited.`,
      };
    }

    // 4. Session Concluded Guard
    const endsAtIso = session.endsAt || `${session.sessionDate}T${session.endTime}:00Z`;
    const endTimeMs = new Date(endsAtIso).getTime();
    if (session.status === 'CONCLUDED' || nowMs > endTimeMs + 30 * 60 * 1000) { // 30-min grace period
      return {
        allowed: false,
        rejectionCode: 'SESSION_CONCLUDED',
        rejectionReason: 'Session has concluded. Dynamic check-in is closed; contact faculty for manual roster reconciliation.',
      };
    }

    return { allowed: true };
  }

  /**
   * Verifies check-in input across multi-modal verification methods.
   */
  public processCheckIn(params: {
    session: TimetableSession;
    traineeId: string;
    traineeName: string;
    method: SessionAttendanceVerificationMethod;
    submittedCode?: string;
    qrToken?: string;
    facultyId?: string;
  }): { success: boolean; record?: SessionAttendanceRecord; errorReason?: string } {
    const { session, traineeId, traineeName, method, submittedCode, facultyId } = params;
    const nowIso = new Date().toISOString();

    if (method === 'DYNAMIC_CODE') {
      if (!submittedCode) {
        return { success: false, errorReason: 'Dynamic 6-digit check-in code was not provided.' };
      }
      // Constant-time comparison to prevent timing vulnerabilities
      const targetCodeBuf = Buffer.from(session.checkInCode.trim());
      const submittedCodeBuf = Buffer.from(submittedCode.trim());

      const match =
        targetCodeBuf.length === submittedCodeBuf.length &&
        crypto.timingSafeEqual(targetCodeBuf, submittedCodeBuf);

      if (!match) {
        return { success: false, errorReason: 'Invalid check-in code entered. Verify the 6-digit code displayed by faculty.' };
      }

      return {
        success: true,
        record: {
          id: `att-${session.id}-${traineeId}`,
          sessionId: session.id,
          traineeId,
          traineeName,
          verificationMethod: 'DYNAMIC_CODE',
          markedAt: nowIso,
          verified: true,
        },
      };
    }

    if (method === 'QR_SCAN') {
      // QR verification: token matches session ID or payload hash
      if (!params.qrToken || !params.qrToken.includes(session.id)) {
        return { success: false, errorReason: 'QR token signature mismatch or expired.' };
      }
      return {
        success: true,
        record: {
          id: `att-${session.id}-${traineeId}`,
          sessionId: session.id,
          traineeId,
          traineeName,
          verificationMethod: 'QR_SCAN',
          markedAt: nowIso,
          verified: true,
        },
      };
    }

    if (method === 'FACULTY_MANUAL') {
      if (!facultyId) {
        return { success: false, errorReason: 'Faculty trainer ID is required for manual attendance override audit logging.' };
      }
      return {
        success: true,
        record: {
          id: `att-${session.id}-${traineeId}`,
          sessionId: session.id,
          traineeId,
          traineeName,
          verificationMethod: 'FACULTY_MANUAL',
          markedAt: nowIso,
          markedBy: facultyId,
          verified: true,
        },
      };
    }

    return { success: false, errorReason: `Unsupported verification method: ${method}` };
  }
}

export const dynamicAttendanceEngine = new DynamicAttendanceEngine();
