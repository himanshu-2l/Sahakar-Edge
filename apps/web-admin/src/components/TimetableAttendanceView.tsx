'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type {
  TimetableSession,
  FacultyClassRosterEntry,
  TrainingProgramme,
} from '@sahakar/types';
import { apiClient } from '../services/api-client';
import {
  THEME,
  cardStyle,
  bentoHeaderStyle,
  bentoValueStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  pillBadge,
  tableHeaderStyle,
  tableCellStyle,
} from './theme';
import {
  RefreshIcon,
  CloseIcon,
  ClockIcon,
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

export interface TimetableAttendanceViewProps {
  initialSessions?: TimetableSession[];
  initialProgrammes?: TrainingProgramme[];
  initialRoster?: FacultyClassRosterEntry[];
}

export function TimetableAttendanceView({
  initialSessions,
  initialProgrammes,
  initialRoster,
}: TimetableAttendanceViewProps) {
  // State: Data
  const [sessions, setSessions] = useState<TimetableSession[]>(initialSessions || []);
  const [programmes, setProgrammes] = useState<TrainingProgramme[]>(initialProgrammes || []);
  const [roster, setRoster] = useState<FacultyClassRosterEntry[]>(initialRoster || []);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('prog-atp-2026-pacs-01');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('sess-pacs-101');
  const [, setLoading] = useState<boolean>(false);

  // State: Live Countdown & Ticker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // State: Manual Override Modal
  const [overrideModalTrainee, setOverrideModalTrainee] = useState<FacultyClassRosterEntry | null>(null);
  const [overridePresence, setOverridePresence] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState<string>('Trainee device network timeout; verified in person by Trainer');
  const [facultySignatory, setFacultySignatory] = useState<string>('Prof. Ramesh Sharma (Course Director)');

  // 1,000ms Live Ticker for Temporal Guard & Real-Time Countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const progData = await apiClient.getTrainingProgrammes();
      if (progData && progData.length > 0) setProgrammes(progData);

      const sessData = await apiClient.getTimetableSessions(selectedProgrammeId);
      if (sessData && sessData.length > 0) {
        setSessions(sessData);
        if (!sessData.some((s) => s.id === selectedSessionId)) {
          setSelectedSessionId(sessData[0].id);
        }
      }

      if (selectedSessionId) {
        const rosterData = await apiClient.getTimetableRoster(selectedSessionId);
        if (rosterData && rosterData.roster) {
          setRoster(rosterData.roster);
        }
      }
    } catch (err) {
      console.error('Failed to load timetable and roster', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProgrammeId, selectedSessionId]);

  // Active Programme
  const activeProgramme = useMemo(() => {
    return programmes.find((p) => p.id === selectedProgrammeId) || programmes[0];
  }, [programmes, selectedProgrammeId]);

  // Active Session
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  // Temporal Start Guard Arithmetic
  const temporalGuardStatus = useMemo(() => {
    if (!activeSession) return { isPremature: false, isConcluded: false, label: '', timeString: '' };

    const startTimeMs = new Date(activeSession.startsAt).getTime();
    const endTimeMs = new Date(activeSession.endsAt).getTime();
    const nowMs = currentTime.getTime();

    if (nowMs < startTimeMs) {
      const remainingSec = Math.floor((startTimeMs - nowMs) / 1000);
      const h = Math.floor(remainingSec / 3600);
      const m = Math.floor((remainingSec % 3600) / 60);
      const s = remainingSec % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        isPremature: true,
        isConcluded: false,
        label: 'PREMATURE_CHECKIN_BLOCKED',
        timeString: `${pad(h)}h ${pad(m)}m ${pad(s)}s`,
      };
    }

    if (nowMs > endTimeMs || activeSession.status === 'CONCLUDED') {
      return {
        isPremature: false,
        isConcluded: true,
        label: 'SESSION_CONCLUDED',
        timeString: 'Concluded',
      };
    }

    const remainingSec = Math.floor((endTimeMs - nowMs) / 1000);
    const h = Math.floor(remainingSec / 3600);
    const m = Math.floor((remainingSec % 3600) / 60);
    const s = remainingSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      isPremature: false,
      isConcluded: false,
      label: 'SESSION_ACTIVE',
      timeString: `${pad(h)}h ${pad(m)}m ${pad(s)}s remaining`,
    };
  }, [activeSession, currentTime]);

  // Roster Metrics
  const totalRostered = roster.length;
  const presentCount = roster.filter((r) => r.isPresent).length;
  const absentCount = totalRostered - presentCount;
  const attendanceRate = totalRostered > 0 ? Math.round((presentCount / totalRostered) * 1000) / 10 : 0;
  const isStatutorilyCompliant = attendanceRate >= 75.0;

  // Copy 6-Digit Code
  const handleCopyCode = () => {
    if (!activeSession?.checkInCode) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeSession.checkInCode);
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Regenerate 6-Digit Code
  const handleRegenerateCode = async () => {
    if (!activeSession) return;
    try {
      const newCode = await apiClient.regenerateTimetableCode(activeSession.id);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, checkInCode: newCode } : s))
      );
      setActionFeedback({
        type: 'success',
        message: `Check-in code rotated to ${newCode} with collision prevention.`,
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: `Failed to rotate code: ${err.message}`,
      });
    }
  };

  // Confirm Manual Attendance Override
  const handleConfirmOverride = async () => {
    if (!overrideModalTrainee || !activeSession) return;
    const traineeId = overrideModalTrainee.traineeId;
    const isPresent = overridePresence;

    try {
      await apiClient.updateFacultyManualAttendance(
        activeSession.id,
        traineeId,
        isPresent,
        facultySignatory,
        overrideReason
      );

      setRoster((prev) =>
        prev.map((entry) => {
          if (entry.traineeId === traineeId) {
            return {
              ...entry,
              isPresent,
              attendanceRecord: isPresent
                ? {
                    id: `att-${activeSession.id}-${traineeId}`,
                    sessionId: activeSession.id,
                    traineeId,
                    traineeName: entry.traineeName,
                    verificationMethod: 'FACULTY_MANUAL',
                    markedAt: new Date().toISOString(),
                    markedBy: facultySignatory,
                    verified: true,
                  }
                : undefined,
            };
          }
          return entry;
        })
      );

      setActionFeedback({
        type: 'success',
        message: `Manual attendance override logged for ${overrideModalTrainee.traineeName}: Marked as ${
          isPresent ? 'PRESENT' : 'ABSENT'
        } by ${facultySignatory}.`,
      });
      setOverrideModalTrainee(null);
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: `Failed to log manual override: ${err.message}`,
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Directorate Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Directorate 3: Trainee Verification & Attendance Operations
          </div>
          <h2 style={{ fontSize: '1.4rem', margin: '0.2rem 0', fontWeight: 800, color: THEME.colors.inkPrimary }}>
            Timetable Dashboard, Dynamic 6-Digit Attendance & Faculty Register
          </h2>
          <div style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted }}>
            राष्ट्रीय सहकारी प्रशिक्षण परिषद • Anti-collision token projection, temporal start guards, and statutory 75% attendance auditing
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            value={selectedProgrammeId}
            onChange={(e) => setSelectedProgrammeId(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              border: '1px solid #cbd5e1',
              borderRadius: THEME.radii.sharp,
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              fontWeight: 600,
            }}
          >
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.code}] {p.title}
              </option>
            ))}
          </select>
          <button onClick={loadData} style={buttonSecondaryStyle}>
            <RefreshIcon size={14} />
            <span>Sync Live</span>
          </button>
        </div>
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
            backgroundColor: actionFeedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${actionFeedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: actionFeedback.type === 'success' ? '#166534' : '#991b1b',
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

      {/* 1. Active Session Banner / Hero with Dynamic 6-Digit Check-In Token */}
      {activeSession && (
        <div style={doubleBezelStyle}>
          <div style={{ ...doubleBezelInnerStyle, padding: '1.5rem 1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'center' }}>
              {/* Left Column: Session Metadata & Temporal Guard */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={pillBadge(activeSession.status === 'ACTIVE' ? 'success' : 'neutral')}>
                    {activeSession.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                    {activeSession.sessionDate} • {activeSession.startTime} – {activeSession.endTime} (24h)
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.inkPrimary, margin: '0.2rem 0' }}>
                  {activeSession.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: THEME.colors.navyPrimary, fontWeight: 600 }}>
                  Course: {activeSession.courseTitle || 'PACS Computerization & Governance'}
                </div>
                <div style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted, marginTop: '0.35rem' }}>
                  Venue: <strong>{activeSession.venue}</strong> • Faculty: <strong>{activeSession.facultyName}</strong>
                </div>

                {/* Temporal Anti-Early Start Guard Indicator */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: THEME.radii.sharp,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    backgroundColor: temporalGuardStatus.isPremature
                      ? '#fefce8'
                      : temporalGuardStatus.isConcluded
                      ? '#f3f4f6'
                      : '#f0fdf4',
                    border: `1px solid ${
                      temporalGuardStatus.isPremature
                        ? '#fef08a'
                        : temporalGuardStatus.isConcluded
                        ? '#e5e7eb'
                        : '#bbf7d0'
                    }`,
                    fontSize: '0.8rem',
                  }}
                >
                  <ClockIcon size={16} />
                  <div>
                    {temporalGuardStatus.isPremature ? (
                      <span style={{ color: '#854d0e', fontWeight: 600 }}>
                        <strong>Check-in Locked:</strong> Class starts in {temporalGuardStatus.timeString}. Anti-early guard blocks premature attendance.
                      </span>
                    ) : temporalGuardStatus.isConcluded ? (
                      <span style={{ color: '#4b5563', fontWeight: 600 }}>
                        <strong>Session Concluded:</strong> Dynamic check-in code closed. Adjustments require manual faculty reconciliation.
                      </span>
                    ) : (
                      <span style={{ color: '#166534', fontWeight: 600 }}>
                        <strong>Live Check-in Open:</strong> Class in progress ({temporalGuardStatus.timeString}). Code displayed for classroom projection.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic 6-Digit Check-In Token Display */}
              <div
                style={{
                  backgroundColor: '#081854',
                  border: '2px solid #feb505',
                  borderRadius: '4px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px -1px rgba(8, 24, 84, 0.15)',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#feb505', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  DYNAMIC 6-DIGIT CHECK-IN CODE
                </div>
                <div
                  style={{
                    fontFamily: THEME.fonts.mono,
                    fontSize: '2.6rem',
                    fontWeight: 900,
                    letterSpacing: '0.28em',
                    color: '#feb505',
                    margin: '0.4rem 0',
                    textShadow: '0 0 10px rgba(254, 181, 5, 0.3)',
                  }}
                >
                  {activeSession.checkInCode || '482910'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  Project on classroom screen or broadcast to enrolled trainees
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      ...buttonSecondaryStyle,
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {codeCopied ? 'Copied ✓' : 'Copy Code'}
                  </button>
                  <button
                    onClick={handleRegenerateCode}
                    style={{
                      ...buttonPrimaryStyle,
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.75rem',
                      backgroundColor: '#feb505',
                      color: '#081854',
                      border: '1px solid #d97706',
                    }}
                  >
                    Rotate Token
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Timetable Schedule Grid */}
      <div style={doubleBezelStyle}>
        <div style={doubleBezelInnerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={bentoHeaderStyle}>Training Batch Timetable Schedule</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                Select Session to Inspect Live Presence Checklist
              </div>
            </div>
            <span style={pillBadge('neutral')}>{sessions.length} Scheduled Sessions</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {sessions.map((s) => {
              const isSelected = s.id === selectedSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  style={{
                    border: isSelected ? '2px solid #0649a2' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                    borderRadius: '4px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0649a2' }}>
                      {s.startTime} – {s.endTime}
                    </span>
                    <span style={pillBadge(s.status === 'ACTIVE' ? 'success' : s.status === 'UPCOMING' ? 'info' : 'neutral')}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.inkPrimary, margin: '0.3rem 0' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
                    {s.venue} • {s.facultyName}
                  </div>
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: THEME.fonts.mono, fontSize: '0.75rem', color: '#081854', fontWeight: 700 }}>
                      Code: {s.checkInCode}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0649a2' }}>ACTIVE ROSTER ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Aggregate Attendance Rate & 75% Statutory Compliance Threshold */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Approved Batch Roster</div>
          <div style={bentoValueStyle}>{totalRostered} Trainees</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Eligible approved nominees</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Session Presence</div>
          <div style={{ ...bentoValueStyle, color: '#166534' }}>
            {presentCount} Present
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
            {absentCount} Unverified / Absent
          </div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Aggregate Attendance Rate</div>
          <div style={{ ...bentoValueStyle, color: isStatutorilyCompliant ? '#166534' : '#854d0e' }}>
            {attendanceRate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
            Threshold: ≥ 75.0% Statutory
          </div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Certification Status</div>
          <div style={{ marginTop: '0.4rem' }}>
            <span style={pillBadge(isStatutorilyCompliant ? 'success' : 'warning')}>
              {isStatutorilyCompliant ? 'COMPLIANT FOR CERTIFICATION' : 'ATTENDANCE SHORTAGE (<75%)'}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted, marginTop: '0.35rem' }}>
            Section 18 NCCT Examination Bye-laws
          </div>
        </div>
      </div>

      {/* 4. Faculty Attendance Roster & Audit Register Table */}
      <div style={doubleBezelStyle}>
        <div style={{ ...doubleBezelInnerStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', backgroundColor: THEME.colors.bgMuted, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                Faculty Class Attendance Register ({activeSession?.title})
              </div>
              <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                Live verification method logs with faculty audit trail reconciliation
              </div>
            </div>
            <span style={pillBadge('apex')}>
              {presentCount} of {totalRostered} Verified Present
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Trainee Profile</th>
                <th style={tableHeaderStyle}>Cooperative Society</th>
                <th style={tableHeaderStyle}>Designation</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Verification Method</th>
                <th style={tableHeaderStyle}>Timestamp & Auditor</th>
                <th style={tableHeaderStyle}>Faculty Override</th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...tableCellStyle, textAlign: 'center', padding: '2rem', color: THEME.colors.inkMuted }}>
                    No approved trainees found for this batch roster.
                  </td>
                </tr>
              ) : (
                roster.map((entry) => {
                  const rec = entry.attendanceRecord;
                  return (
                    <tr key={entry.traineeId}>
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 700, color: THEME.colors.inkPrimary }}>{entry.traineeName}</div>
                        <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>{entry.phone || 'ID: ' + entry.traineeId.slice(0, 8)}</div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ color: THEME.colors.inkBody, fontWeight: 600 }}>{entry.cooperativeAffiliation}</div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{ fontSize: '0.82rem', color: THEME.colors.inkBody }}>{entry.designation}</span>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={pillBadge(entry.isPresent ? 'success' : 'neutral')}>
                          {entry.isPresent ? 'PRESENT' : 'ABSENT'}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        {rec ? (
                          <span
                            style={pillBadge(
                              rec.verificationMethod === 'DYNAMIC_CODE'
                                ? 'info'
                                : rec.verificationMethod === 'QR_SCAN'
                                ? 'success'
                                : rec.verificationMethod === 'FACULTY_MANUAL'
                                ? 'warning'
                                : 'apex'
                            )}
                          >
                            {rec.verificationMethod}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Not Logged</span>
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        {rec ? (
                          <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ color: THEME.colors.inkBody }}>
                              {new Date(rec.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ color: THEME.colors.inkMuted, fontSize: '0.7rem' }}>
                              By: {rec.markedBy || 'Self-Service Trainee'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>—</span>
                        )}
                      </td>
                      <td style={tableCellStyle}>
                        <button
                          onClick={() => {
                            setOverrideModalTrainee(entry);
                            setOverridePresence(!entry.isPresent);
                          }}
                          style={{
                            ...buttonSecondaryStyle,
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          Manual Override
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Faculty Manual Attendance Override Modal */}
      {overrideModalTrainee && (
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
              maxWidth: '540px',
              boxShadow: THEME.shadows.modal,
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
            }}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: THEME.colors.bgMuted, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary, letterSpacing: '0.06em' }}>
                  FACULTY ATTENDANCE AUDIT TRAIL
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: THEME.colors.inkPrimary }}>
                  Manual Override: {overrideModalTrainee.traineeName}
                </div>
              </div>
              <button onClick={() => setOverrideModalTrainee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.colors.inkMuted }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
                  New Attendance Status:
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setOverridePresence(true)}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: THEME.radii.sharp,
                      border: overridePresence ? '2px solid #166534' : '1px solid #cbd5e1',
                      backgroundColor: overridePresence ? '#f0fdf4' : '#ffffff',
                      color: overridePresence ? '#166534' : THEME.colors.inkBody,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Mark Present ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverridePresence(false)}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      borderRadius: THEME.radii.sharp,
                      border: !overridePresence ? '2px solid #991b1b' : '1px solid #cbd5e1',
                      backgroundColor: !overridePresence ? '#fef2f2' : '#ffffff',
                      color: !overridePresence ? '#991b1b' : THEME.colors.inkBody,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Mark Absent ✕
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
                  Mandatory Audit Reason (min 5 characters):
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: THEME.radii.sharp,
                    fontSize: '0.82rem',
                    fontFamily: THEME.fonts.sans,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
                  Faculty Trainer Signatory:
                </label>
                <input
                  type="text"
                  value={facultySignatory}
                  onChange={(e) => setFacultySignatory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: THEME.radii.sharp,
                    fontSize: '0.82rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button onClick={() => setOverrideModalTrainee(null)} style={buttonSecondaryStyle}>
                  Cancel
                </button>
                <button
                  disabled={overrideReason.trim().length < 5}
                  onClick={handleConfirmOverride}
                  style={buttonPrimaryStyle}
                >
                  Save & Log Audit Trail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
