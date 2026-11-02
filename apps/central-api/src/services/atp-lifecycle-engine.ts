/**
 * Sahakar Edge — Annual Training Plan (ATP) & Batch Lifecycle Engine
 * 
 * Enforces institutional capacity limits, nomination state transitions,
 * batch progress tracking, and trainee attendance eligibility thresholds.
 */

import type {
  TrainingProgramme,
  TraineeNomination,
  NominationStatus,
} from '@sahakar/types';

export interface NominationDecisionResult {
  success: boolean;
  nomination: TraineeNomination;
  previousStatus: NominationStatus;
  newStatus: NominationStatus;
  approvedCount: number;
  capacity: number;
  diagnosticMessage: string;
}

export interface BatchProgressMetrics {
  programmeId: string;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface TraineeAttendanceCompliance {
  traineeId: string;
  programmeId: string;
  totalConcludedSessions: number;
  attendedSessions: number;
  attendanceRate: number; // 0.00 to 1.00
  attendancePercentage: number; // 0.0 to 100.0
  thresholdPercentage: number; // e.g. 75.0%
  isCompliant: boolean;
  statutoryDirective: string;
}

export class AtpLifecycleEngine {
  /**
   * Evaluates if a programme has available capacity for another approved nominee.
   */
  public hasAvailableCapacity(programme: TrainingProgramme, currentApprovedCount: number): boolean {
    return currentApprovedCount < programme.capacity;
  }

  /**
   * Applies a state transition to a trainee nomination, strictly enforcing capacity limits.
   */
  public decideNomination(params: {
    programme: TrainingProgramme;
    nomination: TraineeNomination;
    action: 'APPROVE' | 'WAITLIST' | 'REJECT';
    currentApprovedCount: number;
    decidedBy: string;
    rejectionReason?: string;
    hostelRoomId?: string;
  }): NominationDecisionResult {
    const { programme, nomination, action, currentApprovedCount, decidedBy, rejectionReason, hostelRoomId } = params;
    const prevStatus = nomination.status;
    const now = new Date().toISOString();

    if (action === 'APPROVE') {
      // If candidate is already approved, treat as idempotent no-op
      if (prevStatus === 'APPROVED') {
        return {
          success: true,
          nomination,
          previousStatus: prevStatus,
          newStatus: 'APPROVED',
          approvedCount: currentApprovedCount,
          capacity: programme.capacity,
          diagnosticMessage: 'Nomination is already approved.',
        };
      }

      // Capacity invariant check: approvedCount < capacity
      if (currentApprovedCount >= programme.capacity) {
        // Strict capacity enforcement: candidate routed to WAITLISTED
        const waitlistedNomination: TraineeNomination = {
          ...nomination,
          status: 'WAITLISTED',
          decidedAt: now,
          decidedBy,
          rejectionReason: 'Programme capacity reached. Candidate placed on priority waitlist.',
        };
        return {
          success: false,
          nomination: waitlistedNomination,
          previousStatus: prevStatus,
          newStatus: 'WAITLISTED',
          approvedCount: currentApprovedCount,
          capacity: programme.capacity,
          diagnosticMessage: `Capacity exceeded (${currentApprovedCount}/${programme.capacity}). Nomination shifted to WAITLISTED.`,
        };
      }

      // Successful approval transition
      const approvedNomination: TraineeNomination = {
        ...nomination,
        status: 'APPROVED',
        decidedAt: now,
        decidedBy,
        rejectionReason: undefined,
        hostelRoomId: hostelRoomId || nomination.hostelRoomId,
      };

      return {
        success: true,
        nomination: approvedNomination,
        previousStatus: prevStatus,
        newStatus: 'APPROVED',
        approvedCount: currentApprovedCount + 1,
        capacity: programme.capacity,
        diagnosticMessage: `Nomination approved (${currentApprovedCount + 1}/${programme.capacity} seats filled).`,
      };
    }

    if (action === 'WAITLIST') {
      const waitlistedNomination: TraineeNomination = {
        ...nomination,
        status: 'WAITLISTED',
        decidedAt: now,
        decidedBy,
        rejectionReason: rejectionReason || 'Candidate placed on waitlist pending vacancy.',
        hostelRoomId: undefined, // Waitlisted candidates do not retain hostel rooms
      };
      const newApprovedCount = prevStatus === 'APPROVED' ? Math.max(0, currentApprovedCount - 1) : currentApprovedCount;
      return {
        success: true,
        nomination: waitlistedNomination,
        previousStatus: prevStatus,
        newStatus: 'WAITLISTED',
        approvedCount: newApprovedCount,
        capacity: programme.capacity,
        diagnosticMessage: 'Nomination status updated to WAITLISTED.',
      };
    }

    if (action === 'REJECT') {
      const rejectedNomination: TraineeNomination = {
        ...nomination,
        status: 'REJECTED',
        decidedAt: now,
        decidedBy,
        rejectionReason: rejectionReason || 'Nomination rejected by institutional administration.',
        hostelRoomId: undefined,
      };
      const newApprovedCount = prevStatus === 'APPROVED' ? Math.max(0, currentApprovedCount - 1) : currentApprovedCount;
      return {
        success: true,
        nomination: rejectedNomination,
        previousStatus: prevStatus,
        newStatus: 'REJECTED',
        approvedCount: newApprovedCount,
        capacity: programme.capacity,
        diagnosticMessage: 'Nomination status updated to REJECTED.',
      };
    }

    throw new Error(`Invalid nomination action: ${action}`);
  }

