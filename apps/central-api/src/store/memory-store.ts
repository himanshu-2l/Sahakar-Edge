import { randomUUID } from 'node:crypto';
import {
  Institute,
  User,
  Programme,
  ProgrammeStatus,
  Batch,
  TrainingSession,
  Course,
  Module,
  Lesson,
  Enrollment,
  EnrollmentStatus,
  Assessment,
  Question,
  UserRole,
  type Skill,
  type JobOpportunity,
  type JobRequiredSkill,
  type SkillEvidence,
} from '@sahakar/types';
import {
  SEED_INSTITUTES,
  SEED_USERS,
  SEED_PROGRAMME,
  SEED_BATCH,
  SEED_SESSION,
  SEED_ENROLLMENTS,
  SEED_COURSE,
  SEED_MODULE,
  SEED_LESSONS,
  SEED_ASSESSMENT,
  SEED_QUESTIONS,
  SEED_SKILLS,
  SEED_JOB_OPPORTUNITIES,
  SEED_JOB_REQUIRED_SKILLS,
  SEED_TRAINEE_SKILL_EVIDENCES,
} from '@sahakar/test-fixtures';

export class CentralMemoryStore {
  private institutes: Map<string, Institute> = new Map();
  private users: Map<string, User> = new Map();
  private programmes: Map<string, Programme> = new Map();
  private batches: Map<string, Batch> = new Map();
  private sessions: Map<string, TrainingSession> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();
  private courses: Map<string, Course> = new Map();
  private modules: Map<string, Module> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private assessments: Map<string, Assessment> = new Map();
  private questions: Map<string, Question> = new Map();

  // Ingested sync events & deduplication
  private ingestedEvents: Map<string, any> = new Map();
  private centralLogicalSequence = 0;

  // Operational business records
  private attendanceRecords: Map<string, any> = new Map();
  private progressRecords: Map<string, any> = new Map();
  private assessmentSubmissions: Map<string, any> = new Map();
  private edgeNodes: Map<string, any> = new Map();
  private credentials: Map<string, any> = new Map();

  // Skills, Job Opportunities & Employment Evidence
  private skills: Map<string, Skill> = new Map();
  private jobOpportunities: Map<string, JobOpportunity> = new Map();
  private jobRequiredSkills: Map<string, JobRequiredSkill[]> = new Map();
  private skillEvidences: Map<string, SkillEvidence> = new Map();

  constructor() {
    this.seedBaseline();
  }

  public seedBaseline(): void {
    this.institutes.clear();
    this.users.clear();
    this.programmes.clear();
    this.batches.clear();
    this.sessions.clear();
    this.enrollments.clear();
    this.courses.clear();
    this.modules.clear();
    this.lessons.clear();
    this.assessments.clear();
    this.questions.clear();
    this.skills.clear();
    this.jobOpportunities.clear();
    this.jobRequiredSkills.clear();
    this.skillEvidences.clear();

    for (const inst of SEED_INSTITUTES) this.institutes.set(inst.id, { ...inst });
    for (const user of SEED_USERS) this.users.set(user.id, { ...user });
    this.programmes.set(SEED_PROGRAMME.id, { ...SEED_PROGRAMME });
    this.batches.set(SEED_BATCH.id, { ...SEED_BATCH });
    this.sessions.set(SEED_SESSION.id, { ...SEED_SESSION });
    for (const enr of SEED_ENROLLMENTS) this.enrollments.set(enr.id, { ...enr });
    this.courses.set(SEED_COURSE.id, { ...SEED_COURSE });
    this.modules.set(SEED_MODULE.id, { ...SEED_MODULE });
    for (const les of SEED_LESSONS) this.lessons.set(les.id, { ...les });
    this.assessments.set(SEED_ASSESSMENT.id, { ...SEED_ASSESSMENT });
    for (const q of SEED_QUESTIONS) this.questions.set(q.id, { ...q });

    for (const skill of SEED_SKILLS) this.skills.set(skill.id, { ...skill });
    for (const job of SEED_JOB_OPPORTUNITIES) this.jobOpportunities.set(job.id, { ...job });
    for (const req of SEED_JOB_REQUIRED_SKILLS) {
      const existing = this.jobRequiredSkills.get(req.jobId) || [];
      existing.push({ ...req });
      this.jobRequiredSkills.set(req.jobId, existing);
    }
    for (const ev of SEED_TRAINEE_SKILL_EVIDENCES) this.skillEvidences.set(ev.id, { ...ev });

    // Seed default edge node per 05_HARDWARE_EDGE.md
    this.edgeNodes.set('edge-node-ricm-bhopal-01', {
      id: 'edge-node-ricm-bhopal-01',
      nodeId: 'edge-node-ricm-bhopal-01',
      instituteId: '11111111-1111-1111-1111-111111111111',
      name: 'RICM Bhopal - Main Training Hall Gateway',
      publicKey: 'simulated-ed25519-public-key-ricm-01',
      softwareVersion: '1.0.0',
      lastSeenAt: new Date().toISOString(),
      healthStatus: 'ONLINE_SYNCED',
      telemetry: {
        cpuTemperatureC: 44.2,
        cpuLoadPercent: 12.5,
        memoryUsagePercent: 32.0,
        diskUsagePercent: 24.0,
        uptimeSeconds: 7200,
        networkState: 'ONLINE',
        wanSimulationMode: 'online',
        appVersion: '1.0.0',
        lastSyncAt: new Date().toISOString(),
        queuedEventCount: 0,
      },
    });
  }

