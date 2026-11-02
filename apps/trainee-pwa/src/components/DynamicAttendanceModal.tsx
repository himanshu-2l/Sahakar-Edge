import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TimetableSession, SessionAttendanceRecord } from '@sahakar/types';
import { THEME, doubleBezelCardOuter, doubleBezelCardInner } from '../theme';
import { offlineStore, TraineeAttendanceRecord } from '../services/offline-store';
import { networkSync, ConnectivityState } from '../services/network-sync';

export interface DynamicAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: TimetableSession | any | null;
  trainee: {
    id: string;
    name: string;
    phone?: string;
    designation?: string;
    cooperativeAffiliation?: string;
  };
  isApprovedNominee?: boolean;
  language?: 'EN' | 'HI';
  onCheckInSuccess?: (record: SessionAttendanceRecord | TraineeAttendanceRecord) => void;
  networkConnectivity?: ConnectivityState;
}

export const DynamicAttendanceModal: React.FC<DynamicAttendanceModalProps> = ({
  isOpen,
  onClose,
  session,
  trainee,
  isApprovedNominee = true,
  language = 'EN',
  onCheckInSuccess,
  networkConnectivity,
}) => {
  // 6 discrete cell state
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  // Live timer for temporal guard arithmetic & countdown
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Submission & feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [successRecord, setSuccessRecord] = useState<SessionAttendanceRecord | TraineeAttendanceRecord | null>(null);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);

  // Active session fallback if null
  const activeSession: TimetableSession = useMemo(() => {
    if (session) return session;
    const today = new Date().toISOString().split('T')[0];
    return {
      id: 'sess-pacs-101',
      programmeId: 'prog-atp-2026-pacs-01',
      title: 'Double-Entry Daybook Ledger & Cash Voucher Posting',
      facultyId: 'cccc3333-3333-3333-3333-333333333333',
      facultyName: 'Prof. Ramesh Sharma',
      sessionDate: today,
      startTime: '09:30',
      endTime: '12:30',
      startsAt: new Date(Date.now() - 1800000).toISOString(),
      endsAt: new Date(Date.now() + 7200000).toISOString(),
      venue: 'Computer Lab 1 (Sahakar Edge Node)',
      checkInCode: '482910',
      status: 'ACTIVE',
      createdAt: '2026-08-20T00:00:00Z',
    };
  }, [session]);

  // Temporal Start Guard Arithmetic
  const temporalStatus = useMemo(() => {
    const startsAtIso = activeSession.startsAt || `${activeSession.sessionDate}T${activeSession.startTime}:00Z`;
    const endsAtIso = activeSession.endsAt || `${activeSession.sessionDate}T${activeSession.endTime}:00Z`;
    const startTimeMs = new Date(startsAtIso).getTime();
    const endTimeMs = new Date(endsAtIso).getTime();
    const nowMs = currentTime.getTime();

    // 1. Premature Check-in Guard (Strict Anti-Early Guard)
    if (nowMs < startTimeMs) {
      const remainingSec = Math.max(0, Math.floor((startTimeMs - nowMs) / 1000));
      const h = Math.floor(remainingSec / 3600);
      const m = Math.floor((remainingSec % 3600) / 60);
      const s = remainingSec % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        isPremature: true,
        isConcluded: false,
        countdown: `${pad(h)}h ${pad(m)}m ${pad(s)}s`,
        scheduledTimeFormatted: new Date(startsAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    // 2. Concluded Session Guard (30m grace)
    if (activeSession.status === 'CONCLUDED' || nowMs > endTimeMs + 30 * 60 * 1000) {
      return {
        isPremature: false,
        isConcluded: true,
        countdown: 'Concluded',
        scheduledTimeFormatted: '',
      };
    }

    return {
      isPremature: false,
      isConcluded: false,
      countdown: 'Active',
      scheduledTimeFormatted: '',
    };
  }, [activeSession, currentTime]);

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMessage(null);
      setSuccessRecord(null);
      setIsOfflineQueued(false);
      // Auto-focus first input if session is active
      if (!temporalStatus.isPremature && isApprovedNominee) {
        setTimeout(() => inputRefs[0].current?.focus(), 150);
      }
    }
  }, [isOpen, temporalStatus.isPremature, isApprovedNominee]);

  // Cell change handler with automatic advance
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const copy = [...digits];
      copy[index] = '';
      setDigits(copy);
      return;
    }

    const lastChar = clean[clean.length - 1];
    const copy = [...digits];
    copy[index] = lastChar;
    setDigits(copy);
    setErrorMessage(null);

    // Auto-advance to next input cell
    if (index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Backspace regression & keyboard navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        const copy = [...digits];
        copy[index - 1] = '';
        setDigits(copy);
        inputRefs[index - 1].current?.focus();
      } else {
        const copy = [...digits];
        copy[index] = '';
        setDigits(copy);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Full 6-digit clipboard paste support
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    setErrorMessage(null);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs[focusIndex].current?.focus();
  };

  const isComplete = digits.every((d) => d !== '');
  const enteredCode = digits.join('');

  // Offline Fallback Handler
  const fallbackOfflineCheckIn = useCallback(() => {
    if (activeSession.checkInCode && enteredCode !== activeSession.checkInCode) {
      setErrorMessage(
        language === 'HI'
          ? 'अमान्य 6-अंकीय कोड! कृपया कक्षा में प्रदर्शित कोड पुनः दर्ज करें।'
          : 'Invalid 6-digit code! Please re-check the classroom projector.'
      );
      setDigits(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();
      return;
    }

    const { record } = offlineStore.recordAttendance(
      activeSession.id,
      trainee.id,
      'DYNAMIC_CODE' as any
    );

    setIsOfflineQueued(true);
    setSuccessRecord(record);
    onCheckInSuccess?.(record);
  }, [activeSession, enteredCode, language, onCheckInSuccess, trainee.id]);

  // Primary Check-In Verification Action
  const handleSubmitCheckIn = useCallback(async () => {
    if (!isComplete || isSubmitting) return;

    // 1. Anti-Early Temporal Start Guard Check
    if (temporalStatus.isPremature) {
      setErrorMessage(
        language === 'HI'
          ? 'सत्र प्रारंभ नहीं हुआ! निर्धारित समय से पूर्व उपस्थिति दर्ज करना प्रतिबंधित है।'
          : 'Session has not yet commenced! Premature attendance logging is strictly prohibited.'
      );
      return;
    }

    // 2. Approved Nominee Guard Check
    if (!isApprovedNominee) {
      setErrorMessage(
        language === 'HI'
          ? 'प्रशिक्षु के पास इस कार्यक्रम के लिए स्वीकृत नामांकन नहीं है।'
          : 'Trainee does not possess an approved nomination for this training programme batch.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const isOnline = networkConnectivity?.mode !== 'OFFLINE';

    if (isOnline) {
      try {
        const centralUrl = networkSync.getCentralUrl();
        const res = await fetch(`${centralUrl}/api/v1/training/attendance/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSession.id,
            traineeId: trainee.id,
            checkInCode: enteredCode,
            verificationMethod: 'DYNAMIC_CODE',
          }),
        });

        const json = await res.json();

        if (res.ok && json.success) {
          offlineStore.recordAttendance(activeSession.id, trainee.id, 'DYNAMIC_CODE' as any);
          setSuccessRecord(json.record);
          setIsOfflineQueued(false);
          onCheckInSuccess?.(json.record);
          setIsSubmitting(false);
          return;
        }

        // Map backend error codes
        if (json.error === 'EARLY_CHECK_IN_BLOCKED') {
          setErrorMessage(
            language === 'HI'
              ? 'सत्र प्रारंभ सुरक्षा: निर्धारित समय से पूर्व उपस्थिति अवरुद्ध है।'
              : 'Temporal Guard Active: Premature check-in is blocked until session start.'
          );
        } else if (json.error === 'NOT_APPROVED_NOMINEE') {
          setErrorMessage(
            language === 'HI'
              ? 'अस्वीकृत नामांकन: आपका नामांकन इस बैच के लिए स्वीकृत नहीं है।'
              : 'Nomination Unapproved: You do not hold an approved seat in this batch.'
          );
        } else if (json.error === 'ALREADY_CHECKED_IN') {
          setErrorMessage(
            language === 'HI'
              ? 'उपस्थिति पहले से ही दर्ज एवं सत्यापित है।'
              : 'Attendance has already been recorded and verified for this session.'
          );
        } else {
          setErrorMessage(
            language === 'HI'
              ? `अमान्य कोड: कक्षा में प्रदर्शित 6-अंकीय कोड की जांच करें। (${retryCount + 1} प्रयास)`
              : `Invalid check-in code. Verify the 6 digits projected by faculty. (Attempt ${retryCount + 1})`
          );
          setRetryCount((c) => c + 1);
          setDigits(['', '', '', '', '', '']);
          inputRefs[0].current?.focus();
        }
      } catch {
        // Network timeout / connection drop -> Fallback to Offline WAL Queue
        fallbackOfflineCheckIn();
      }
    } else {
      // Offline mode direct fallback
      fallbackOfflineCheckIn();
    }

    setIsSubmitting(false);
  }, [
    isComplete,
    isSubmitting,
    temporalStatus.isPremature,
    isApprovedNominee,
    networkConnectivity,
    activeSession,
    trainee,
    enteredCode,
    language,
    retryCount,
    onCheckInSuccess,
    fallbackOfflineCheckIn,
  ]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 24, 84, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div style={{ ...doubleBezelCardOuter, maxWidth: '580px', width: '100%' }}>
        <div style={{ ...doubleBezelCardInner, padding: '0', overflow: 'hidden' }}>
          {/* Government Tricolor Ribbon */}
          <div style={{ display: 'flex', height: '4px', width: '100%' }}>
            <div style={{ flex: 1, backgroundColor: THEME.colors.saffronFlag }} />
            <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
            <div style={{ flex: 1, backgroundColor: THEME.colors.greenFlag }} />
          </div>

          {/* Modal Header Bar */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: THEME.colors.navyDeep,
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                  {language === 'HI' ? '6-अंकीय गतिशील उपस्थिति सत्यापन' : '6-Digit Dynamic Attendance Check-In'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                  NCCT Statutory Classroom Register • National Council for Cooperative Training
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close attendance modal"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              ✕
            </button>
          </div>

          {/* Session Overview Strip */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: THEME.colors.bgInset,
              borderBottom: `1px solid ${THEME.colors.borderHairline}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.navyPrimary, textTransform: 'uppercase' }}>
                {activeSession.sessionDate} • {activeSession.startTime} – {activeSession.endTime}
              </div>
              <div style={{ fontWeight: 800, color: THEME.colors.inkPrimary, fontSize: '0.95rem' }}>
                {activeSession.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: THEME.colors.inkMuted }}>
                Faculty: <strong>{activeSession.facultyName}</strong> • Venue: <strong>{activeSession.venue}</strong>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
                backgroundColor: temporalStatus.isPremature ? '#fefce8' : '#dcfce7',
                color: temporalStatus.isPremature ? '#854d0e' : '#15803d',
                border: `1px solid ${temporalStatus.isPremature ? '#fef08a' : '#86efac'}`,
              }}
            >
              {temporalStatus.isPremature ? 'LOCKED' : 'ACTIVE'}
            </span>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '1.5rem' }}>
            {/* SUCCESS VIEW */}
            {successRecord ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1.5rem 1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ margin: '0 0 0.25rem 0', color: '#166534', fontWeight: 900, fontSize: '1.25rem' }}>
                  {language === 'HI' ? 'उपस्थिति सत्यापित एवं दर्ज!' : 'Attendance Verified & Logged!'}
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', color: '#15803d', fontSize: '0.85rem' }}>
                  {isOfflineQueued
                    ? language === 'HI'
                      ? 'ऑफ़लाइन स्थानीय एज नोड पर सुरक्षित। WAN कनेक्शन मिलने पर स्वतः सिंक्रनाइज़ होगा।'
                      : 'Buffered securely in local SQLite WAL. Will sync to central registry on WAN reconnect.'
                    : language === 'HI'
                    ? 'केंद्रीय NCCT उपस्थिति रजिस्टर में तत्काल सत्यापित एवं दर्ज।'
                    : 'Statutory presence verified and recorded in Central NCCT Registry.'}
                </p>

                {/* Statutory Receipt Grid */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #bbf7d0',
                    borderRadius: '4px',
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.825rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.65rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>Trainee:</span>
                    <div style={{ fontWeight: 700, color: '#081854' }}>{trainee.name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Designation:</span>
                    <div style={{ fontWeight: 700, color: '#081854' }}>{trainee.designation || 'Trainee'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Session ID:</span>
                    <div style={{ fontWeight: 600, color: '#081854', fontFamily: THEME.fonts.mono }}>{activeSession.id}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Method:</span>
                    <div style={{ fontWeight: 700, color: '#15803d' }}>DYNAMIC_CODE (6-Digit OTP)</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b' }}>Timestamp:</span>
                    <div style={{ fontWeight: 600, color: '#081854', fontFamily: THEME.fonts.mono }}>
                      {new Date().toISOString()}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: THEME.colors.navyPrimary,
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '4px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    minHeight: '44px',
                    cursor: 'pointer',
                  }}
                >
                  {language === 'HI' ? 'पूर्ण / बंद करें' : 'Done / Close'}
                </button>
              </div>
            ) : (
              <div>
                {/* 1. TEMPORAL START GUARD AMBER WARNING DIALOG */}
                {temporalStatus.isPremature && (
                  <div
                    style={{
                      marginBottom: '1.25rem',
                      padding: '1rem 1.25rem',
                      backgroundColor: '#fefce8',
                      border: '1px solid #fde047',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⏳</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#854d0e', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                        {language === 'HI'
                          ? 'सत्र प्रारंभ नहीं हुआ / Session has not yet commenced'
                          : 'Temporal Start Guard: Check-In Locked'}
                      </div>
                      <p style={{ margin: '0 0 0.65rem 0', color: '#713f12', fontSize: '0.825rem', lineHeight: 1.45 }}>
                        {language === 'HI'
                          ? `सत्र प्रारंभ होने के निर्धारित समय (${temporalStatus.scheduledTimeFormatted}) पर ही उपस्थिति दर्ज की जा सकती है। अनाधिकृत अग्रिम उपस्थिति अवरुद्ध है।`
                          : `Check-in opens at scheduled start time (${temporalStatus.scheduledTimeFormatted}). Premature attendance logging is prohibited.`}
                      </p>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fef08a',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.825rem',
                          fontWeight: 800,
                          color: '#854d0e',
                        }}
                      >
                        <span>⏰ {language === 'HI' ? 'सत्र प्रारंभ में शेष:' : 'Opens In:'}</span>
                        <span style={{ fontFamily: THEME.fonts.mono, fontSize: '0.95rem' }}>
                          {temporalStatus.countdown}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. UNAPPROVED NOMINEE WARNING */}
                {!isApprovedNominee && (
                  <div
                    style={{
                      marginBottom: '1.25rem',
                      padding: '1rem 1.25rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🚫</span>
                    <div>
                      <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                        {language === 'HI' ? 'नामांकन अस्वीकृत / अनधिकृत' : 'Unapproved Trainee Nomination'}
                      </div>
                      <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.825rem', lineHeight: 1.45 }}>
                        {language === 'HI'
                          ? 'प्रशिक्षु के पास इस कार्यक्रम के लिए स्वीकृत नामांकन नहीं है। कृपया संस्थान निदेशालय से संपर्क करें।'
                          : 'Trainee does not possess an approved nomination for this training programme batch. Please contact the Course Director.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div
                    style={{
                      marginBottom: '1.25rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      color: '#991b1b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>⚠️ {errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => setErrorMessage(null)}
                      style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 800, minHeight: '44px', minWidth: '44px' }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* 3. 6 INDIVIDUAL NUMERIC INPUT CELLS */}
                <div style={{ textAlign: 'center', margin: '1.25rem 0' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: THEME.colors.inkPrimary,
                      marginBottom: '0.85rem',
                    }}
                  >
                    {language === 'HI'
                      ? 'कक्षा में प्रदर्शित 6-अंकीय उपस्थिति कोड दर्ज करें:'
                      : 'Enter 6-Digit Session Attendance Code Displayed by Trainer:'}
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      margin: '0 auto',
                      maxWidth: '380px',
                    }}
                  >
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={inputRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        autoComplete="one-time-code"
                        disabled={temporalStatus.isPremature || !isApprovedNominee || isSubmitting}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        aria-label={`Digit ${idx + 1} of 6`}
                        style={{
                          width: '48px',
                          height: '58px',
                          fontSize: '1.75rem',
                          fontWeight: 900,
                          fontFamily: THEME.fonts.mono,
                          textAlign: 'center',
                          color: THEME.colors.inkPrimary,
                          backgroundColor: digit ? '#eff6ff' : '#ffffff',
                          border: `2px solid ${digit ? THEME.colors.navyPrimary : '#cbd5e1'}`,
                          borderRadius: '4px',
                          outline: 'none',
                          boxShadow: digit ? '0 0 0 2px rgba(6, 73, 162, 0.15)' : 'none',
                          cursor: temporalStatus.isPremature || !isApprovedNominee ? 'not-allowed' : 'text',
                          opacity: temporalStatus.isPremature || !isApprovedNominee ? 0.6 : 1,
                          transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                    {language === 'HI'
                      ? 'क्लिपबोर्ड से 6-अंकीय कोड पेस्ट करने की सुविधा उपलब्ध है।'
                      : 'Supports automatic cell advance, backspace regression, and full-string paste.'}
                  </div>
                </div>

                {/* Primary Submit Action */}
                <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDigits(['', '', '', '', '', '']);
                      setErrorMessage(null);
                      inputRefs[0].current?.focus();
                    }}
                    disabled={isSubmitting || digits.every((d) => d === '')}
                    style={{
                      flex: 1,
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      minHeight: '44px',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    {language === 'HI' ? 'रीसेट' : 'Clear'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitCheckIn}
                    disabled={
                      !isComplete ||
                      temporalStatus.isPremature ||
                      !isApprovedNominee ||
                      isSubmitting
                    }
                    style={{
                      flex: 2,
                      backgroundColor:
                        !isComplete || temporalStatus.isPremature || !isApprovedNominee
                          ? '#94a3b8'
                          : THEME.colors.navyPrimary,
                      color: '#ffffff',
                      border: `1px solid ${THEME.colors.goldCoop}`,
                      minHeight: '44px',
                      padding: '0.75rem',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '0.925rem',
                      cursor:
                        !isComplete || temporalStatus.isPremature || !isApprovedNominee
                          ? 'not-allowed'
                          : 'pointer',
                      boxShadow: '0 1px 3px rgba(6, 73, 162, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {isSubmitting ? (
                      <span>⏳ {language === 'HI' ? 'सत्यापन जारी...' : 'Verifying Code...'}</span>
                    ) : (
                      <>
                        <span>🔒</span>
                        <span>
                          {language === 'HI'
                            ? 'उपस्थिति सत्यापित करें'
                            : 'Verify & Record Attendance'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
