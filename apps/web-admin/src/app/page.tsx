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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Certificate Modal State
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);

  // Mobile Simulator State
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [simWanMode, setSimWanMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [simAttendanceCheckedIn, setSimAttendanceCheckedIn] = useState(false);
  const [simCompletedLessons, setSimCompletedLessons] = useState<string[]>(['lsn-pacs-101-1']);
  const [simAssessmentDone, setSimAssessmentDone] = useState(false);
  const [simQueuedEvents, setSimQueuedEvents] = useState<Array<{ id: string; type: string; summary: string; timestamp: string }>>([
    { id: 'ev-init-01', type: 'ENROLLMENT_CONFIRMED', summary: 'Trainee Anita Patel rostered onto RICM Node', timestamp: '09:00 AM' },
  ]);

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
      skills: ['PACS Computerization', 'Financial Accounting & Vouchers', 'Cooperative Audit & Compliance'],
      institute: 'Regional Institute of Cooperative Management (RICM), Bhopal',
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
      skills: ['Cooperative Governance & Bylaws', 'Dairy Society Procurement', 'Agricultural Credit Appraisal'],
      institute: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM), Pune',
    },
  ]);
  const [verifyInputId, setVerifyInputId] = useState('cred-anita-pacs-2026');
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    credentialId: string;
    details: string;
    publicKey?: string;
    sha256Digest?: string;
    issuer?: string;
    tamperCheck?: string;
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
      cpuLoad: 14.5,
      ramUsage: 34.0,
      diskUsage: 22.0,
      uptime: '3h 12m',
      queuedEvents: 0,
      lastHeartbeat: 'Just now',
      wifiClients: 16,
      localLatencyMs: 18,
      wanLatencyMs: 410,
      wanConnected: true,
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
      uptime: '14h 40m',
      queuedEvents: 0,
      lastHeartbeat: '1 min ago',
      wifiClients: 12,
      localLatencyMs: 22,
      wanLatencyMs: 385,
      wanConnected: true,
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

  // Simulator Actions
  const handleSimAttendance = () => {
    if (simAttendanceCheckedIn) return;
    setSimAttendanceCheckedIn(true);
    const event = {
      id: `ev-att-${Date.now()}`,
      type: 'ATTENDANCE_RECORDED',
      summary: 'Dynamic QR attendance scanned for Session 1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSimQueuedEvents((prev) => [event, ...prev]);

    // Update node queue count
    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01' ? { ...n, queuedEvents: n.queuedEvents + 1 } : n
      )
    );

    if (simWanMode === 'ONLINE') {
      // Auto sync if online
      triggerCentralSyncFromSim([event]);
    }
  };

  const handleSimCompleteLesson = (lessonId: string) => {
    if (simCompletedLessons.includes(lessonId)) return;
    const nextLessons = [...simCompletedLessons, lessonId];
    setSimCompletedLessons(nextLessons);
    const event = {
      id: `ev-lsn-${Date.now()}`,
      type: 'LESSON_COMPLETED',
      summary: `Completed Lesson: ${lessonId}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSimQueuedEvents((prev) => [event, ...prev]);

    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01' ? { ...n, queuedEvents: n.queuedEvents + 1 } : n
      )
    );

    if (simWanMode === 'ONLINE') {
      triggerCentralSyncFromSim([event]);
    }
  };

  const handleSimSubmitAssessment = () => {
    if (simAssessmentDone) return;
    setSimAssessmentDone(true);
    const event = {
      id: `ev-exam-${Date.now()}`,
      type: 'ASSESSMENT_SUBMITTED',
      summary: 'Passed PACS Operations Quiz (100% score)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSimQueuedEvents((prev) => [event, ...prev]);

    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01' ? { ...n, queuedEvents: n.queuedEvents + 1 } : n
      )
    );

    if (simWanMode === 'ONLINE') {
      triggerCentralSyncFromSim([event]);
    }
  };

  const triggerCentralSyncFromSim = (eventsToSync = simQueuedEvents) => {
    if (eventsToSync.length === 0) return;

    // 1. Add attendance record if present in synced events
    const hasAtt = eventsToSync.some((e) => e.type === 'ATTENDANCE_RECORDED');
    if (hasAtt) {
      const exists = attendanceRecords.some((a) => a.traineeId === 'dddd4444-4444-4444-4444-444444444441' && a.method === 'DYNAMIC_QR');
      if (!exists) {
        setAttendanceRecords((prev) => [
          {
            id: `att-sim-${Date.now()}`,
            traineeId: 'dddd4444-4444-4444-4444-444444444441',
            traineeName: 'Anita Patel',
            sessionId: SEED_SESSION.id,
            sessionTitle: SEED_SESSION.title,
            method: 'DYNAMIC_QR',
            status: 'PRESENT',
            timestamp: new Date().toISOString(),
            verified: true,
            overrideReason: null,
          },
          ...prev,
        ]);
      }
    }

    // 2. If assessment is submitted, add audit log and issue credential
    const hasExam = eventsToSync.some((e) => e.type === 'ASSESSMENT_SUBMITTED');
    if (hasExam) {
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          actor: 'EdgeSyncClient (edge-node-ricm-bhopal-01)',
          action: 'EVALUATE_CREDENTIAL_ISSUANCE',
          entity: 'Trainee: Anita Patel',
          details: 'All curriculum lessons completed (100%) and assessment passed. Ed25519 signature verified.',
        },
        ...prev,
      ]);
    }

    // 3. Clear simulated queue and update node status
    setSimQueuedEvents([]);
    setEdgeNodes((nodes) =>
      nodes.map((n) =>
        n.nodeId === 'edge-node-ricm-bhopal-01'
          ? { ...n, queuedEvents: 0, lastHeartbeat: 'Just now (Synced)' }
          : n
      )
    );

    setAssignmentNotice(`Idempotent sync complete! ${eventsToSync.length} domain events ingested and verified.`);
  };

  const handleToggleNodeWan = (nodeId: string) => {
    setEdgeNodes((nodes) =>
      nodes.map((n) => {
        if (n.nodeId === nodeId) {
          const nextWan = !n.wanConnected;
          return {
            ...n,
            wanConnected: nextWan,
            healthStatus: nextWan ? 'ONLINE_SYNCED' : 'OFFLINE_PARTITIONED',
          };
        }
        return n;
      })
    );
  };

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
    const cred = credentialsList.find((c) => c.id.toLowerCase() === verifyInputId.trim().toLowerCase());
    if (cred) {
      setVerificationResult({
        verified: true,
        credentialId: cred.id,
        details: `Ed25519 digital signature verified against NCCT Authority Public Key. The canonical JSON digest matches 100%. No modifications detected since offline issuance.`,
        publicKey: 'ed25519:ncct_root_auth_2026_pubkey_9a4f82bc',
        sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        issuer: cred.issuer,
        tamperCheck: '0 bytes altered — Bit-exact canonical payload',
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Indian National Tri-Color Accent Ribbon */}
      <div style={{ height: '4px', width: '100%', display: 'flex' }}>
        <div style={{ flex: 1, backgroundColor: '#f97316' }} />
        <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
        <div style={{ flex: 1, backgroundColor: '#16a34a' }} />
      </div>

      {/* Top Government Navigation Header */}
      <header style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '0.9rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Emblem Icon */}
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#1e293b', border: '2px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', boxShadow: '0 0 10px rgba(56,189,248,0.3)' }}>
            🏛️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.08em' }}>
                MINISTRY OF COOPERATION | भारत सरकार
              </span>
              <span style={{ backgroundColor: '#0369a1', color: '#e0f2fe', fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                सहकार से समृद्धि
              </span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.01em', marginTop: '0.1rem' }}>
              Sahakar Edge <span style={{ color: '#94a3b8', fontWeight: 400 }}>— NCCT Central Fleet & Training Portal</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Live Trainee Mobile Simulator Toggle Button */}
          <button
            onClick={() => setShowMobileSimulator(!showMobileSimulator)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: showMobileSimulator ? '#0284c7' : '#1e293b',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              padding: '0.5rem 0.9rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: showMobileSimulator ? '0 0 12px rgba(2,132,199,0.5)' : 'none',
            }}
          >
            <span>📱</span>
            <span>{showMobileSimulator ? 'Hide Trainee Simulator' : '📱 Live Trainee View (Simulator)'}</span>
            {simQueuedEvents.length > 0 && (
              <span style={{ backgroundColor: '#ea580c', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                {simQueuedEvents.length}
              </span>
            )}
          </button>

          <div style={{ textAlign: 'right', borderLeft: '1px solid #334155', paddingLeft: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Shri Rajesh Verma</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>SUPER_ADMIN | Central Director (NCCT)</div>
          </div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', gap: '1.25rem', overflowX: 'auto', position: 'sticky', top: 0, zIndex: 10 }}>
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
              fontWeight: activeTab === tab ? 700 : 500,
              whiteSpace: 'nowrap',
              color: activeTab === tab ? '#0284c7' : '#64748b',
              borderBottom: activeTab === tab ? '3px solid #0284c7' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span>{tab.replace('_', ' ')}</span>
            {tab === 'EDGE_NODES' && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
            )}
          </button>
        ))}
      </nav>

      {/* Body Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1360px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {assignmentNotice && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ fontWeight: 600 }}>✓ {assignmentNotice}</span>
            <button onClick={() => setAssignmentNotice(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>×</button>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'OVERVIEW' && (
          <div>
            {/* Government Mission Banner */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '12px', padding: '1.75rem 2rem', color: '#ffffff', marginBottom: '2rem', border: '1px solid #334155', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '820px' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                  Smart India Hackathon • Problem Statement PS 26087
                </div>
                <h1 style={{ fontSize: '1.6rem', margin: '0 0 0.5rem 0', fontWeight: 800 }}>
                  National Offline-First Cooperative Training Infrastructure
                </h1>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  Empowering rural PACS (Primary Agricultural Credit Societies), dairy federations, and cooperative banks with continuous learning, biometric attendance, and Ed25519 tamper-evident credentials—resilient against prolonged WAN dropouts.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#93c5fd' }}>
                    <span>✓</span> <span>Zero-Data-Loss SQLite WAL Journal</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#93c5fd' }}>
                    <span>✓</span> <span>Local Edge Latency &lt; 30ms</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#93c5fd' }}>
                    <span>✓</span> <span>Ed25519 Cryptographic Signatures</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>COOPERATIVE INSTITUTES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#0369a1' }}>{SEED_INSTITUTES.length} Active</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>RICM Bhopal & VAMNICOM Pune</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CAPACITY PROGRAMMES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#0369a1' }}>{programmes.length} Total</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>NCCT Bylaw Verified</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ROSTERED TRAINEES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#0369a1' }}>{enrollments.length} Enrolled</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Edge Nodes Synced</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACTIVE EDGE FLEET</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#16a34a' }}>{edgeNodes.length} Online</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>● 28 Local Wi-Fi Clients</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.25rem 1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>VERIFIED CREDENTIALS</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0', color: '#0369a1' }}>{credentialsList.length} Issued</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Ed25519 Tamper-Proof</div>
              </div>
            </div>

            {/* Quick Actions & Demonstration Guide */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1rem', marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📱</span> <span>Interactive Trainee PWA Preview</span>
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Launch the live Trainee Mobile Simulator directly within this portal. Simulate a complete rural offline scenario: disconnect simulated WAN, mark QR attendance, pass the quiz, and sync back to Central.
                </p>
                <button
                  onClick={() => setShowMobileSimulator(true)}
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}
                >
                  Open Live Trainee Simulator →
                </button>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1rem', marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚡</span> <span>Hardware Edge Node Health</span>
                </h3>
                <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Monitor ARM64 edge node thermal health, SQLite WAL disk space, and captive portal traffic across training centers like RICM Bhopal and VAMNICOM Pune.
                </p>
                <button
                  onClick={() => setActiveTab('EDGE_NODES')}
                  style={{ backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}
                >
                  View Edge Node Fleet →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Institutes */}
        {activeTab === 'INSTITUTES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Registered Cooperative Training Institutes</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Authorized NCCT apex and regional institutes operating Sahakar Edge field nodes
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {SEED_INSTITUTES.map((inst) => (
                <div key={inst.id} style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                        {inst.code}
                      </span>
                      <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.1rem' }}>{inst.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{inst.locationText}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>● Edge Gateway Online</span>
                    <span style={{ color: '#64748b' }}>Capacity: 120 Trainees</span>
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
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Capacity Building Programmes Catalogue</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Official NCCT cooperative curricula provisioned onto local Edge nodes
                </p>
              </div>
              <button
                onClick={() => setShowProgrammeModal(true)}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                + Add New Programme
              </button>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Programme Title</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Institute</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Start Date</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {programmes.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 700, color: '#0f172a' }}>{p.title}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>RICM Bhopal</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{new Date(p.startAt).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem 1.5rem' }}>
                        <button
                          onClick={() => {
                            setSelectedProgrammeId(p.id);
                            setActiveTab('BATCHES');
                          }}
                          style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 700, cursor: 'pointer' }}
                        >
                          View Batches →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Batches & Enrollments */}
        {activeTab === 'BATCHES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Cohort Batches & Trainee Rosters</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Assign trainees to training cohorts and deploy rosters to physical edge hardware
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                  Enrolled Trainees ({enrollments.length})
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '0.75rem 1.5rem' }}>Trainee Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Assigned Batch</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1.5rem' }}>Enrolled At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enr) => {
                      const traineeObj = SEED_USERS.find((u) => u.id === enr.traineeId);
                      const batchObj = batches.find((b) => b.id === enr.batchId);
                      return (
                        <tr key={enr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>{traineeObj?.name || 'Trainee'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{batchObj?.name || 'Batch 1'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {enr.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1.5rem', color: '#64748b' }}>
                            {new Date(enr.enrolledAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Roster Assignment Form */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                <h3 style={{ marginTop: 0, fontSize: '0.95rem', color: '#0f172a' }}>Enroll Candidate to Batch</h3>
                <form onSubmit={handleEnrollTrainee} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Trainee</label>
                    <select
                      value={selectedTraineeId}
                      onChange={(e) => setSelectedTraineeId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      {trainees.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.emailOrPhone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Programme</label>
                    <select
                      value={selectedProgrammeId}
                      onChange={(e) => setSelectedProgrammeId(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.5rem' }}
                  >
                    Confirm Roster Enrollment
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Courses */}
        {activeTab === 'COURSES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Curriculum & Offline Courseware Packages</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Standardized NCCT educational modules cached locally on edge SSDs
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                    NCCT-CRS-101 • v{SEED_COURSE.version} ({SEED_COURSE.language.toUpperCase()})
                  </span>
                  <h3 style={{ fontSize: '1.15rem', margin: '0.4rem 0 0.25rem 0' }}>{SEED_COURSE.title}</h3>
                  <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>{SEED_COURSE.description}</p>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  Offline Package Cached (38 MB)
                </span>
              </div>

              <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '1rem', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#334155' }}>Structured Curriculum Modules:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span>Module 1: Cooperative Principles & Statutory PACS Governance</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Ready Offline</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span>Module 2: Day-Book, General Ledger & Multi-Voucher Posting</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Ready Offline</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span>Module 3: Cooperative Audit, NABARD Guidelines & Inspection</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>Ready Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Attendance */}
        {activeTab === 'ATTENDANCE' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Attendance Ledger & Biometric Simulation</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Audited local check-ins via Dynamic QR, biometric capture, and authorized trainer manual overrides
                </p>
              </div>
              <button
                onClick={() => setShowOverrideModal(true)}
                style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                + Manual Attendance Override
              </button>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Trainee Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Session</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Audit / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((att) => (
                    <tr key={att.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>{att.traineeName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{att.sessionTitle}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                          {att.method}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ backgroundColor: att.status === 'PRESENT' ? '#dcfce7' : '#fef3c7', color: att.status === 'PRESENT' ? '#166534' : '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {att.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                        {att.overrideReason || 'Verified via Local Edge Node'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: Digital Credentials */}
        {activeTab === 'CREDENTIALS' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Statutory Digital Credentials (Ed25519)</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Cryptographically signed canonical evidence records issued after completing curriculum & assessment milestones
                </p>
              </div>
            </div>

            {/* Public Verifier Simulator */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔍</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a' }}>NCCT Public Credential Verifier</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem', marginBottom: '1rem' }}>
                Verify the cryptographic Ed25519 signature of any cooperative training certificate issued either online or offline by an edge node.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', maxWidth: '640px' }}>
                <input
                  type="text"
                  value={verifyInputId}
                  onChange={(e) => setVerifyInputId(e.target.value)}
                  placeholder="Enter Credential ID (e.g. cred-anita-pacs-2026)"
                  style={{ flex: 1, padding: '0.65rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={handleVerifyCredential}
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Verify Signature
                </button>
              </div>

              {verificationResult && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    backgroundColor: verificationResult.verified ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${verificationResult.verified ? '#bbf7d0' : '#fecaca'}`,
                    color: verificationResult.verified ? '#166534' : '#991b1b',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{verificationResult.verified ? '✓' : '❌'}</span>
                    <strong style={{ fontSize: '1rem' }}>
                      {verificationResult.verified ? 'CRYPTOGRAPHICALLY VALID ED25519 SIGNATURE' : 'VERIFICATION FAILED'}
                    </strong>
                  </div>
                  <p style={{ margin: '0 0 0.75rem 0', lineHeight: 1.5 }}>{verificationResult.details}</p>

                  {verificationResult.verified && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #bbf7d0', fontSize: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#166534' }}>AUTHORITY PUBLIC KEY</div>
                        <div style={{ fontFamily: 'monospace', color: '#047857' }}>{verificationResult.publicKey}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#166534' }}>CANONICAL SHA-256 HASH</div>
                        <div style={{ fontFamily: 'monospace', color: '#047857' }}>{verificationResult.sha256Digest}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#166534' }}>TAMPER DETECTION</div>
                        <div style={{ fontWeight: 600, color: '#15803d' }}>{verificationResult.tamperCheck}</div>
                      </div>
                    </div>
                  )}
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
                    <th style={{ padding: '0.75rem 1.5rem' }}>Official Certificate</th>
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
                      <td style={{ padding: '0.75rem 1.5rem' }}>
                        <button
                          onClick={() => setSelectedCertificate(cred)}
                          style={{
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            color: '#0369a1',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          📜 View Certificate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Employment */}
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

            {/* Job Match Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {SEED_JOB_OPPORTUNITIES.map((job) => {
                const reqs = SEED_JOB_REQUIRED_SKILLS.filter((r) => r.jobId === job.id);
                const isAnita = selectedCandidateId === 'dddd4444-4444-4444-4444-444444444441';
                const score = isAnita ? (job.title.includes('PACS') ? 95 : 65) : 55;

                return (
                  <div key={job.id} style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: score >= 75 ? '#dcfce7' : '#f1f5f9', color: score >= 75 ? '#15803d' : '#475569', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {score}% Skill Overlap
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{job.location}</span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', margin: '0.5rem 0 0.2rem 0' }}>{job.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600, marginBottom: '0.5rem' }}>{job.employerName}</div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>{job.description}</p>
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>Required Competencies:</div>
                      {reqs.map((r) => (
                        <div key={r.skillId} style={{ color: '#16a34a', fontWeight: 600, marginTop: '0.15rem' }}>
                          ✓ {r.skillName} (Weight: {Math.round(r.weight * 100)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 9: Edge Node Fleet Registry & Hardware Telemetry (05_HARDWARE_EDGE.md) */}
        {activeTab === 'EDGE_NODES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Edge Nodes Fleet Registry & Hardware Telemetry</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Live diagnostics for portable Linux ARM64 edge nodes deployed at rural training venues
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '0.3rem 0.7rem', borderRadius: '4px', fontWeight: 700 }}>
                  ● Active Fan Cooling Profile Normal (&lt; 50°C)
                </span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.3rem 0.7rem', borderRadius: '4px', fontWeight: 700 }}>
                  SQLite WAL Active (Zero Corruption)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
              {edgeNodes.map((node) => {
                const tempColor = node.cpuTemp < 48 ? '#16a34a' : node.cpuTemp < 65 ? '#d97706' : '#dc2626';
                return (
                  <div key={node.nodeId} style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#0369a1', fontFamily: 'monospace', fontWeight: 800 }}>
                          {node.nodeId}
                        </div>
                        <h3 style={{ margin: '0.25rem 0 0.15rem 0', fontSize: '1.15rem', color: '#0f172a' }}>{node.name}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Venue: {node.institute} • IP: {node.ip}</div>
                      </div>
                      <span
                        style={{
                          backgroundColor: node.wanConnected ? '#dcfce7' : '#fee2e2',
                          color: node.wanConnected ? '#166534' : '#991b1b',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: node.wanConnected ? '#16a34a' : '#dc2626' }} />
                        {node.healthStatus}
                      </span>
                    </div>

                    {/* Hardware Telemetry SVG & Progress Meters */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        {/* Thermal Gauge */}
                        <div style={{ backgroundColor: '#ffffff', padding: '0.9rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                            <span>CPU TEMPERATURE</span>
                            <span style={{ color: tempColor }}>{node.cpuTemp}°C</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (node.cpuTemp / 80) * 100)}%`, height: '100%', backgroundColor: tempColor, transition: 'all 0.3s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>Optimal Range (&lt; 65°C)</div>
                        </div>

                        {/* Compute Load */}
                        <div style={{ backgroundColor: '#ffffff', padding: '0.9rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                            <span>CPU COMPUTE LOAD</span>
                            <span style={{ color: '#0369a1' }}>{node.cpuLoad}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${node.cpuLoad}%`, height: '100%', backgroundColor: '#0284c7', transition: 'all 0.3s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>ARM64 Quad-Core 1.8GHz</div>
                        </div>

                        {/* RAM Usage */}
                        <div style={{ backgroundColor: '#ffffff', padding: '0.9rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                            <span>RAM ALLOCATION</span>
                            <span style={{ color: '#0369a1' }}>{node.ramUsage}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${node.ramUsage}%`, height: '100%', backgroundColor: '#0284c7', transition: 'all 0.3s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>1.36 GB / 4.00 GB LPDDR4</div>
                        </div>

                        {/* NVMe Storage */}
                        <div style={{ backgroundColor: '#ffffff', padding: '0.9rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                            <span>NVMe STORAGE (WAL)</span>
                            <span style={{ color: '#0369a1' }}>{node.diskUsage}%</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${node.diskUsage}%`, height: '100%', backgroundColor: '#0284c7', transition: 'all 0.3s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.35rem' }}>14.2 GB / 64 GB SSD</div>
                        </div>
                      </div>

                      {/* Captive Wi-Fi Clients & Latency Benchmarks */}
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700 }}>
                          <span>📶</span>
                          <span>{node.wifiClients} Trainees Connected (SSID: SahakarEdge-Free)</span>
                        </div>
                        <div style={{ color: '#475569' }}>
                          Local: <strong style={{ color: '#16a34a' }}>{node.localLatencyMs}ms</strong> vs Cloud: <strong style={{ color: '#ea580c' }}>{node.wanLatencyMs}ms</strong>
                        </div>
                      </div>
                    </div>

                    {/* Node Controls: Heartbeat & WAN Partition Simulation */}
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Uptime: {node.uptime} • Events Queued: <strong style={{ color: node.queuedEvents > 0 ? '#ea580c' : '#16a34a' }}>{node.queuedEvents}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleToggleNodeWan(node.nodeId)}
                          style={{
                            backgroundColor: node.wanConnected ? '#fee2e2' : '#dcfce7',
                            color: node.wanConnected ? '#991b1b' : '#166534',
                            border: `1px solid ${node.wanConnected ? '#fca5a5' : '#86efac'}`,
                            padding: '0.35rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {node.wanConnected ? '⚡ Cut WAN (Simulate Dropout)' : '🌐 Restore WAN (Reconnect)'}
                        </button>
                        <button
                          onClick={() => handleSendHeartbeat(node.nodeId)}
                          style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Send Heartbeat
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 10: Sync Monitor */}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>REGISTERED EDGE NODES</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369a1', margin: '0.2rem 0' }}>2 Active</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>RICM Bhopal & VAMNICOM</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>INGESTED DOMAIN EVENTS</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', margin: '0.2rem 0' }}>46 Events</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Canonical SHA-256 Verified</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CONFLICTS DETECTED</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>0 Conflicts</div>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>Deterministic Append-Merge</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>LAST INGESTION BATCH</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7', margin: '0.2rem 0' }}>Just now</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Batch Sequence #1048</div>
              </div>
            </div>

            {/* Ingestion Stream */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '0.9rem' }}>
                Recent Ingested Event Records (Idempotent Merged Stream)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Event Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Origin Node</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Entity Subject</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.5rem' }}>SHA-256 Digest</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>ATTENDANCE_RECORDED</td>
                    <td style={{ padding: '0.75rem 1rem' }}>edge-node-ricm-bhopal-01</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Anita Patel</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        INGESTED
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                      8b9f4c...01824a
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}>LESSON_COMPLETED</td>
                    <td style={{ padding: '0.75rem 1rem' }}>edge-node-ricm-bhopal-01</td>
                    <td style={{ padding: '0.75rem 1rem' }}>lsn-pacs-101-1</td>
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
                    <td style={{ padding: '0.75rem 1rem' }}>edge-node-ricm-bhopal-01</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Anita Patel</td>
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

        {/* Tab 11: Audit Log */}
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

      {/* ==========================================================
          MODAL: Official NCCT Ed25519 Certificate Preview
      ========================================================== */}
      {selectedCertificate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#fefefe',
              borderRadius: '12px',
              maxWidth: '760px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              position: 'relative',
              border: '8px solid #b45309',
            }}
          >
            {/* Top Certificate Header Band */}
            <div style={{ backgroundColor: '#0f172a', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏛️</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800 }}>MINISTRY OF COOPERATION | भारत सरकार</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>National Council for Cooperative Training (NCCT)</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCertificate(null)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 700 }}
              >
                ×
              </button>
            </div>

            {/* Certificate Body (Official Styled Parchment) */}
            <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#fffdfa', border: '2px solid #fde68a', margin: '1rem' }}>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.15em', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                Autonomous Society Promoted by Ministry of Cooperation, Govt. of India
              </div>
              <h1 style={{ fontSize: '1.75rem', margin: '0.75rem 0 0.25rem 0', color: '#0f172a', fontFamily: 'serif', fontWeight: 800, letterSpacing: '0.04em' }}>
                Certificate of Cooperative Competency
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                Issued under the Statutory Framework for PACS Modernization & Computerization
              </div>

              <div style={{ fontSize: '0.95rem', color: '#334155' }}>This is to certify that</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0369a1', margin: '0.25rem 0 0.5rem 0', fontFamily: 'serif' }}>
                {selectedCertificate.traineeName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '560px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                has successfully completed all prescribed offline modules, practical exercises, and passed the comprehensive statutory evaluation for:
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '0.75rem 1.5rem', borderRadius: '6px', display: 'inline-block', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534' }}>
                  {selectedCertificate.programmeTitle}
                </span>
              </div>

              {/* Skills breakdown */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {selectedCertificate.skills?.map((sk: string) => (
                  <span key={sk} style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                    ✓ {sk}
                  </span>
                ))}
              </div>

              {/* Footnote & Cryptographic Seals */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1', textAlign: 'left', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontWeight: 700 }}>VENUE & INSTITUTE</div>
                  <div style={{ color: '#0f172a', fontWeight: 600 }}>{selectedCertificate.institute || 'RICM Bhopal'}</div>
                  <div style={{ color: '#64748b', marginTop: '0.2rem' }}>Issued: {new Date(selectedCertificate.issuedAt).toLocaleDateString()}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', margin: '0 auto 0.25rem auto', border: '2px solid #b45309', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', backgroundColor: '#fef3c7' }}>
                    🛡️
                  </div>
                  <div style={{ color: '#b45309', fontWeight: 800, fontSize: '0.7rem' }}>SEAL OF VERIFICATION</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Ed25519 Signed</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#64748b', fontWeight: 700 }}>CREDENTIAL ID & DIGEST</div>
                  <div style={{ fontFamily: 'monospace', color: '#0369a1', fontWeight: 700 }}>{selectedCertificate.id}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                    Sig: {selectedCertificate.signatureHex.slice(0, 16)}...
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ padding: '1rem 2rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                ✓ Tamper-evident • Verifiable without Internet connection via local Ed25519 public key
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => alert(`Certificate ${selectedCertificate.id} exported as verified printable PDF format.`)}
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  📥 Print / Export PDF
                </button>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', padding: '0.5rem 0.9rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: Live Trainee Mobile Simulator (Judges Interactive Demo)
      ========================================================== */}
      {showMobileSimulator && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          {/* Simulated Smartphone Shell */}
          <div
            style={{
              width: '390px',
              height: '760px',
              backgroundColor: '#0f172a',
              borderRadius: '44px',
              padding: '12px',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              border: '4px solid #334155',
              position: 'relative',
            }}
          >
            {/* Top Phone Speaker / Camera Notch */}
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '110px', height: '22px', backgroundColor: '#000000', borderRadius: '12px', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '40px', height: '4px', backgroundColor: '#334155', borderRadius: '2px' }} />
              <div style={{ width: '8px', height: '8px', backgroundColor: '#1e293b', borderRadius: '50%', marginLeft: '8px' }} />
            </div>

            {/* Inner Screen */}
            <div
              style={{
                flex: 1,
                backgroundColor: '#f1f5f9',
                borderRadius: '34px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Phone Status Bar */}
              <div style={{ backgroundColor: '#ffffff', padding: '0.6rem 1.25rem 0.2rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#0f172a' }}>
                <span>09:41</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>📶 SahakarEdge-Local</span>
                  <span>⚡ 100%</span>
                </div>
              </div>

              {/* Trainee PWA App Header */}
              <div style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#bae6fd', fontWeight: 800 }}>NCCT TRAINEE MOBILE PWA</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Namaste, Anita Patel</div>
                </div>
                <button
                  onClick={() => setShowMobileSimulator(false)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontWeight: 700 }}
                >
                  ×
                </button>
              </div>

              {/* WAN Simulation Selector */}
              <div style={{ backgroundColor: simWanMode === 'OFFLINE' ? '#ea580c' : '#16a34a', color: '#ffffff', padding: '0.4rem 0.8rem', fontSize: '0.7rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{simWanMode === 'OFFLINE' ? '⚡ OFFLINE: Local Edge Mode' : '🌐 ONLINE: Cloud Sync Active'}</span>
                <select
                  value={simWanMode}
                  onChange={(e) => setSimWanMode(e.target.value as any)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.3rem' }}
                >
                  <option value="OFFLINE" style={{ color: '#000' }}>WAN: OFFLINE</option>
                  <option value="ONLINE" style={{ color: '#000' }}>WAN: ONLINE</option>
                </select>
              </div>

              {/* Simulated Screen Body Content */}
              <div style={{ flex: 1, padding: '0.85rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Attendance Check-in Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '0.85rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                    <span>SESSION ATTENDANCE</span>
                    <span style={{ color: simAttendanceCheckedIn ? '#16a34a' : '#d97706' }}>
                      {simAttendanceCheckedIn ? '✓ Verified' : '● In Session'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0.2rem 0' }}>
                    PACS Computerization Core & Day-Book Ledger
                  </div>
                  <button
                    onClick={handleSimAttendance}
                    disabled={simAttendanceCheckedIn}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      backgroundColor: simAttendanceCheckedIn ? '#f1f5f9' : '#0284c7',
                      color: simAttendanceCheckedIn ? '#16a34a' : '#ffffff',
                      border: 'none',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: simAttendanceCheckedIn ? 'default' : 'pointer',
                    }}
                  >
                    {simAttendanceCheckedIn ? '✓ Local QR Attendance Recorded' : '⚡ 1-Tap Dynamic QR Attendance'}
                  </button>
                </div>

                {/* Course Modules Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '0.85rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>COURSE MODULE PROGRESS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.2rem 0' }}>
                    Module 2: Day-Book & Cash Vouchers
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <button
                      onClick={() => handleSimCompleteLesson('lsn-pacs-101-2')}
                      disabled={simCompletedLessons.includes('lsn-pacs-101-2')}
                      style={{
                        flex: 1,
                        backgroundColor: simCompletedLessons.includes('lsn-pacs-101-2') ? '#f0fdf4' : '#0284c7',
                        color: simCompletedLessons.includes('lsn-pacs-101-2') ? '#16a34a' : '#ffffff',
                        border: 'none',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: simCompletedLessons.includes('lsn-pacs-101-2') ? 'default' : 'pointer',
                      }}
                    >
                      {simCompletedLessons.includes('lsn-pacs-101-2') ? '✓ Lesson Finished' : 'Complete Lesson 2'}
                    </button>
                  </div>
                </div>

                {/* Offline Assessment Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '0.85rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>STATUTORY EXAM</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.2rem 0' }}>
                    PACS Governance Assessment
                  </div>
                  <button
                    onClick={handleSimSubmitAssessment}
                    disabled={simAssessmentDone}
                    style={{
                      width: '100%',
                      marginTop: '0.4rem',
                      backgroundColor: simAssessmentDone ? '#f0fdf4' : '#16a34a',
                      color: simAssessmentDone ? '#16a34a' : '#ffffff',
                      border: 'none',
                      padding: '0.45rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: simAssessmentDone ? 'default' : 'pointer',
                    }}
                  >
                    {simAssessmentDone ? '✓ Exam Passed (Score: 100%)' : 'Take Exam on Local Edge'}
                  </button>
                </div>

                {/* Local Sync Queue Inspector */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    <span>OFFLINE EVENT QUEUE</span>
                    <span style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', color: '#0369a1' }}>
                      {simQueuedEvents.length} Pending
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
                    {simQueuedEvents.map((ev) => (
                      <div key={ev.id} style={{ fontSize: '0.68rem', backgroundColor: '#f8fafc', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{ev.type}</span>
                        <span style={{ color: '#64748b' }}>{ev.timestamp}</span>
                      </div>
                    ))}
                    {simQueuedEvents.length === 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', textAlign: 'center', padding: '0.5rem 0' }}>
                        ✓ All local events synced with Central Cloud!
                      </div>
                    )}
                  </div>

                  {/* Sync Trigger Button */}
                  <button
                    onClick={() => triggerCentralSyncFromSim()}
                    disabled={simQueuedEvents.length === 0}
                    style={{
                      width: '100%',
                      marginTop: '0.6rem',
                      backgroundColor: simQueuedEvents.length === 0 ? '#e2e8f0' : '#0284c7',
                      color: simQueuedEvents.length === 0 ? '#94a3b8' : '#ffffff',
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: simQueuedEvents.length === 0 ? 'default' : 'pointer',
                    }}
                  >
                    ⚡ Push Sync to Central Cloud Admin
                  </button>
                </div>
              </div>

              {/* Bottom Phone Bar */}
              <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.65rem', color: '#64748b' }}>
                Sahakar Edge Local Client • v1.0.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: Create Programme
      ========================================================== */}
      {showProgrammeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', maxWidth: '500px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add Capacity Building Programme</h3>
            <form onSubmit={handleCreateProgramme} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Programme Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Dairy Cooperative Governance & Compliance"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Cooperative training curriculum details..."
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProgrammeModal(false)}
                  style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Programme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: Manual Attendance Override
      ========================================================== */}
      {showOverrideModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', maxWidth: '500px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem' }}>Audited Manual Attendance Override</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Override attendance when trainee hardware fails or local QR camera is unavailable. An immutable record will be appended to the central compliance audit log.
            </p>
            <form onSubmit={handleManualOverride} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Select Trainee</label>
                <select
                  value={overrideTraineeId}
                  onChange={(e) => setOverrideTraineeId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  {trainees.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.emailOrPhone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>Mandatory Justification / Reason</label>
                <textarea
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Trainee phone battery depleted; verified in person by Trainer"
                  rows={3}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Record Audited Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