  // --- Institutes ---
  listInstitutes(): Institute[] {
    return Array.from(this.institutes.values());
  }

  getInstitute(id: string): Institute | undefined {
    return this.institutes.get(id);
  }

  createInstitute(data: Omit<Institute, 'id' | 'createdAt' | 'updatedAt' | 'active'>): Institute {
    const id = randomUUID();
    const now = new Date().toISOString();
    const inst: Institute = {
      id,
      ...data,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.institutes.set(id, inst);
    return inst;
  }

  // --- Users ---
  listUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmailOrPhone(emailOrPhone: string): User | undefined {
    const term = emailOrPhone.toLowerCase().trim();
    return Array.from(this.users.values()).find(
      (u) => u.emailOrPhone.toLowerCase() === term
    );
  }

  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'active'>): User {
    const id = randomUUID();
    const now = new Date().toISOString();
    const user: User = {
      id,
      ...data,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  // --- Programmes ---
  listProgrammes(instituteId?: string): Programme[] {
    const all = Array.from(this.programmes.values());
    if (instituteId) {
      return all.filter((p) => p.instituteId === instituteId);
    }
    return all;
  }

  getProgramme(id: string): Programme | undefined {
    return this.programmes.get(id);
  }

  createProgramme(data: Omit<Programme, 'id' | 'createdAt' | 'updatedAt'>): Programme {
    const id = randomUUID();
    const now = new Date().toISOString();
    const programme: Programme = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.programmes.set(id, programme);
    return programme;
  }

  updateProgramme(id: string, updates: Partial<Programme>): Programme | undefined {
    const existing = this.programmes.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.programmes.set(id, updated);
    return updated;
  }

  // --- Batches ---
  listBatches(programmeId?: string): Batch[] {
    const all = Array.from(this.batches.values());
    if (programmeId) {
      return all.filter((b) => b.programmeId === programmeId);
    }
    return all;
  }

  getBatch(id: string): Batch | undefined {
    return this.batches.get(id);
  }

  createBatch(data: Omit<Batch, 'id' | 'createdAt'>): Batch {
    const id = randomUUID();
    const batch: Batch = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.batches.set(id, batch);
    return batch;
  }

  // --- Sessions ---
  listSessions(batchId?: string): TrainingSession[] {
    const all = Array.from(this.sessions.values());
    if (batchId) {
      return all.filter((s) => s.batchId === batchId);
    }
    return all;
  }

  getSession(id: string): TrainingSession | undefined {
    return this.sessions.get(id);
  }

  createSession(data: Omit<TrainingSession, 'id' | 'createdAt'>): TrainingSession {
    const id = randomUUID();
    const session: TrainingSession = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(id, session);
    return session;
  }

  // --- Enrollments ---
  listEnrollments(filters?: { programmeId?: string; batchId?: string; traineeId?: string }): Enrollment[] {
    let all = Array.from(this.enrollments.values());
    if (filters?.programmeId) {
      all = all.filter((e) => e.programmeId === filters.programmeId);
    }
    if (filters?.batchId) {
      all = all.filter((e) => e.batchId === filters.batchId);
    }
    if (filters?.traineeId) {
      all = all.filter((e) => e.traineeId === filters.traineeId);
    }
    return all;
  }

  enrollTrainee(data: Omit<Enrollment, 'id' | 'enrolledAt'>): Enrollment {
    // Check if already enrolled in this batch
    const existing = Array.from(this.enrollments.values()).find(
      (e) => e.traineeId === data.traineeId && e.batchId === data.batchId
    );
    if (existing) return existing;

    const id = randomUUID();
    const enr: Enrollment = {
      id,
      ...data,
      enrolledAt: new Date().toISOString(),
    };
    this.enrollments.set(id, enr);
    return enr;
  }

  // --- Courses & LMS ---
  listCourses(): Course[] {
    return Array.from(this.courses.values());
  }

  getCourse(id: string): Course | undefined {
    return this.courses.get(id);
  }

  createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Course {
    const id = randomUUID();
    const now = new Date().toISOString();
    const course: Course = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.courses.set(id, course);
    return course;
  }

  getCourseContentManifest(courseId: string) {
    const course = this.courses.get(courseId);
    if (!course) return undefined;

    const courseModules = Array.from(this.modules.values())
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);

    const modulesWithLessons = courseModules.map((mod) => {
      const modLessons = Array.from(this.lessons.values())
        .filter((l) => l.moduleId === mod.id)
        .sort((a, b) => a.order - b.order);
      return {
        ...mod,
        lessons: modLessons,
      };
    });

    const assessment = Array.from(this.assessments.values()).find((a) => a.courseId === courseId);
    const questions = assessment
      ? Array.from(this.questions.values()).filter((q) => q.assessmentId === assessment.id)
      : [];

    return {
      course,
      modules: modulesWithLessons,
      assessment: assessment ? { ...assessment, questions } : null,
      generatedAt: new Date().toISOString(),
    };
  }

  // --- Sync Ingestion & Idempotency ---
  isEventIngested(eventId: string): boolean {
    return this.ingestedEvents.has(eventId);
  }

  getCentralSequence(): number {
    return this.centralLogicalSequence;
  }

  recordIngestedEvent(event: any): number {
    this.centralLogicalSequence++;
    this.ingestedEvents.set(event.id, {
      ...event,
      ingestedAt: new Date().toISOString(),
      centralSequence: this.centralLogicalSequence,
    });
    return this.centralLogicalSequence;
  }

  listIngestedEvents(limit = 100): any[] {
    return Array.from(this.ingestedEvents.values()).slice(-limit);
  }

  // --- Operational Records (Attendance, Progress, Assessment) ---
  recordAttendance(record: any): void {
    const key = record.recordId || record.id || `${record.sessionId}-${record.traineeId}`;
    this.attendanceRecords.set(key, { ...record, updatedAt: new Date().toISOString() });
  }

  listAttendanceBySession(sessionId: string): any[] {
    return Array.from(this.attendanceRecords.values()).filter(
      (a) => a.sessionId === sessionId
    );
  }

  recordProgress(record: any): void {
    const key = `${record.traineeId}-${record.lessonId}`;
    this.progressRecords.set(key, { ...record, updatedAt: new Date().toISOString() });
  }

  getTraineeProgress(traineeId: string): any {
    const traineeProgress = Array.from(this.progressRecords.values()).filter(
      (p) => p.traineeId === traineeId && (p.completed || p.eventType === 'LESSON_COMPLETED')
    );
    const totalLessons = this.lessons.size;
    const completedCount = traineeProgress.length;
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      traineeId,
      completedLessons: traineeProgress.map((p) => p.lessonId),
      completedCount,
      totalLessons,
      progressPercentage: percentage,
    };
  }