  /**
   * Promotes the earliest waitlisted candidate when an approved nomination is cancelled or revoked.
   */
  public findNextEligibleWaitlistedCandidate(
    nominations: TraineeNomination[],
    programmeId: string
  ): TraineeNomination | undefined {
    return nominations
      .filter((n) => n.programmeId === programmeId && n.status === 'WAITLISTED')
      .sort((a, b) => new Date(a.nominatedAt).getTime() - new Date(b.nominatedAt).getTime())[0];
  }

  /**
   * Computes batch delivery progress based on session completion count.
   */
  public evaluateBatchProgress(
    programmeId: string,
    sessions: Array<{ id: string; programmeId: string; status: 'UPCOMING' | 'ACTIVE' | 'CONCLUDED' }>
  ): BatchProgressMetrics {
    const programmeSessions = sessions.filter((s) => s.programmeId === programmeId);
    const totalSessions = programmeSessions.length;
    const completedSessions = programmeSessions.filter((s) => s.status === 'CONCLUDED').length;
    const upcomingSessions = totalSessions - completedSessions;

    const progressPercentage =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 10000) / 100 : 0.0;

    return {
      programmeId,
      totalSessions,
      completedSessions,
      upcomingSessions,
      progressPercentage,
      isCompleted: totalSessions > 0 && completedSessions === totalSessions,
    };
  }

  /**
   * Evaluates if a trainee has satisfied the minimum statutory attendance threshold (default 75%).
   */
  public evaluateAttendanceThreshold(params: {
    traineeId: string;
    programmeId: string;
    totalConcludedSessions: number;
    attendedSessions: number;
    thresholdPercentage?: number;
  }): TraineeAttendanceCompliance {
    const { traineeId, programmeId, totalConcludedSessions, attendedSessions } = params;
    const thresholdPercentage = params.thresholdPercentage ?? 75.0;

    const attendanceRate =
      totalConcludedSessions > 0 ? Math.min(1.0, attendedSessions / totalConcludedSessions) : 1.0;
    const attendancePercentage = Math.round(attendanceRate * 10000) / 100;
    const isCompliant = attendancePercentage >= thresholdPercentage;

    let statutoryDirective = '';
    if (totalConcludedSessions === 0) {
      statutoryDirective = 'Programme has not concluded any sessions. Trainee attendance status is baseline.';
    } else if (isCompliant) {
      statutoryDirective = `Attendance requirement satisfied (${attendancePercentage.toFixed(1)}% >= ${thresholdPercentage}%). Eligible for final module assessments and certification.`;
    } else {
      statutoryDirective = `Statutory attendance shortage (${attendancePercentage.toFixed(1)}% < ${thresholdPercentage}%). Trainee barred from final certification until remedial classes are completed.`;
    }

    return {
      traineeId,
      programmeId,
      totalConcludedSessions,
      attendedSessions,
      attendanceRate,
      attendancePercentage,
      thresholdPercentage,
      isCompliant,
      statutoryDirective,
    };
  }
}

export const atpLifecycleEngine = new AtpLifecycleEngine();
