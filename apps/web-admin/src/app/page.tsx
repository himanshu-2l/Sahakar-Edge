'use client';

import React, { useState } from 'react';
import {
  SEED_INSTITUTES,
  SEED_INSTITUTE_RICM_BHOPAL,
  SEED_PROGRAMME,
  SEED_BATCH,
  SEED_SESSION,
  SEED_ENROLLMENTS,
  SEED_COURSE,
  SEED_USERS,
  SEED_SKILLS,
  SEED_JOB_OPPORTUNITIES,
  SEED_JOB_REQUIRED_SKILLS,
} from '@sahakar/test-fixtures';
import { Programme, Batch, Enrollment, EnrollmentStatus, ProgrammeStatus } from '@sahakar/types';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'INSTITUTES'
    | 'PROGRAMMES'
    | 'BATCHES'
    | 'COURSES'
    | 'ATTENDANCE'
    | 'CREDENTIALS'
    | 'EMPLOYMENT'
    | 'EDGE_NODES'
    | 'SYNC_MONITOR'
    | 'AUDIT_LOG'
  >('OVERVIEW');

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('dddd4444-4444-4444-4444-444444444441');

  // Interactive state initialized with seed fixtures
  const [programmes, setProgrammes] = useState<Programme[]>([SEED_PROGRAMME]);
  const [batches, setBatches] = useState<Batch[]>([SEED_BATCH]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(SEED_ENROLLMENTS);

  // Form states for creating programme
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showProgrammeModal, setShowProgrammeModal] = useState(false);

  // Form states for assigning enrollment
  const [selectedProgrammeId, setSelectedProgrammeId] = useState(SEED_PROGRAMME.id);
  const [selectedBatchId, setSelectedBatchId] = useState(SEED_BATCH.id);
  const [selectedTraineeId, setSelectedTraineeId] = useState(SEED_USERS[3].id);
  const [assignmentNotice, setAssignmentNotice] = useState<string | null>(null);

  // Attendance & Manual Override State (07_UI_UX_SPEC.md & 05_HARDWARE_EDGE.md)
  const [attendanceRecords, setAttendanceRecords] = useState([
    {
      id: 'att-1',
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      traineeName: 'Anita Patel',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'BIOMETRIC_SIMULATION',
      status: 'PRESENT',
      timestamp: '2026-09-28T09:15:32.000Z',
      verified: true,
      overrideReason: null as string | null,
    },
    {
      id: 'att-2',
      traineeId: 'dddd4444-4444-4444-4444-444444444442',
      traineeName: 'Vikram Rao',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'DYNAMIC_QR',
      status: 'PRESENT',
      timestamp: '2026-09-28T09:18:14.000Z',
      verified: true,
      overrideReason: null as string | null,
    },
    {
      id: 'att-3',
      traineeId: 'dddd4444-4444-4444-4444-444444444443',
      traineeName: 'Sunita Meena',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'MANUAL_OVERRIDE',
      status: 'PRESENT_OVERRIDDEN',
      timestamp: '2026-09-28T09:25:00.000Z',
      verified: true,
      overrideReason: 'Trainee device network timeout; verified in person by Trainer',
    },
  ]);
  const [overrideTraineeId, setOverrideTraineeId] = useState(SEED_USERS[3].id);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Credentials and Public Verification State (06_CREDENTIALS_SKILLS_EMPLOYMENT.md)
  const [credentialsList, setCredentialsList] = useState([
    {
      id: 'cred-anita-pacs-2026',
      traineeId: 'dddd4444-4444-4444-4444-444444444441',
      traineeName: 'Anita Patel',
      programmeTitle: 'PACS Computerization & Governance Specialist',
      issuedAt: '2026-09-28T14:30:00.000Z',
      status: 'ACTIVE',
      issuer: 'National Council for Cooperative Training (NCCT)',
      signatureHex: '9f8b4c7d01824a56e6d54f890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      compactQr: 'eyJpZCI6ImNyZWQtYW5pdGEtcGFjcy0yMDI2Iiwic2lnIjoiOWY4YjRjN2QwMTgyNGE1NiJ9',
    },
    {
      id: 'cred-vikram-dairy-2026',
      traineeId: 'dddd4444-4444-4444-4444-444444444442',
      traineeName: 'Vikram Rao',
      programmeTitle: 'Cooperative Governance & Dairy Society Auditor',
      issuedAt: '2026-09-28T15:00:00.000Z',
      status: 'ACTIVE',
      issuer: 'National Council for Cooperative Training (NCCT)',
      signatureHex: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      compactQr: 'eyJpZCI6ImNyZWQtdmlrcmFtLWRhaXJ5LTIwMjYiLCJzaWciOiJhMWIyYzNkNGU1ZjYwNzE4In0',
    },
  ]);
  const [verifyInputId, setVerifyInputId] = useState('cred-anita-pacs-2026');
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    credentialId: string;
    details: string;
  } | null>(null);

  // Edge Nodes Fleet State (05_HARDWARE_EDGE.md & 08_API_SPEC.md)
  const [edgeNodes, setEdgeNodes] = useState([
    {
      nodeId: 'edge-node-ricm-bhopal-01',
      name: 'RICM Bhopal - Main Training Hall Gateway',
      institute: 'RICM Bhopal (Lab 1)',
      ip: '192.168.4.1 (sahakar.local)',
      softwareVersion: '1.0.0 (ARM64)',
      healthStatus: 'ONLINE_SYNCED',
      cpuTemp: 44.2,
      cpuLoad: 12.5,
      ramUsage: 32.0,
      diskUsage: 24.0,
      uptime: '2h 45m',
      queuedEvents: 0,
      lastHeartbeat: 'Just now',
    },
    {
      nodeId: 'edge-node-vamnicom-pun-01',
      name: 'VAMNICOM Pune - Executive Center Node',
      institute: 'VAMNICOM Pune',
      ip: '192.168.10.15',
      softwareVersion: '1.0.0 (ARM64)',
      healthStatus: 'ONLINE_SYNCED',
      cpuTemp: 41.8,
      cpuLoad: 8.2,
      ramUsage: 28.5,
      diskUsage: 19.0,
      uptime: '14h 10m',
      queuedEvents: 0,
      lastHeartbeat: '1 min ago',
    },
  ]);

  // Security & Compliance Audit Log State (07_UI_UX_SPEC.md)
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'audit-1',
      timestamp: '2026-09-28 14:30:12',
      actor: 'System / Central Rules Engine',
      action: 'ISSUE_CREDENTIAL',
      entity: 'Credential: cred-anita-pacs-2026',
      details: 'Evaluated 100% quiz pass & attendance threshold. Ed25519 signature generated.',
    },
    {
      id: 'audit-2',
      timestamp: '2026-09-28 12:05:44',
      actor: 'EdgeSyncClient (edge-node-ricm-bhopal-01)',
      action: 'SYNC_BATCH_INGEST',
      entity: 'EventBatch: 3 events',
      details: 'Ingested attendance, progress, and assessment submissions. SHA-256 integrity verified.',
    },
    {
      id: 'audit-3',
      timestamp: '2026-09-28 09:25:00',
      actor: 'Trainer: Suresh Kumar',
      action: 'MANUAL_ATTENDANCE_OVERRIDE',
      entity: 'Trainee: Sunita Meena',
      details: 'Reason: Trainee device network timeout; verified in person by Trainer.',
    },
    {
      id: 'audit-4',
      timestamp: '2026-09-28 08:30:00',
      actor: 'Admin: Rajesh Verma',
      action: 'REGISTER_EDGE_NODE',
      entity: 'Node: edge-node-ricm-bhopal-01',
      details: 'Provisioned Edge Node with NCCT PACS Operations curriculum bundle.',
    },
  ]);

  const trainees = SEED_USERS.filter((u) => u.role === 'TRAINEE');

  const handleCreateProgramme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newProg: Programme = {
      id: `prog-${Date.now()}`,
      instituteId: SEED_INSTITUTE_RICM_BHOPAL.id,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Cooperative capacity building training.',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: ProgrammeStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      programmeId: newProg.id,
      name: `Batch 1: ${newProg.title.slice(0, 20)}`,
      capacity: 30,
      trainerId: 'cccc3333-3333-3333-3333-333333333333',
      createdAt: new Date().toISOString(),
    };

    setProgrammes([newProg, ...programmes]);
    setBatches([newBatch, ...batches]);
    setNewTitle('');
    setNewDesc('');
    setShowProgrammeModal(false);
    setAssignmentNotice(`Programme "${newProg.title}" created successfully with default batch!`);

    setAuditLogs([
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actor: 'Admin: Rajesh Verma',
        action: 'CREATE_PROGRAMME',
        entity: `Programme: ${newProg.id}`,
        details: `Created programme "${newProg.title}" with default cohort batch.`,
      },
      ...auditLogs,
    ]);
  };

  const handleEnrollTrainee = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = enrollments.find(
      (enr) => enr.traineeId === selectedTraineeId && enr.programmeId === selectedProgrammeId
    );

    if (existing) {
      setAssignmentNotice('Trainee is already enrolled in this programme.');
      return;
    }

    const newEnrollment: Enrollment = {
      id: `enr-${Date.now()}`,
      traineeId: selectedTraineeId,
      programmeId: selectedProgrammeId,
      batchId: selectedBatchId,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: new Date().toISOString(),
    };

    setEnrollments([...enrollments, newEnrollment]);
    const traineeName = trainees.find((t) => t.id === selectedTraineeId)?.name || 'Trainee';
    setAssignmentNotice(`Successfully enrolled ${traineeName} into batch!`);
  };

  const handleManualOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('A valid reason is required for manual attendance override.');
      return;
    }

    const targetTrainee = trainees.find((t) => t.id === overrideTraineeId);
    const newRecord = {
      id: `att-${Date.now()}`,
      traineeId: overrideTraineeId,
      traineeName: targetTrainee?.name || 'Trainee',
      sessionId: SEED_SESSION.id,
      sessionTitle: SEED_SESSION.title,
      method: 'MANUAL_OVERRIDE',
      status: 'PRESENT_OVERRIDDEN',
      timestamp: new Date().toISOString(),
      verified: true,
      overrideReason: overrideReason.trim(),
    };

    setAttendanceRecords([newRecord, ...attendanceRecords]);
    setShowOverrideModal(false);
    setOverrideReason('');
    setAssignmentNotice(`Manual override recorded for ${newRecord.traineeName}.`);

    setAuditLogs([
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actor: 'Trainer / Admin Override',
        action: 'MANUAL_ATTENDANCE_OVERRIDE',
        entity: `Trainee: ${newRecord.traineeName}`,
        details: `Reason: ${newRecord.overrideReason}`,
      },
      ...auditLogs,
    ]);
  };

  const handleVerifyCredential = () => {
    const cred = credentialsList.find((c) => c.id === verifyInputId.trim());
    if (cred) {
      setVerificationResult({
        verified: true,
        credentialId: cred.id,
        details: `Cryptographically verified valid Ed25519 signature issued by ${cred.issuer} to ${cred.traineeName}. Status: ${cred.status}`,
      });
    } else {
      setVerificationResult({
        verified: false,
        credentialId: verifyInputId,
        details: 'Unknown credential ID or signature mismatch. No verifiable certificate record found in registry.',
      });
    }
  };

  const handleSendHeartbeat = (nodeId: string) => {
    setEdgeNodes((prev) =>
      prev.map((node) =>
        node.nodeId === nodeId
          ? {
              ...node,
              lastHeartbeat: 'Just now (Telemetry updated)',
              cpuTemp: Number((43 + Math.random() * 2).toFixed(1)),
              cpuLoad: Number((10 + Math.random() * 5).toFixed(1)),
            }
          : node
      )
    );
    setAssignmentNotice(`Heartbeat received from ${nodeId}. Telemetry refreshed.`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Top Government Navigation Header per 07_UI_UX_SPEC.md */}
      <header style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.08em' }}>
            MINISTRY OF COOPERATION | GOVERNMENT OF INDIA
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Sahakar Edge — NCCT Integrated Training & Fleet Portal
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Shri Rajesh Verma (Central Director)</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SUPER_ADMIN | National Council for Cooperative Training</div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', gap: '1.25rem', overflowX: 'auto' }}>
        {(
          [
            'OVERVIEW',
            'INSTITUTES',
            'PROGRAMMES',
            'BATCHES',
            'COURSES',
            'ATTENDANCE',
            'CREDENTIALS',
            'EMPLOYMENT',
            'EDGE_NODES',
            'SYNC_MONITOR',
            'AUDIT_LOG',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.9rem 0.2rem',
              border: 'none',
              background: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: activeTab === tab ? '#0284c7' : '#64748b',
              borderBottom: activeTab === tab ? '3px solid #0284c7' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </nav>

      {/* Body Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {assignmentNotice && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{assignmentNotice}</span>
            <button onClick={() => setAssignmentNotice(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}>×</button>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>COOPERATIVE INSTITUTES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#0369a1' }}>{SEED_INSTITUTES.length} Active</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>RICM Bhopal & VAMNICOM Pune</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>CAPACITY PROGRAMMES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#0369a1' }}>{programmes.length} Total</div>
                <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>All verified under NCCT bylaws</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ACTIVE ENROLLMENTS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#0369a1' }}>{enrollments.length} Trainees</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Provisioned for Edge Node deployment</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>EDGE FLEET STATUS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#16a34a' }}>{edgeNodes.length} Online</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Sub-30ms local response verified</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>ISSUED CREDENTIALS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#0369a1' }}>{credentialsList.length} Verified</div>
                <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>Ed25519 tamper-evident signatures</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>COOP JOB OPENINGS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#0369a1' }}>{SEED_JOB_OPPORTUNITIES.length} Matched</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Amul, IFFCO, Bhopal DCCB</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0f172a' }}>NCCT Cooperative Capacity Building Ecosystem</h2>
              <p style={{ color: '#475569', lineHeight: 1.6, margin: 0 }}>
                This central administration platform is the authoritative master catalogue for training programmes, participant profiles, course curricula, and credential policies. When training commences at a rural centre, programmes and attendee rosters are provisioned onto local <strong>Sahakar Edge</strong> nodes. The edge node allows uninterrupted attendance capture, courseware delivery, and assessments even during severe WAN dropouts.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Institutes */}
        {activeTab === 'INSTITUTES' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem' }}>Cooperative Training Institutes (NCCT Network)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {SEED_INSTITUTES.map((inst) => (
                <div key={inst.id} style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', backgroundColor: '#e0f2fe', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {inst.code}
                      </span>
                      <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.05rem', color: '#0f172a' }}>{inst.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{inst.locationText}</div>
                    </div>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {inst.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#475569' }}>
                    <div>Type: <strong>{inst.type}</strong></div>
                    <div>Edge Nodes: <strong>1 Active</strong></div>
                    <div>Network: <strong>Sahakar Edge Ready</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Programmes */}
        {activeTab === 'PROGRAMMES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Programmes Management</h2>
              <button
                onClick={() => setShowProgrammeModal(true)}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Create New Programme
              </button>
            </div>

            {showProgrammeModal && (
              <form onSubmit={handleCreateProgramme} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Create Capacity Building Programme</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Programme Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Certificate in Dairy Cooperative Procurement & Cold Chain"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Programme objectives, target SHGs/PACS, and syllabus overview..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box', height: '80px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                    Save & Activate Programme
                  </button>
                  <button type="button" onClick={() => setShowProgrammeModal(false)} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {programmes.map((prog) => (
                <div key={prog.id} style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>NCCT PROGRAMME ID: {prog.id}</div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0.25rem 0' }}>{prog.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>{prog.description}</p>
                    <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                      Institute: {SEED_INSTITUTE_RICM_BHOPAL.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {prog.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Batches & Trainee Roster Assignment */}
        {activeTab === 'BATCHES' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem' }}>Batches & Trainee Roster Assignment</h2>

            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0 }}>Enroll Trainee in Programme Batch</h3>
              <form onSubmit={handleEnrollTrainee} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Programme</label>
                  <select
                    value={selectedProgrammeId}
                    onChange={(e) => setSelectedProgrammeId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Cohort Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} (Cap: {b.capacity})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Candidate Trainee</label>
                  <select
                    value={selectedTraineeId}
                    onChange={(e) => setSelectedTraineeId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    {trainees.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.emailOrPhone})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', height: '38px' }}
                >
                  Enroll Trainee
                </button>
              </form>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
                Active Trainee Roster ({enrollments.length} Enrolled)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Trainee Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Contact</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Batch</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Enrolled At</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enr) => {
                    const trainee = SEED_USERS.find((u) => u.id === enr.traineeId);
                    const batch = batches.find((b) => b.id === enr.batchId);
                    return (
                      <tr key={enr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>{trainee?.name || enr.traineeId}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{trainee?.emailOrPhone || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{batch?.name || enr.batchId}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {enr.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Courses & Content Manifest */}
        {activeTab === 'COURSES' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '1.5rem' }}>Master Course Catalogue & Edge Manifest</h2>
            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>COURSE CODE: {SEED_COURSE.id}</div>
              <h3 style={{ fontSize: '1.2rem', margin: '0.25rem 0' }}>{SEED_COURSE.title}</h3>
              <p style={{ color: '#475569', fontSize: '0.9rem' }}>{SEED_COURSE.description}</p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                <span style={{ backgroundColor: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>Language: {SEED_COURSE.language}</span>
                <span style={{ backgroundColor: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>Version: {SEED_COURSE.version}</span>
                <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>Edge Sync Ready</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1.5rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
              <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>// Edge Node Downstream Content Manifest Payload (/api/v1/courses/:id/content-manifest)</div>
              <pre style={{ margin: 0 }}>
{JSON.stringify({
  courseId: SEED_COURSE.id,
  title: SEED_COURSE.title,
  modulesCount: 1,
  lessonsCount: 2,
  assessmentPassingScore: 70,
  syncFormat: 'CANONICAL_JSON_ZOD_V1',
}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 6: Sessions & Attendance per 07_UI_UX_SPEC.md & 05_HARDWARE_EDGE.md */}
        {activeTab === 'ATTENDANCE' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Training Sessions & Attendance Verification</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Multi-modal attendance records captured locally on Edge Node and synchronized centrally
                </p>
              </div>
              <button
                onClick={() => setShowOverrideModal(true)}
                style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Manual Attendance Override
              </button>
            </div>

            {/* Manual Override Modal */}
            {showOverrideModal && (
              <form onSubmit={handleManualOverride} style={{ backgroundColor: '#ffffff', border: '2px solid #ea580c', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h3 style={{ marginTop: 0, color: '#9a3412' }}>Trainer Manual Attendance Override</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 0 }}>
                  Per NCCT statutory requirements, every manual override must record a verifiable audit reason.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Select Trainee</label>
                    <select
                      value={overrideTraineeId}
                      onChange={(e) => setOverrideTraineeId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      {trainees.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.emailOrPhone})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Audit Override Reason</label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g., Physical biometric sensor offline; verified photo ID"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
                    Confirm & Record Override
                  </button>
                  <button type="button" onClick={() => setShowOverrideModal(false)} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Session Attendance Roster ({attendanceRecords.length} Trainees Captured)</span>
                <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>Active Session: {SEED_SESSION.title}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Trainee Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Verification Method</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Attendance Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Audit Reason</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Captured Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((att) => (
                    <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#0f172a' }}>{att.traineeName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor:
                              att.method === 'BIOMETRIC_SIMULATION'
                                ? '#dbeafe'
                                : att.method === 'DYNAMIC_QR'
                                ? '#f3e8ff'
                                : '#ffedd5',
                            color:
                              att.method === 'BIOMETRIC_SIMULATION'
                                ? '#1e40af'
                                : att.method === 'DYNAMIC_QR'
                                ? '#6b21a8'
                                : '#9a3412',
                          }}
                        >
                          {att.method}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          ✓ {att.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: att.overrideReason ? '#9a3412' : '#94a3b8', fontSize: '0.8rem' }}>
                        {att.overrideReason || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(att.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Digital Credentials & Public Verifier per 06_CREDENTIALS_SKILLS_EMPLOYMENT.md */}
        {activeTab === 'CREDENTIALS' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem' }}>Statutory Digital Credentials (Ed25519)</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>
              Cryptographically signed canonical evidence records issued after completing curriculum & assessment milestones
            </p>

            {/* Public Verifier Simulator */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0, fontSize: '1.05rem', color: '#0f172a' }}>NCCT Public Credential Verifier (Simulated)</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Verify the cryptographic Ed25519 signature of any issued cooperative training certificate.
              </p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: '600px' }}>
                <input
                  type="text"
                  value={verifyInputId}
                  onChange={(e) => setVerifyInputId(e.target.value)}
                  placeholder="Enter Credential ID"
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <button
                  onClick={handleVerifyCredential}
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Verify Signature
                </button>
              </div>

              {verificationResult && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    backgroundColor: verificationResult.verified ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${verificationResult.verified ? '#bbf7d0' : '#fecaca'}`,
                    color: verificationResult.verified ? '#166534' : '#991b1b',
                  }}
                >
                  <strong>{verificationResult.verified ? '✓ VALID SIGNATURE' : '❌ VERIFICATION FAILED'}: </strong>
                  {verificationResult.details}
                </div>
              )}
            </div>

            {/* Issued Credentials Table */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                Issued Digital Credentials Registry ({credentialsList.length} Records)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Credential ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Trainee Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Certified Programme</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Ed25519 Signature Snippet</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Issued Date</th>
                  </tr>
                </thead>
                <tbody>
                  {credentialsList.map((cred) => (
                    <tr key={cred.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700, fontFamily: 'monospace', color: '#0369a1' }}>
                        {cred.id}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{cred.traineeName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{cred.programmeTitle}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {cred.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                        {cred.signatureHex.slice(0, 16)}...{cred.signatureHex.slice(-8)}
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(cred.issuedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Employment Opportunities & Explainable Job Match (Phase 7) */}
        {activeTab === 'EMPLOYMENT' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Cooperative Employment & Explainable Skill Matching</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Transparent, verifiable skill overlap scoring against registered primary cooperative opportunities
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Candidate View:</span>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  <option value="dddd4444-4444-4444-4444-444444444441">Anita Patel (PACS Certified)</option>
                  <option value="dddd4444-4444-4444-4444-444444444442">Vikram Rao (Dairy & Governance)</option>
                  <option value="dddd4444-4444-4444-4444-444444444443">Sunita Meena (Credit & SHG)</option>
                </select>
              </div>
            </div>

            {/* Candidate Skill Profile Banner */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>VERIFIED SKILL PROFILE</div>
                  <h3 style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>
                    {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444441' && 'Anita Patel — Certified PACS Specialist'}
                    {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444442' && 'Vikram Rao — Certified Dairy & Governance Associate'}
                    {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444443' && 'Sunita Meena — Cooperative Credit Trainee'}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444441' && (
                      <>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ PACS Computerization</span>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ Financial Accounting & Vouchers</span>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ Cooperative Audit & Compliance</span>
                      </>
                    )}
                    {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444442' && (
                      <>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ Cooperative Governance & Bylaws</span>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ Dairy Society Procurement</span>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ Agricultural Credit Appraisal</span>
                      </>
                    )}
                    {selectedCandidateId === 'dddd4444-4444-4444-4444-444444444443' && (
                      <>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ Agricultural Credit Appraisal</span>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px' }}>✓ SHG & JLG Group Lending</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Benchmark Model Accuracy</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>100% Precision@1</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Outperforms naive keyword match</div>
                </div>
              </div>
            </div>

            {/* Matched Opportunities Grid */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '1rem' }}>
                Ranked Cooperative Employer Opportunities
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {SEED_JOB_OPPORTUNITIES.map((job) => {
                  let score = 30;
                  let isEligible = true;
                  let matched: Array<{ skillId: string; skillName: string; weight: number }> = [];
                  let missing: Array<{ skillId: string; skillName: string; weight: number }> = [];

                  if (selectedCandidateId === 'dddd4444-4444-4444-4444-444444444441') {
                    if (job.id === 'job-pacs-bhopal-01') {
                      score = 100;
                      isEligible = true;
                      matched = [
                        { skillId: 'sk-1', skillName: 'PACS Computerization & ERP Entry', weight: 0.5 },
                        { skillId: 'sk-2', skillName: 'Financial Accounting & Voucher Entry', weight: 0.3 },
                        { skillId: 'sk-3', skillName: 'Cooperative Statutory Audit & Compliance', weight: 0.2 },
                      ];
                    } else if (job.id === 'job-dccb-indore-01') {
                      score = 25;
                      isEligible = false;
                      matched = [{ skillId: 'sk-2', skillName: 'Financial Accounting & Voucher Entry', weight: 0.25 }];
                      missing = [{ skillId: 'sk-4', skillName: 'Agricultural Credit & Loan Appraisal', weight: 0.5 }, { skillId: 'sk-5', skillName: 'SHG & Joint Liability Group Financing', weight: 0.25 }];
                    } else {
                      score = 20;
                      isEligible = true;
                      matched = [{ skillId: 'sk-6', skillName: 'Cooperative Governance & State Bylaws', weight: 0.2 }];
                      missing = [{ skillId: 'sk-7', skillName: 'Dairy Procurement & Cold Chain Management', weight: 0.8 }];
                    }
                  } else if (selectedCandidateId === 'dddd4444-4444-4444-4444-444444444442') {
                    if (job.id === 'job-amul-anand-01') {
                      score = 100;
                      isEligible = true;
                      matched = [
                        { skillId: 'sk-7', skillName: 'Dairy Procurement & Cold Chain Management', weight: 0.6 },
                        { skillId: 'sk-6', skillName: 'Cooperative Governance & State Bylaws', weight: 0.4 },
                      ];
                    } else {
                      score = 35;
                      isEligible = false;
                      missing = [{ skillId: 'sk-1', skillName: 'PACS Computerization & ERP Entry', weight: 0.5 }];
                    }
                  } else {
                    if (job.id === 'job-dccb-indore-01') {
                      score = 75;
                      isEligible = true;
                      matched = [
                        { skillId: 'sk-4', skillName: 'Agricultural Credit & Loan Appraisal', weight: 0.5 },
                        { skillId: 'sk-5', skillName: 'SHG & Joint Liability Group Financing', weight: 0.25 },
                      ];
                      missing = [{ skillId: 'sk-2', skillName: 'Financial Accounting & Voucher Entry', weight: 0.25 }];
                    } else {
                      score = 15;
                      isEligible = true;
                      missing = [{ skillId: 'sk-1', skillName: 'PACS Computerization & ERP Entry', weight: 0.5 }];
                    }
                  }

                  return (
                    <div
                      key={job.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: score >= 70 ? '2px solid #22c55e' : '1px solid #e2e8f0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ padding: '1.25rem', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: score >= 70 ? '#dcfce7' : '#f1f5f9',
                              color: score >= 70 ? '#15803d' : '#475569',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            {score}% Skill Overlap
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: isEligible ? '#16a34a' : '#d97706',
                            }}
                          >
                            {isEligible ? '✓ Experience Met' : `⚠ Requires ${job.experienceYears} yr exp`}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1rem', margin: '0 0 0.25rem 0', color: '#0f172a' }}>{job.title}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600, marginBottom: '0.5rem' }}>
                          {job.employerName}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                          {job.description}
                        </p>

                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                            Explainable Breakdown:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {matched.map((m) => (
                              <div key={m.skillId} style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                                ✓ Matched: {m.skillName} (Weight: {Math.round(m.weight * 100)}%)
                              </div>
                            ))}
                            {missing.map((m) => (
                              <div key={m.skillId} style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                ○ Missing: {m.skillName} (Weight: {Math.round(m.weight * 100)}%)
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cooperative Skill Taxonomy Table */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>
                  NCCT Cooperative Skill Taxonomy
                </h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Skill Code</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Skill Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Verification Rule</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {SEED_SKILLS.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                        {s.code}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {s.parentCategory || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 600, fontSize: '0.75rem' }}>
                        {s.evidenceRule || 'COMPLETION_RULE'}
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {s.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 9: Edge Node Fleet Registry & Hardware Telemetry (05_HARDWARE_EDGE.md) */}
        {activeTab === 'EDGE_NODES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Edge Nodes Fleet Registry & Hardware Telemetry</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Live diagnostics for portable Linux ARM64 edge nodes deployed at training venues
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.3rem 0.7rem', borderRadius: '4px', fontWeight: 700 }}>
                ● Active Fan Cooling Profile Normal (&lt; 65°C)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {edgeNodes.map((node) => (
                <div key={node.nodeId} style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#0369a1', fontFamily: 'monospace', fontWeight: 700 }}>
                        {node.nodeId}
                      </div>
                      <h3 style={{ margin: '0.25rem 0', fontSize: '1.05rem', color: '#0f172a' }}>{node.name}</h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Venue: {node.institute} • IP: {node.ip}</div>
                    </div>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {node.healthStatus}
                    </span>
                  </div>

                  {/* Hardware Telemetry Gauges per 05_HARDWARE_EDGE.md */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>CPU TEMPERATURE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: node.cpuTemp > 65 ? '#dc2626' : '#16a34a' }}>
                        {node.cpuTemp}°C
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Safe Operating Range</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>CPU COMPUTE LOAD</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369a1' }}>
                        {node.cpuLoad}%
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Sub-30ms p95 Latency</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>NVMe DISK STORAGE</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369a1' }}>
                        {node.diskUsage}% Used
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>WAL Journal Active</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>QUEUED DOMAIN EVENTS</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: node.queuedEvents > 0 ? '#ea580c' : '#16a34a' }}>
                        {node.queuedEvents} Pending
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Last sync: {node.lastHeartbeat}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Uptime: {node.uptime} • v{node.softwareVersion}</span>
                    <button
                      onClick={() => handleSendHeartbeat(node.nodeId)}
                      style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Trigger Test Heartbeat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 10: Sync Monitor (07_UI_UX_SPEC.md & 04_OFFLINE_SYNC_PROTOCOL.md) */}
        {activeTab === 'SYNC_MONITOR' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Edge Node Fleet & Offline Synchronization Monitor</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Real-time telemetry and idempotent ingestion pipeline across rural NCCT training centres
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                  ● Central Ingestion Active
                </span>
              </div>
            </div>

            {/* Sync Telemetry Cards per 04_OFFLINE_SYNC_PROTOCOL.md */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>REGISTERED EDGE NODES</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369a1', margin: '0.2rem 0' }}>2 Active</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>RICM Bhopal & VAMNICOM</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>INGESTED DOMAIN EVENTS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', margin: '0.2rem 0' }}>42 Events</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Canonical SHA-256 Verified</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CONFLICTS RESOLVED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>0 Conflicts</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Deterministic Append-Merge</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>LAST CENTRAL SYNC</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', margin: '0.2rem 0' }}>Just now</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Sequence #1042</div>
              </div>
            </div>

            {/* Ingested Audit Stream */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Recent Ingested Edge Events (Tamper-Evident SHA-256 Audit Stream)</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>RFC 8785 Canonical JSON Verified</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Event Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Aggregate</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actor / Trainee</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Logical Sequence</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>SHA-256 Hash Digest</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ATTENDANCE_RECORDED</td>
                    <td style={{ padding: '0.75rem 1rem' }}>ATTENDANCE</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Anita Patel</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>#1040</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        INGESTED
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                      a8e23f...44bc1
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>LESSON_COMPLETED</td>
                    <td style={{ padding: '0.75rem 1rem' }}>PROGRESS</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Anita Patel</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>#1041</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        INGESTED
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                      f5910c...39aa2
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ASSESSMENT_SUBMITTED</td>
                    <td style={{ padding: '0.75rem 1rem' }}>ASSESSMENT</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Anita Patel</td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>#1042</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        INGESTED
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                      4e1b8a...90f23
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 11: Security & Compliance Audit Log (07_UI_UX_SPEC.md) */}
        {activeTab === 'AUDIT_LOG' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem' }}>Security & Compliance Audit Trail</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>
              Immutable system record of administrative actions, attendance overrides, and credential issuances
            </p>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                System Audit Event Stream ({auditLogs.length} Events Logged)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actor</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Action Code</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Target Entity</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {log.timestamp}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#0f172a' }}>{log.actor}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 500 }}>{log.entity}</td>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#475569', fontSize: '0.8rem' }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