  recordAssessmentSubmission(submission: any): void {
    const key = submission.submissionId || submission.id || `${submission.assessmentId}-${submission.traineeId}-${Date.now()}`;
    this.assessmentSubmissions.set(key, { ...submission, recordedAt: new Date().toISOString() });
  }

  listAssessmentSubmissions(traineeId?: string): any[] {
    let all = Array.from(this.assessmentSubmissions.values());
    if (traineeId) {
      all = all.filter((s) => s.traineeId === traineeId);
    }
    return all;
  }

  // --- Edge Node Fleet Management ---
  registerOrUpdateEdgeNode(nodeId: string, metadata: any): void {
    const existing = this.edgeNodes.get(nodeId) || {};
    this.edgeNodes.set(nodeId, {
      ...existing,
      ...metadata,
      nodeId,
      lastSeenAt: new Date().toISOString(),
    });
  }

  getEdgeNode(nodeId: string): any | undefined {
    return this.edgeNodes.get(nodeId);
  }

  listEdgeNodes(): any[] {
    return Array.from(this.edgeNodes.values());
  }

  // --- Credentials ---
  saveCredential(cred: any): void {
    this.credentials.set(cred.id, { ...cred, updatedAt: new Date().toISOString() });
  }

  getCredential(id: string): any | undefined {
    return this.credentials.get(id);
  }

