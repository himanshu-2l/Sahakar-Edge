'use client';

import React, { useState } from 'react';
import {
  SEED_INSTITUTE_RICM_BHOPAL,
  SEED_PROGRAMME,
  SEED_BATCH,
  SEED_SESSION,
  SEED_ENROLLMENTS,
  SEED_COURSE,
  SEED_USERS,
} from '@sahakar/test-fixtures';
import { Programme, Batch, Enrollment, EnrollmentStatus, ProgrammeStatus } from '@sahakar/types';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROGRAMMES' | 'BATCHES' | 'COURSES'>('OVERVIEW');

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Top Government Navigation Header */}
      <header style={{ backgroundColor: '#0f172a', color: '#ffffff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.08em' }}>
            MINISTRY OF COOPERATION | GOVERNMENT OF INDIA
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Sahakar Edge — NCCT Integrated Training Portal
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Shri Rajesh Verma (Central Director)</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SUPER_ADMIN | National Council for Cooperative Training</div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', gap: '2rem' }}>
        {(['OVERVIEW', 'PROGRAMMES', 'BATCHES', 'COURSES'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: activeTab === tab ? '#0284c7' : '#64748b',
              borderBottom: activeTab === tab ? '3px solid #0284c7' : '3px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>COOPERATIVE INSTITUTES</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#0369a1' }}>2 Active</div>
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
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>EDGE NODES HEALTH</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0', color: '#16a34a' }}>100% ONLINE</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>RICM Bhopal Node-01 connected</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0f172a' }}>NCCT Cooperative Capacity Building Overview</h2>
              <p style={{ color: '#475569', lineHeight: 1.6, margin: 0 }}>
                This central administration platform is the authoritative master catalogue for training programmes, participant profiles, course curricula, and credential policies. When training commences at a rural centre, programmes and attendee rosters are provisioned onto local <strong>Sahakar Edge</strong> nodes. The edge node allows uninterrupted attendance capture, courseware delivery, and assessments even during severe WAN dropouts.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Programmes */}
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

        {/* Tab 3: Batches & Trainee Roster Assignment */}
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

        {/* Tab 4: Courses & Content Manifest */}
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
      </main>
    </div>
  );
}
