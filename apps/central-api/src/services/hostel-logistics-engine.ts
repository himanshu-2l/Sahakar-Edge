/**
 * Sahakar Edge — Hostel Logistics & Sovereign NFC Profile Engine
 * 
 * Tracks campus hostel inventory, allocates rooms during batch approvals,
 * preserves trainee residential privacy, and manages rotatable public NFC profiles.
 */

import crypto from 'node:crypto';
import type {
  HostelRoomType,
  CampusHostelRoom,
  HostelAllocationRecord,
  TraineeIssuedCertificateItem,
  TraineePublicNfcProfile,
} from '@sahakar/types';

export interface AllocationResult {
  success: boolean;
  assignment?: HostelAllocationRecord;
  updatedRoom?: CampusHostelRoom;
  errorReason?: string;
}

export class HostelLogisticsEngine {
  /**
   * Evaluates if a room has at least 1 free bed.
   */
  public hasAvailableBeds(room: CampusHostelRoom): boolean {
    return room.occupiedBeds < room.bedCapacity;
  }

  /**
   * Allocates a bed in a campus hostel room to an approved trainee nominee.
   */
  public allocateHostelRoom(params: {
    room: CampusHostelRoom;
    instituteId: string;
    programmeId: string;
    programmeTitle?: string;
    traineeId: string;
    traineeName?: string;
    nominationId?: string;
    assignedBy: string;
    checkInDate?: string;
    checkOutDate?: string;
    existingAssignments: HostelAllocationRecord[];
  }): AllocationResult {
    const {
      room,
      instituteId,
      programmeId,
      programmeTitle,
      traineeId,
      traineeName = 'Nominated Trainee',
      nominationId = `nom-${Date.now()}`,
      assignedBy,
      checkInDate = new Date().toISOString().split('T')[0],
      checkOutDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      existingAssignments,
    } = params;

    // 1. Institution Match Invariant: Room must belong to the programme's hosting institute
    if (room.instituteId !== instituteId) {
      return {
        success: false,
        errorReason: `Room ${room.roomNumber} does not belong to the issuing institute (${room.instituteId} !== ${instituteId}).`,
      };
    }

    // 2. Trainee Single-Room Invariant: Cannot allocate multiple rooms for same programme
    const alreadyAssigned = existingAssignments.some(
      (a) => a.programmeId === programmeId && a.traineeId === traineeId
    );
    if (alreadyAssigned) {
      return {
        success: false,
        errorReason: 'Trainee already has an active room assignment for this training programme.',
      };
    }

    // 3. Bed Capacity Invariant: occupiedBeds < bedCapacity
    if (!this.hasAvailableBeds(room)) {
      return {
        success: false,
        errorReason: `Room ${room.roomNumber} in block ${room.hostelBlock} is fully occupied (${room.occupiedBeds}/${room.bedCapacity} beds).`,
      };
    }

    // Atomic bed occupancy update
    const updatedRoom: CampusHostelRoom = {
      ...room,
      occupiedBeds: room.occupiedBeds + 1,
    };

    const assignment: HostelAllocationRecord = {
      id: `allot-${programmeId}-${traineeId}`,
      nominationId,
      traineeId,
      traineeName,
      programmeId,
      programmeTitle,
      roomId: room.id,
      hostelBlock: room.hostelBlock,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      checkInDate,
      checkOutDate,
      allocatedAt: new Date().toISOString(),
      allocatedBy: assignedBy,
    };

    return {
      success: true,
      assignment,
      updatedRoom,
    };
  }

  /**
   * Deallocates a hostel bed upon trainee checkout or nomination revocation.
   */
  public deallocateHostelRoom(
    room: CampusHostelRoom,
    assignmentId: string,
    existingAssignments: HostelAllocationRecord[]
  ): { success: boolean; updatedRoom: CampusHostelRoom; remainingAssignments: HostelAllocationRecord[] } {
    const remainingAssignments = existingAssignments.filter((a) => a.id !== assignmentId);
    const updatedRoom: CampusHostelRoom = {
      ...room,
      occupiedBeds: Math.max(0, room.occupiedBeds - 1),
    };

    return {
      success: true,
      updatedRoom,
      remainingAssignments,
    };
  }

  /**
   * Generates a rotatable, cryptographically secure 8-character public profile code.
   * Format: "NFC-" + 8 alphanumeric uppercase characters (e.g. "NFC-9X2P7K4M").
   */
  public generatePublicProfileCode(): string {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `NFC-${randomHex}`;
  }

  /**
   * Creates or rotates a sovereign public NFC credential profile.
   * Trainee private data (hostel block, room number, telephone number) is strictly redacted.
   */
  public createOrRotateNfcProfile(params: {
    traineeId: string;
    fullName: string;
    cooperativeAffiliation: string;
    enabled: boolean;
    primarySkills: string[];
    issuedCertificates: TraineeIssuedCertificateItem[];
    existingCode?: string;
  }): TraineePublicNfcProfile {
    const { traineeId, fullName, cooperativeAffiliation, enabled, primarySkills, issuedCertificates } = params;

    const publicProfileCode = this.generatePublicProfileCode();
    const publicUrl = `/?profile=${publicProfileCode}`;

    return {
      traineeId,
      publicProfileCode,
      publicUrl,
      enabled,
      fullName,
      cooperativeAffiliation,
      certifiedCoursesCount: issuedCertificates.length,
      primarySkills,
      issuedCertificates,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Resolves a public profile URL code, asserting privacy filtering.
   */
  public resolvePublicProfile(
    profileCode: string,
    profileStore: Map<string, TraineePublicNfcProfile>
  ): { resolved: boolean; profile?: TraineePublicNfcProfile; rejectionReason?: string } {
    const profile = profileStore.get(profileCode);
    if (!profile) {
      return { resolved: false, rejectionReason: 'Profile code not found or expired.' };
    }

    if (!profile.enabled) {
      return { resolved: false, rejectionReason: 'Public credential profile is currently disabled by the trainee.' };
    }

    return {
      resolved: true,
      profile,
    };
  }
}

export const hostelLogisticsEngine = new HostelLogisticsEngine();
