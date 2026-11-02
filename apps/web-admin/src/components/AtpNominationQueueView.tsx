'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type {
  TrainingInstitute,
  TrainingProgramme,
  TraineeNomination,
  NominationStatus,
  CampusHostelRoom,
} from '@sahakar/types';
import { apiClient } from '../services/api-client';
import {
  THEME,
  bentoHeaderStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  pillBadge,
  tableHeaderStyle,
  tableCellStyle,
} from './theme';
import {
  SearchIcon,
  RefreshIcon,
  CheckIcon,
  CloseIcon,
  AtpBatchesIcon,
} from './icons';

// Double-Bezel Card Styling Helpers
const doubleBezelStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '3px',
  boxShadow: '0 1px 3px rgba(8, 24, 84, 0.05)',
};

const doubleBezelInnerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '2px',
  padding: '1.25rem',
};

export interface AtpNominationQueueViewProps {
  initialInstitutes?: TrainingInstitute[];
  initialProgrammes?: TrainingProgramme[];
  initialNominations?: TraineeNomination[];
  initialRooms?: CampusHostelRoom[];
}

export function AtpNominationQueueView({
  initialInstitutes,
  initialProgrammes,
  initialNominations,
  initialRooms,
}: AtpNominationQueueViewProps) {
  // State: Core Domain Entities
  const [institutes, setInstitutes] = useState<TrainingInstitute[]>(initialInstitutes || []);
  const [programmes, setProgrammes] = useState<TrainingProgramme[]>(initialProgrammes || []);
  const [nominations, setNominations] = useState<TraineeNomination[]>(initialNominations || []);
  const [hostelRooms, setHostelRooms] = useState<CampusHostelRoom[]>(initialRooms || []);
  const [, setLoading] = useState<boolean>(false);

  // State: Navigation & Selection
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('prog-atp-2026-pacs-01');

  // State: Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | NominationStatus>('ALL');

  // State: Modals & Feedback
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [rejectingNomination, setRejectingNomination] = useState<TraineeNomination | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('Ineligible society category for scheme subvention');
  const [hostelModalNomination, setHostelModalNomination] = useState<TraineeNomination | null>(null);
  const [selectedHostelRoomId, setSelectedHostelRoomId] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('2026-09-01');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-10-31');

  // Load live data from Central API with fallback
  const loadData = async () => {
    setLoading(true);
    try {
      const instData = await apiClient.getTrainingInstitutes();
      if (instData && instData.length > 0) setInstitutes(instData);

      const progData = await apiClient.getTrainingProgrammes();
      if (progData && progData.length > 0) setProgrammes(progData);

      const nomData = await apiClient.getTrainingNominations();
      if (nomData && nomData.length > 0) setNominations(nomData);

      const roomData = await apiClient.getCampusHostelRooms();
      if (roomData && roomData.length > 0) setHostelRooms(roomData);
    } catch (err) {
      console.error('Failed to load ATP data from Central API', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter programmes for selected institute
  const filteredProgrammes = useMemo(() => {
    return programmes.filter((p) => p.instituteId === selectedInstituteId);
  }, [programmes, selectedInstituteId]);

  // Keep selectedProgrammeId synced when institute changes
  useEffect(() => {
    if (filteredProgrammes.length > 0) {
      const exists = filteredProgrammes.some((p) => p.id === selectedProgrammeId);
      if (!exists) setSelectedProgrammeId(filteredProgrammes[0].id);
    }
  }, [filteredProgrammes, selectedProgrammeId]);

  // Active Programme Details
  const activeProgramme = useMemo(() => {
    return programmes.find((p) => p.id === selectedProgrammeId) || filteredProgrammes[0] || programmes[0];
  }, [programmes, filteredProgrammes, selectedProgrammeId]);

  // Nominations for Active Programme
  const programmeNominations = useMemo(() => {
    if (!activeProgramme) return [];
    return nominations.filter((n) => n.programmeId === activeProgramme.id);
  }, [nominations, activeProgramme]);

  // Filtered Nominations
  const filteredNominations = useMemo(() => {
    return programmeNominations.filter((n) => {
      if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          n.fullName.toLowerCase().includes(q) ||
          n.cooperativeAffiliation.toLowerCase().includes(q) ||
          n.designation.toLowerCase().includes(q) ||
          n.state.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [programmeNominations, statusFilter, searchQuery]);

  // Capacity Calculations
  const approvedCount = useMemo(() => {
    return programmeNominations.filter((n) => n.status === 'APPROVED').length;
  }, [programmeNominations]);

  const waitlistedCount = useMemo(() => {
    return programmeNominations.filter((n) => n.status === 'WAITLISTED').length;
  }, [programmeNominations]);

  const pendingCount = useMemo(() => {
    return programmeNominations.filter((n) => n.status === 'PENDING').length;
  }, [programmeNominations]);

  const capacity = activeProgramme?.capacity || 35;
  const capacityPercent = capacity > 0 ? Math.min(100, Math.round((approvedCount / capacity) * 100)) : 0;
  const isFull = approvedCount >= capacity;

  // Available Hostel Rooms in selected Institute
  const availableRooms = useMemo(() => {
    return hostelRooms.filter((r) => r.instituteId === selectedInstituteId && r.occupiedBeds < r.bedCapacity);
  }, [hostelRooms, selectedInstituteId]);

  // Action: Approve Nomination
  const handleApprove = (nom: TraineeNomination) => {
    if (isFull && nom.status !== 'APPROVED') {
      setActionFeedback({
        type: 'warning',
        message: `Capacity limit reached (${approvedCount}/${capacity}). Candidate cannot be approved without expanding quota. Routed to WAITLISTED.`,
      });
      handleWaitlist(nom);
      return;
    }

    // If programme has residential component, prompt hostel room allocation
    if (activeProgramme && activeProgramme.deliveryMode !== 'ONLINE') {
      setHostelModalNomination(nom);
      if (availableRooms.length > 0) setSelectedHostelRoomId(availableRooms[0].id);
      return;
    }

    // Online programme: direct approval
    executeApproval(nom);
  };

  const executeApproval = (nom: TraineeNomination, roomId?: string) => {
    let assignedBlock: string | undefined;
    let assignedRoomNumber: string | undefined;

    if (roomId) {
      const room = hostelRooms.find((r) => r.id === roomId);
      if (room) {
        assignedBlock = room.hostelBlock;
        assignedRoomNumber = room.roomNumber;
        // Increment bed occupancy
        setHostelRooms((prev) =>
          prev.map((r) => (r.id === roomId ? { ...r, occupiedBeds: Math.min(r.bedCapacity, r.occupiedBeds + 1) } : r))
        );
      }
    }

    setNominations((prev) =>
      prev.map((n) =>
        n.id === nom.id
          ? {
              ...n,
              status: 'APPROVED',
              decidedAt: new Date().toISOString(),
              decidedBy: 'Director / Course Coordinator',
              hostelRoomId: roomId,
              hostelBlock: assignedBlock,
              hostelRoomNumber: assignedRoomNumber,
              rejectionReason: undefined,
            }
          : n
      )
    );

    // Call API if possible
    apiClient.decideTrainingNomination(nom.id, {
      status: 'APPROVED',
      hostelRoomId: roomId,
      decidedBy: 'Director / Course Coordinator',
    });

    setActionFeedback({
      type: 'success',
      message: `Nomination for ${nom.fullName} approved successfully (${approvedCount + 1}/${capacity} seats).${
        assignedRoomNumber ? ` Assigned bed in Room ${assignedRoomNumber} (${assignedBlock}).` : ''
      }`,
    });
    setHostelModalNomination(null);
  };

  // Action: Waitlist
  const handleWaitlist = (nom: TraineeNomination) => {
    setNominations((prev) =>
      prev.map((n) =>
        n.id === nom.id
          ? {
              ...n,
              status: 'WAITLISTED',
              decidedAt: new Date().toISOString(),
              decidedBy: 'Director / Course Coordinator',
              rejectionReason: 'Placed on priority institutional waitlist.',
              hostelRoomId: undefined,
              hostelBlock: undefined,
              hostelRoomNumber: undefined,
            }
          : n
      )
    );

    apiClient.decideTrainingNomination(nom.id, {
      status: 'WAITLISTED',
      rejectionReason: 'Placed on priority institutional waitlist.',
      decidedBy: 'Director / Course Coordinator',
    });

    setActionFeedback({
      type: 'warning',
      message: `${nom.fullName} placed on institutional waitlist.`,
    });
  };

  // Action: Reject
  const handleConfirmReject = () => {
    if (!rejectingNomination) return;
    setNominations((prev) =>
      prev.map((n) =>
        n.id === rejectingNomination.id
          ? {
              ...n,
              status: 'REJECTED',
              decidedAt: new Date().toISOString(),
              decidedBy: 'Director / Course Coordinator',
              rejectionReason: rejectionReasonInput,
              hostelRoomId: undefined,
              hostelBlock: undefined,
              hostelRoomNumber: undefined,
            }
          : n
      )
    );

    apiClient.decideTrainingNomination(rejectingNomination.id, {
      status: 'REJECTED',
      rejectionReason: rejectionReasonInput,
      decidedBy: 'Director / Course Coordinator',
    });

    setActionFeedback({
      type: 'error',
      message: `Nomination for ${rejectingNomination.fullName} rejected: ${rejectionReasonInput}`,
    });
    setRejectingNomination(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Directorate Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Directorate 2: Institutional Training & Governance
          </div>
          <h2 style={{ fontSize: '1.4rem', margin: '0.2rem 0', fontWeight: 800, color: THEME.colors.inkPrimary }}>
            Annual Training Plan (ATP) Batches & Trainee Nomination Queue
          </h2>
          <div style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted }}>
            राष्ट्रीय सहकारी प्रशिक्षण परिषद • Institutional quota allocation, capacity gating, and campus hostel room assignments
          </div>
        </div>
        <button onClick={loadData} style={buttonSecondaryStyle}>
          <RefreshIcon size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: THEME.radii.sm,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor:
              actionFeedback.type === 'success' ? '#f0fdf4' : actionFeedback.type === 'warning' ? '#fefce8' : '#fef2f2',
            border: `1px solid ${
              actionFeedback.type === 'success' ? '#bbf7d0' : actionFeedback.type === 'warning' ? '#fef08a' : '#fecaca'
            }`,
            color:
              actionFeedback.type === 'success' ? '#166534' : actionFeedback.type === 'warning' ? '#854d0e' : '#991b1b',
            fontSize: '0.85rem',
          }}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Institutional Institute Selector */}
      <div style={doubleBezelStyle}>
        <div style={doubleBezelInnerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={bentoHeaderStyle}>Issuing Cooperative Training Institute</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                Select Institution to Review Active Annual Training Plan (ATP) Batches
              </div>
            </div>
            <span style={pillBadge('apex')}>5 Institutes Registered</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            {institutes.map((inst) => {
              const isSelected = inst.id === selectedInstituteId;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstituteId(inst.id)}
                  style={{
                    border: isSelected ? '2px solid #0649a2' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                    borderRadius: '4px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0649a2' }}>{inst.code}</span>
                    <span style={pillBadge(inst.tier === 'APEX' ? 'apex' : inst.tier === 'RICM' ? 'info' : 'neutral')}>
                      {inst.tier}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.inkPrimary, margin: '0.35rem 0' }}>
                    {inst.name.split(',')[0]}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
                    {inst.city}, {inst.state} • Director: {inst.directorName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '0.35rem' }}>
                    Hostel Capacity: {inst.hostelCapacity} beds
                  </div>
                  {isSelected && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.7rem', fontWeight: 800, color: '#0649a2' }}>
                      ACTIVE INSTITUTE ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Programme Batch Selector & Visual Capacity Meter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
        {/* Programme Selection Card */}
        <div style={doubleBezelStyle}>
          <div style={doubleBezelInnerStyle}>
            <div style={bentoHeaderStyle}>Active Training Programme Batch</div>
            {filteredProgrammes.length === 0 ? (
              <div style={{ padding: '1rem 0', color: THEME.colors.inkMuted, fontSize: '0.85rem' }}>
                No programmes scheduled for this institute.
              </div>
            ) : (
              <div>
                <select
                  value={selectedProgrammeId}
                  onChange={(e) => setSelectedProgrammeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: THEME.radii.sharp,
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    backgroundColor: '#ffffff',
                    color: THEME.colors.inkPrimary,
                    marginBottom: '0.85rem',
                  }}
                >
                  {filteredProgrammes.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.title} ({p.atpYear})
                    </option>
                  ))}
                </select>

                {activeProgramme && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={pillBadge('info')}>{activeProgramme.deliveryMode}</span>
                      <span style={pillBadge('success')}>{activeProgramme.status}</span>
                      <span style={{ color: THEME.colors.inkMuted }}>Sector: {activeProgramme.targetSector}</span>
                    </div>
                    <div style={{ color: THEME.colors.inkBody }}>
                      <strong>Calendar Schedule:</strong> {activeProgramme.startDate} to {activeProgramme.endDate}
                    </div>
                    <div style={{ color: THEME.colors.inkBody }}>
                      <strong>Coordinating Faculty:</strong> {activeProgramme.coordinatingFacultyName || 'Prof. Ramesh Sharma'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visual Batch Capacity Meter */}
        <div style={doubleBezelStyle}>
          <div style={doubleBezelInnerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={bentoHeaderStyle}>Batch Capacity & Quota Utilization</div>
              <span style={pillBadge(isFull ? 'error' : capacityPercent >= 70 ? 'warning' : 'success')}>
                {isFull ? 'FULL (WAITLIST ONLY)' : `${capacity - approvedCount} SEATS AVAILABLE`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.4rem 0' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: isFull ? '#991b1b' : '#081854', fontFeatureSettings: '"tnum" 1' }}>
                {approvedCount}
              </span>
              <span style={{ fontSize: '1.2rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>/ {capacity}</span>
              <span style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted }}>Seats Approved ({capacityPercent}%)</span>
            </div>

            {/* Visual Progress Bar */}
            <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', margin: '0.5rem 0' }}>
              <div
                style={{
                  width: `${capacityPercent}%`,
                  height: '100%',
                  backgroundColor: isFull ? '#991b1b' : capacityPercent >= 70 ? '#feb505' : '#1ab452',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: THEME.colors.inkMuted, marginTop: '0.5rem' }}>
              <span>Waitlist Queue: <strong>{waitlistedCount}</strong> candidates</span>
              <span>Pending Review: <strong>{pendingCount}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Trainee Nomination Queue Table */}
      <div style={doubleBezelStyle}>
        <div style={{ ...doubleBezelInnerStyle, padding: 0, overflow: 'hidden' }}>
          {/* Table Toolbar */}
          <div style={{ padding: '1rem 1.25rem', backgroundColor: THEME.colors.bgMuted, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: THEME.colors.inkMuted }}>
                  <SearchIcon size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search candidate name, society affiliation, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: THEME.radii.sharp,
                    fontSize: '0.82rem',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: THEME.radii.sharp,
                  fontSize: '0.82rem',
                  backgroundColor: '#ffffff',
                  color: THEME.colors.inkBody,
                }}
              >
                <option value="ALL">All Statuses ({programmeNominations.length})</option>
                <option value="PENDING">PENDING ({pendingCount})</option>
                <option value="APPROVED">APPROVED ({approvedCount})</option>
                <option value="WAITLISTED">WAITLISTED ({waitlistedCount})</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: THEME.colors.inkMuted }}>
              Showing {filteredNominations.length} of {programmeNominations.length} Nominees
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Candidate Profile</th>
                <th style={tableHeaderStyle}>Cooperative Society Affiliation</th>
                <th style={tableHeaderStyle}>Designation</th>
                <th style={tableHeaderStyle}>State</th>
                <th style={tableHeaderStyle}>Hostel Room</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Administrative Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredNominations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center', padding: '2rem', color: THEME.colors.inkMuted }}>
                    No trainee nominations found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredNominations.map((nom) => (
                  <tr key={nom.id}>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700, color: THEME.colors.inkPrimary }}>{nom.fullName}</div>
                      <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>{nom.phone}</div>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ color: THEME.colors.inkBody, fontWeight: 600 }}>{nom.cooperativeAffiliation}</div>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ fontSize: '0.82rem', color: THEME.colors.inkBody }}>{nom.designation}</span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ fontSize: '0.82rem', color: THEME.colors.inkBody }}>{nom.state}</span>
                    </td>
                    <td style={tableCellStyle}>
                      {nom.hostelRoomNumber ? (
                        <span style={pillBadge('success')}>
                          {nom.hostelBlock?.split(' ')[0]} Room {nom.hostelRoomNumber}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Not Allocated</span>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={pillBadge(
                          nom.status === 'APPROVED'
                            ? 'success'
                            : nom.status === 'WAITLISTED'
                            ? 'warning'
                            : nom.status === 'REJECTED'
                            ? 'error'
                            : 'neutral'
                        )}
                      >
                        {nom.status}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {nom.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleApprove(nom)}
                            style={{
                              ...buttonPrimaryStyle,
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#166534',
                            }}
                          >
                            <CheckIcon size={12} />
                            <span>Approve</span>
                          </button>
                        )}
                        {nom.status !== 'WAITLISTED' && (
                          <button
                            onClick={() => handleWaitlist(nom)}
                            style={{
                              ...buttonSecondaryStyle,
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              borderColor: '#f59e0b',
                              color: '#b45309',
                            }}
                          >
                            Waitlist
                          </button>
                        )}
                        {nom.status !== 'REJECTED' && (
                          <button
                            onClick={() => setRejectingNomination(nom)}
                            style={{
                              ...buttonSecondaryStyle,
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              borderColor: '#fecaca',
                              color: '#dc2626',
                            }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Campus Hostel Room Assignment Modal */}
      {hostelModalNomination && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 24, 84, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.sm,
              width: '100%',
              maxWidth: '600px',
              boxShadow: THEME.shadows.modal,
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            {/* National Tricolor Accent Strip */}
            <div style={{ height: '3.5px', width: '100%', display: 'flex' }}>
              <div style={{ flex: 1, backgroundColor: '#ff9933' }} />
              <div style={{ flex: 1, backgroundColor: '#ffffff', borderBottom: '0.5px solid #cbd5e1' }} />
              <div style={{ flex: 1, backgroundColor: '#138808' }} />
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: THEME.colors.bgMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary, letterSpacing: '0.06em' }}>
                  INSTITUTIONAL RESIDENTIAL ALLOCATION
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                  Assign Campus Hostel Room: {hostelModalNomination.fullName}
                </div>
              </div>
              <button onClick={() => setHostelModalNomination(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.colors.inkMuted }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ fontSize: '0.82rem', color: THEME.colors.inkBody }}>
                Candidate <strong>{hostelModalNomination.fullName}</strong> ({hostelModalNomination.cooperativeAffiliation}) is approved for batch{' '}
                <strong>{activeProgramme?.title}</strong>. Select an available bed in the campus residential inventory.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
                  Available Campus Hostel Rooms ({availableRooms.length} rooms with vacancies):
                </label>
                {availableRooms.length === 0 ? (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: THEME.radii.sharp, color: '#991b1b', fontSize: '0.82rem' }}>
                    Warning: No vacant beds currently available in this institution&apos;s hostel. Candidate can be admitted as Day Scholar.
                  </div>
                ) : (
                  <select
                    value={selectedHostelRoomId}
                    onChange={(e) => setSelectedHostelRoomId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: THEME.radii.sharp,
                      fontSize: '0.85rem',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.hostelBlock} — Room {room.roomNumber} ({room.roomType}, {room.bedCapacity - room.occupiedBeds} beds vacant)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.25rem' }}>
                    Check-in Date:
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: THEME.radii.sharp, fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.25rem' }}>
                    Check-out Date:
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: THEME.radii.sharp, fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => executeApproval(hostelModalNomination)}
                  style={{ ...buttonSecondaryStyle, fontSize: '0.82rem' }}
                >
                  Skip Hostel (Day Scholar)
                </button>
                <button
                  disabled={availableRooms.length === 0}
                  onClick={() => executeApproval(hostelModalNomination, selectedHostelRoomId)}
                  style={{ ...buttonPrimaryStyle, fontSize: '0.82rem', backgroundColor: '#166534' }}
                >
                  Confirm & Allocate Bed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Rejection Reason Modal */}
      {rejectingNomination && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 24, 84, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.sm,
              width: '100%',
              maxWidth: '520px',
              boxShadow: THEME.shadows.modal,
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#991b1b' }}>
                Reject Trainee Nomination: {rejectingNomination.fullName}
              </div>
              <button onClick={() => setRejectingNomination(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: THEME.colors.inkBody }}>
                Please specify the official regulatory reason for rejecting nomination from{' '}
                <strong>{rejectingNomination.cooperativeAffiliation}</strong>.
              </div>

              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: THEME.radii.sharp,
                  fontSize: '0.85rem',
                  fontFamily: THEME.fonts.sans,
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button onClick={() => setRejectingNomination(null)} style={buttonSecondaryStyle}>
                  Cancel
                </button>
                <button onClick={handleConfirmReject} style={{ ...buttonPrimaryStyle, backgroundColor: '#991b1b' }}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Aliased export for compatibility with both naming conventions
export const AtpBatchLifecycleView = AtpNominationQueueView;
