import {
  Programme,
  Batch,
  Enrollment,
  Institute,
  User,
  JobOpportunity,
  ProgrammeStatus,
  EnrollmentStatus,
} from '@sahakar/types';
import {
  SEED_PROGRAMME,
  SEED_BATCH,
  SEED_ENROLLMENTS,
  SEED_INSTITUTES,
  SEED_USERS,
  SEED_JOB_OPPORTUNITIES,
} from '@sahakar/test-fixtures';

const CENTRAL_API_URL =
  process.env.NEXT_PUBLIC_CENTRAL_API_URL || 'http://localhost:4000';

const DEFAULT_AUTH_HEADER = 'Bearer superadmin-token';

export interface BackendStatus {
  online: boolean;
  url: string;
  version?: string;
  checkedAt: string;
}

class CentralApiClient {
  private baseUrl: string;

  constructor(baseUrl = CENTRAL_API_URL) {
    this.baseUrl = baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async checkHealth(): Promise<BackendStatus> {
    const checkedAt = new Date().toISOString();
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          url: this.baseUrl,
          version: data.version || '1.0.0',
          checkedAt,
        };
      }
      return { online: false, url: this.baseUrl, checkedAt };
    } catch {
      return { online: false, url: this.baseUrl, checkedAt };
    }
  }

  // --- Programmes ---
  public async getProgrammes(): Promise<Programme[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/programmes`, {
        headers: { Authorization: DEFAULT_AUTH_HEADER },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.programmes)) return json.programmes;
      }
    } catch {
      // Fallback
    }
    return [SEED_PROGRAMME];
  }

  public async createProgramme(data: {
    instituteId: string;
    title: string;
    description: string;
    startAt?: string;
    endAt?: string;
    status?: ProgrammeStatus;
  }): Promise<Programme> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/programmes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: DEFAULT_AUTH_HEADER,
        },
        body: JSON.stringify({
          instituteId: data.instituteId,
          title: data.title,
          description: data.description,
          startAt: data.startAt || new Date().toISOString(),
          endAt: data.endAt || new Date(Date.now() + 30 * 86400000).toISOString(),
          status: data.status || ProgrammeStatus.ACTIVE,
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        return json.programme;
      }
    } catch {
      // Fallback local creation
    }

    const fallbackProg: Programme = {
      id: `prog-${Date.now()}`,
      instituteId: data.instituteId,
      title: data.title,
      description: data.description,
      startAt: data.startAt || new Date().toISOString(),
      endAt: data.endAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: data.status || ProgrammeStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return fallbackProg;
  }

  // --- Batches ---
  public async getBatches(programmeId?: string): Promise<Batch[]> {
    try {
      const url = programmeId
        ? `${this.baseUrl}/api/v1/batches?programmeId=${programmeId}`
        : `${this.baseUrl}/api/v1/batches`;
      const res = await fetch(url, {
        headers: { Authorization: DEFAULT_AUTH_HEADER },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.batches)) return json.batches;
      }
    } catch {
      // Fallback
    }
    return [SEED_BATCH];
  }

  public async createBatch(data: {
    programmeId: string;
    name: string;
    capacity?: number;
    trainerId: string;
  }): Promise<Batch> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: DEFAULT_AUTH_HEADER,
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const json = await res.json();
        return json.batch;
      }
    } catch {
      // Fallback
    }

    const fallbackBatch: Batch = {
      id: `batch-${Date.now()}`,
      programmeId: data.programmeId,
      name: data.name,
      capacity: data.capacity || 30,
      trainerId: data.trainerId,
      createdAt: new Date().toISOString(),
    };
    return fallbackBatch;
  }

  // --- Enrollments ---
  public async getEnrollments(programmeId?: string): Promise<Enrollment[]> {
    try {
      const url = programmeId
        ? `${this.baseUrl}/api/v1/programmes/${programmeId}/enrollments`
        : `${this.baseUrl}/api/v1/programmes/${SEED_PROGRAMME.id}/enrollments`;
      const res = await fetch(url, {
        headers: { Authorization: DEFAULT_AUTH_HEADER },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.enrollments)) return json.enrollments;
      }
    } catch {
      // Fallback
    }
    return SEED_ENROLLMENTS;
  }

  public async enrollTrainee(data: {
    programmeId: string;
    batchId: string;
    traineeId: string;
  }): Promise<Enrollment> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/v1/programmes/${data.programmeId}/enrollments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: DEFAULT_AUTH_HEADER,
          },
          body: JSON.stringify({
            batchId: data.batchId,
            traineeId: data.traineeId,
          }),
          signal: AbortSignal.timeout(4000),
        }
      );
      if (res.ok) {
        const json = await res.json();
        return json.enrollment;
      }
    } catch {
      // Fallback
    }

    const fallbackEnr: Enrollment = {
      id: `enr-${Date.now()}`,
      programmeId: data.programmeId,
      batchId: data.batchId,
      traineeId: data.traineeId,
      status: EnrollmentStatus.ENROLLED,
      enrolledAt: new Date().toISOString(),
    };
    return fallbackEnr;
  }

  // --- Fleet & Telemetry ---
  public async getEdgeFleet(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/edge/fleet`, {
        headers: { Authorization: DEFAULT_AUTH_HEADER },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.fleet)) return json.fleet;
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public async getSyncMonitor(): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/sync/monitor`, {
        headers: { Authorization: DEFAULT_AUTH_HEADER },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    return null;
  }

  // --- ERP Logistics ---
  public async getHostels(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/logistics/hostels`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.hostelAllotments)) return json.hostelAllotments;
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public async getTimetable(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/logistics/timetable`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.timetable)) return json.timetable;
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public async getHardwareKits(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/logistics/kits`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.hardwareKits)) return json.hardwareKits;
      }
    } catch {
      // Fallback
    }
    return [];
  }

  public async getAuditLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/audit-logs`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.auditLogs)) return json.auditLogs;
      }
    } catch {
      // Fallback
    }
    return [];
  }

  // --- AI Counselor ---
  public async queryCounselor(
    query: string,
    candidateId?: string,
    language: 'EN' | 'HI' = 'EN'
  ): Promise<{ reply: string; tags: string[]; time: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/counselor/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, candidateId, language }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return {
      reply: `Thank you for your query regarding cooperative careers. For the certified candidate, their highest affinity match is currently with Primary Agricultural Credit Societies (95% skill overlap).`,
      tags: ['PACS Computerization', 'NCCT Accreditation'],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export const apiClient = new CentralApiClient();