  listCredentials(traineeId?: string): any[] {
    let all = Array.from(this.credentials.values());
    if (traineeId) {
      all = all.filter((c) => c.traineeId === traineeId);
    }
    return all;
  }

  updateCredentialStatus(id: string, status: string, reason?: string, actorId?: string): any | undefined {
    const cred = this.credentials.get(id);
    if (!cred) return undefined;

    cred.status = status;
    if (status === 'REVOKED') {
      cred.revokedAt = new Date().toISOString();
      cred.revocationReason = reason || 'Revoked by authority';
      cred.revokedBy = actorId || 'system';
    }
    cred.updatedAt = new Date().toISOString();
    this.credentials.set(id, cred);
    return cred;
  }

  // --- Skills & Taxonomy ---
  listSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  getSkillByCode(code: string): Skill | undefined {
    return Array.from(this.skills.values()).find((s) => s.code === code);
  }

  createSkill(data: Omit<Skill, 'id'> & { id?: string }): Skill {
    const id = data.id || randomUUID();
    const skill: Skill = { id, ...data };
    this.skills.set(id, skill);
    return skill;
  }

  // --- Job Opportunities & Required Skills ---
  listJobs(activeOnly = true): JobOpportunity[] {
    const all = Array.from(this.jobOpportunities.values());
    if (activeOnly) {
      return all.filter((j) => j.active);
    }
    return all;
  }

  getJob(id: string): JobOpportunity | undefined {
    return this.jobOpportunities.get(id);
  }

  createJob(
    jobData: Omit<JobOpportunity, 'id' | 'createdAt'> & { id?: string },
    requiredSkills?: JobRequiredSkill[]
  ): JobOpportunity {
    const id = jobData.id || randomUUID();
    const createdAt = new Date().toISOString();
    const job: JobOpportunity = {
      id,
      createdAt,
      ...jobData,
    };
    this.jobOpportunities.set(id, job);

    if (requiredSkills && requiredSkills.length > 0) {
      const formatted = requiredSkills.map((r) => ({
        ...r,
        jobId: id,
      }));
      this.jobRequiredSkills.set(id, formatted);
    }

    return job;
  }

  getJobRequiredSkills(jobId: string): JobRequiredSkill[] {
    return this.jobRequiredSkills.get(jobId) || [];
  }

  // --- Skill Evidence ---
  listTraineeSkillEvidences(traineeId: string): SkillEvidence[] {
    return Array.from(this.skillEvidences.values()).filter((e) => e.traineeId === traineeId);
  }

  addSkillEvidence(
    evidenceData: Omit<SkillEvidence, 'id' | 'issuedAt'> & { id?: string; issuedAt?: string }
  ): SkillEvidence {
    const id = evidenceData.id || randomUUID();
    const issuedAt = evidenceData.issuedAt || new Date().toISOString();
    const evidence: SkillEvidence = {
      id,
      issuedAt,
      ...evidenceData,
    };
    this.skillEvidences.set(id, evidence);
    return evidence;
  }

  getSyncStats(): any {
    return {
      totalIngestedEvents: this.ingestedEvents.size,
      centralLogicalSequence: this.centralLogicalSequence,
      registeredNodesCount: this.edgeNodes.size,
      attendanceRecordsCount: this.attendanceRecords.size,
      assessmentSubmissionsCount: this.assessmentSubmissions.size,
      credentialsIssuedCount: this.credentials.size,
    };
  }
}

// Global singleton instance for Central API
export const centralStore = new CentralMemoryStore();
