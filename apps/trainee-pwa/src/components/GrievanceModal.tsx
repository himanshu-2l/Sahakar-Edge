import React, { useState, useEffect } from 'react';
import type {
  GrievanceTicket,
  GrievancePriority,
  GrievanceCategory,
} from '@sahakar/types';

export interface GrievanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'EN' | 'HI';
  trainee?: {
    id: string;
    name: string;
    emailOrPhone?: string;
    role?: string;
  };
  traineeId?: string;
}

export const MSCS_SLA_TIERS = [
  { tier: 1, name: 'Society / Institute Level', nameHi: 'समिति / संस्थान स्तर', slaHours: 48, authority: 'PACS Secretary / RICM Director' },
  { tier: 2, name: 'District Level', nameHi: 'जिला स्तर (डीसीसीबी / डीआरसीएस)', slaHours: 168, authority: 'DCCB Branch / Deputy Registrar' },
  { tier: 3, name: 'State Level', nameHi: 'राज्य स्तर (शीर्ष बैंक / आरसीएस)', slaHours: 360, authority: 'State Cooperative Registrar' },
  { tier: 4, name: 'National Ombudsman', nameHi: 'राष्ट्रीय लोकपाल / केंद्रीय रजिस्ट्रार', slaHours: 720, authority: 'Central Registrar (CRCS) / Ombudsman' },
];

export const GRIEVANCE_CATEGORIES = [
  { id: 'KCC_LOAN_DISPUTE', label: 'KCC Crop Loan 3% Interest Subvention Discrepancy', labelHi: 'केसीसी फसल ऋण 3% ब्याज छूट विसंगति' },
  { id: 'TRAINING_CERTIFICATE_DELAY', label: 'NCCT Training Certificate Delay & Ed25519 Issuance', labelHi: 'प्रशिक्षण प्रमाण पत्र एवं डिजिटल क्रेडेंशियल विलंब' },
  { id: 'FERTILIZER_PDS_DISCREPANCY', label: 'Fertilizer POS Billing & Subsidized Quota Shortage', labelHi: 'उर्वरक पीओएस बिलिंग एवं रियायती कोटा विसंगति' },
  { id: 'HOSTEL_MESS_AMENITIES', label: 'RICM/ICM Campus Hostel & Mess Facilities', labelHi: 'परिसर छात्रावास एवं भोजन व्यवस्था शिकायत' },
  { id: 'GOVERNANCE_VOTER_LIST', label: 'Cooperative Society AGM Quorum & Voter List Exclusion', labelHi: 'आमसभा कोरम एवं मतदाता सूची निष्कासन विवाद' },
  { id: 'PACS_COMPUTERIZATION_HARDWARE', label: 'ERP Hardware Terminal & Biometric Sync Latency', labelHi: 'ईआरपी हार्डवेयर टर्मिनल एवं बायोमेट्रिक सिंक समस्या' },
  { id: 'FINANCIAL_MISAPPROPRIATION', label: 'Audit Grade D Forensic Investigation under Sec 108', labelHi: 'धारा 108 के तहत फोरेंसिक जांच एवं एनपीए विसंगति' },
];

// Initial seed tickets matching central-api Anita Patel / bilkisganj
const INITIAL_SEED_TICKETS: GrievanceTicket[] = [
  {
    id: 'grv-2026-001',
    ticketNumber: 'GRV-2026-T1-0101',
    complainantId: 'dddd4444-4444-4444-4444-444444444441',
    complainantName: 'Anita Patel',
    complainantRole: 'PACS_MEMBER',
    societyOrInstituteId: 'pacs-mp-bho-001',
    societyName: 'Bilkisganj Model PACS, Sehore (MP)',
    category: 'KCC_LOAN_DISPUTE',
    title: 'Discrepancy in KCC Crop Loan 3% Interest Subvention Credit',
    description: 'Kharif 2026 crop loan repayment was completed before deadline, but 3% prompt repayment incentive subsidy of ₹4,200 has not been credited to savings ledger.',
    priority: 'HIGH',
    status: 'LODGED',
    currentTier: 1,
    escalationDeadline: new Date(Date.now() + 38 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 38,
    slaBreached: false,
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_RESOLVED_TICKETS: GrievanceTicket[] = [
  {
    id: 'grv-2026-000',
    ticketNumber: 'GRV-2026-T1-0089',
    complainantId: 'dddd4444-4444-4444-4444-444444444441',
    complainantName: 'Anita Patel',
    complainantRole: 'TRAINEE',
    societyOrInstituteId: 'pacs-mp-bho-001',
    societyName: 'Bilkisganj Model PACS, Sehore (MP)',
    category: 'TRAINING_CERTIFICATE_DELAY',
    title: 'NCCT Cooperative Accounting Module 1 Completion Attestation',
    description: 'Course completion record was pending verification from RICM Bhopal examination wing.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    currentTier: 1,
    escalationDeadline: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    slaHoursRemaining: 0,
    slaBreached: false,
    resolutionSummary: 'Verified by District Registrar on 24-Oct-2026. Ed25519 verifiable credential issued successfully.',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export const GrievanceModal: React.FC<GrievanceModalProps> = ({
  isOpen,
  onClose,
  language: initialLanguage = 'EN',
  trainee,
  traineeId,
}) => {
  const currentTrainee = trainee || {
    id: traineeId || 'dddd4444-4444-4444-4444-444444444441',
    name: 'Anita Patel',
    emailOrPhone: 'anita.patel@mp.coop.gov.in',
    role: 'PACS_MEMBER',
  };
  const [language, setLanguage] = useState<'EN' | 'HI'>(initialLanguage);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'LODGE' | 'RESOLVED'>('ACTIVE');
  const [tickets, setTickets] = useState<GrievanceTicket[]>(INITIAL_SEED_TICKETS);
  const [resolvedTickets] = useState<GrievanceTicket[]>(INITIAL_RESOLVED_TICKETS);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Form State for new grievance
  const [category, setCategory] = useState<GrievanceCategory>('KCC_LOAN_DISPUTE');
  const [priority, setPriority] = useState<GrievancePriority>('MEDIUM');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [societyName, setSocietyName] = useState<string>('Bilkisganj Model PACS, Sehore (MP)');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  // Live 1000ms SLA Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleLodgeGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert(language === 'HI' ? 'कृपया शीर्षक एवं विवरण भरें।' : 'Please enter title and description.');
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newTicket: GrievanceTicket = {
      id: `grv-2026-${randomNum}`,
      ticketNumber: `GRV-2026-T1-${randomNum}`,
      complainantId: currentTrainee.id || 'dddd4444-4444-4444-4444-444444444441',
      complainantName: currentTrainee.name || 'Anita Patel',
      complainantRole: 'PACS_MEMBER',
      societyOrInstituteId: 'pacs-mp-bho-001',
      societyName: societyName || 'Bilkisganj Model PACS, Sehore (MP)',
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'LODGED',
      currentTier: 1,
      escalationDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      slaHoursRemaining: 48,
      slaBreached: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    setTitle('');
    setDescription('');
    setSubmittedNotice(
      language === 'HI'
        ? `शिकायत #${newTicket.ticketNumber} सफलतापूर्वक दर्ज। 48-घंटे की टीयर-1 समय-सीमा सक्रिय।`
        : `Grievance #${newTicket.ticketNumber} lodged successfully. 48-Hour Tier-1 SLA timer active.`
    );
    setActiveTab('ACTIVE');
    setTimeout(() => setSubmittedNotice(null), 6000);
  };

  const handleEscalateTier = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const nextTier = Math.min(4, t.currentTier + 1) as 1 | 2 | 3 | 4;
          const tierHours = nextTier === 2 ? 168 : nextTier === 3 ? 360 : 720;
          return {
            ...t,
            currentTier: nextTier,
            status: nextTier === 4 ? 'ESCALATED_MINISTERIAL' : 'UNDER_INVESTIGATION',
            escalationDeadline: new Date(Date.now() + tierHours * 3600 * 1000).toISOString(),
            slaHoursRemaining: tierHours,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const formatCountdown = (deadlineIso: string) => {
    const diffMs = new Date(deadlineIso).getTime() - currentTime;
    if (diffMs <= 0) {
      return { text: 'SLA BREACHED', hours: 0, minutes: 0, seconds: 0, breached: true, ratio: 0 };
    }
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const ratio = Math.min(1, diffMs / (48 * 3600 * 1000));
    return {
      text: `${hours}h ${minutes}m ${seconds}s remaining`,
      hours,
      minutes,
      seconds,
      breached: false,
      ratio,
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #cbd5e1',
          maxHeight: '94vh',
        }}
      >
        {/* National Tricolor Top Ribbon */}
        <div style={{ display: 'flex', height: '4px', width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: '#ea580c' }} />
          <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
          <div style={{ flex: 1, backgroundColor: '#16a34a' }} />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚖️</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff' }}>
                {language === 'HI'
                  ? 'सदस्य शिकायत निवारण एवं लोकपाल हेल्पडेस्क'
                  : 'Member Grievance Redressal & Ombudsman Helpdesk'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.55 }}>
                {language === 'HI'
                  ? 'एमएससीएस अधिनियम 2023 • 4-स्तरीय सांविधिक समय-सीमा (48 घंटे टीयर-1 गारंटी)'
                  : 'MSCS Act 2023 • 4-Tier Statutory SLA Tracker (48-Hour Tier-1 Guarantee)'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Language Switcher */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid #334155',
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                style={{
                  minHeight: '44px',
                  minWidth: '48px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: language === 'EN' ? '#0369a1' : 'transparent',
                  color: language === 'EN' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('HI')}
                style={{
                  minHeight: '44px',
                  minWidth: '48px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: language === 'HI' ? '#0369a1' : 'transparent',
                  color: language === 'HI' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                हिंदी
              </button>
            </div>

            {/* Circular 44px Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close modal"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation (minHeight >= 44px) */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.25rem 0.5rem',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            style={{
              minHeight: '44px',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'ACTIVE' ? '3px solid #0369a1' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'ACTIVE' ? '#0369a1' : '#64748b',
              fontWeight: activeTab === 'ACTIVE' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>⏱️</span>
            <span>{language === 'HI' ? `सक्रिय शिकायतें (${tickets.length})` : `Active Tickets (${tickets.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LODGE')}
            style={{
              minHeight: '44px',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'LODGE' ? '3px solid #0369a1' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'LODGE' ? '#0369a1' : '#64748b',
              fontWeight: activeTab === 'LODGE' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>📝</span>
            <span>{language === 'HI' ? 'नई शिकायत दर्ज करें' : 'Lodge Grievance'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESOLVED')}
            style={{
              minHeight: '44px',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'RESOLVED' ? '3px solid #0369a1' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'RESOLVED' ? '#0369a1' : '#64748b',
              fontWeight: activeTab === 'RESOLVED' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>✅</span>
            <span>{language === 'HI' ? `निस्तारित शिकायतें (${resolvedTickets.length})` : `Resolved Archive (${resolvedTickets.length})`}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {submittedNotice && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: '#dcfce7',
                borderRadius: '8px',
                border: '1px solid #86efac',
                color: '#15803d',
                fontSize: '0.875rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>✓</span>
              <span>{submittedNotice}</span>
            </div>
          )}

          {/* TAB 1: ACTIVE TICKETS & LIVE SLA TRACKER */}
          {activeTab === 'ACTIVE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* MSCS Statutory Policy Note */}
              <div
                style={{
                  padding: '0.85rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '10px',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.8125rem',
                  color: '#1e40af',
                  lineHeight: 1.55,
                }}
              >
                <strong>{language === 'HI' ? 'वैधानिक 4-स्तरीय निवारण नीति (MSCS Act 2023):' : 'MSCS Act 2023 Statutory Resolution Tiers:'}</strong>{' '}
                {language === 'HI'
                  ? 'टीयर 1 (समिति): 48 घंटे • टीयर 2 (जिला स्तर): 7 दिन • टीयर 3 (राज्य स्तर): 15 दिन • टीयर 4 (केंद्रीय लोकपाल): 30 दिन। समय सीमा समाप्त होने पर स्वतः एस्केलेशन उपलब्ध।'
                  : 'Tier 1 (Society): 48 Hours • Tier 2 (District): 7 Days • Tier 3 (State): 15 Days • Tier 4 (National Ombudsman): 30 Days.'}
              </div>

              {tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
                  {language === 'HI' ? 'कोई सक्रिय शिकायत नहीं है।' : 'No active grievances found.'}
                </div>
              ) : (
                tickets.map((tkt) => {
                  const countdown = formatCountdown(tkt.escalationDeadline);
                  const currentTierInfo = MSCS_SLA_TIERS.find((tier) => tier.tier === tkt.currentTier) || MSCS_SLA_TIERS[0];

                  return (
                    <div
                      key={tkt.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        padding: '1.25rem',
                        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Ticket Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              fontWeight: 800,
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            {tkt.ticketNumber}
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                            {tkt.title}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            backgroundColor: tkt.priority === 'HIGH' || tkt.priority === 'URGENT' ? '#fee2e2' : '#fef3c7',
                            color: tkt.priority === 'HIGH' || tkt.priority === 'URGENT' ? '#b91c1c' : '#b45309',
                          }}
                        >
                          {tkt.priority} PRIORITY
                        </span>
                      </div>

                      {/* Description & Society Info */}
                      <div style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.55 }}>
                        {tkt.description}
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        <strong>{language === 'HI' ? 'संबद्ध समिति/संस्थान:' : 'Affiliated Entity:'}</strong> {tkt.societyName} •{' '}
                        <strong>{language === 'HI' ? 'शिकायतकर्ता:' : 'Complainant:'}</strong> {tkt.complainantName} ({tkt.complainantRole})
                      </div>

                      {/* 4-Tier Visual Stepper */}
                      <div style={{ marginTop: '0.35rem' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                          {language === 'HI' ? 'सांविधिक निवारण स्तर:' : 'Statutory Resolution Tier:'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                          {MSCS_SLA_TIERS.map((tier) => {
                            const isCurrent = tier.tier === tkt.currentTier;
                            const isPast = tier.tier < tkt.currentTier;

                            return (
                              <div
                                key={tier.tier}
                                style={{
                                  padding: '0.45rem',
                                  borderRadius: '6px',
                                  textAlign: 'center',
                                  backgroundColor: isCurrent ? '#0369a1' : isPast ? '#dcfce7' : '#f1f5f9',
                                  color: isCurrent ? '#ffffff' : isPast ? '#15803d' : '#64748b',
                                  border: isCurrent ? '1px solid #0284c7' : '1px solid #e2e8f0',
                                }}
                              >
                                <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                  Tier {tier.tier} ({tier.slaHours}h)
                                </div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginTop: '0.15rem' }}>
                                  {language === 'HI' ? tier.nameHi.split(' ')[0] : tier.name.split(' ')[0]}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Live SLA Countdown Bar */}
                      <div
                        style={{
                          backgroundColor: countdown.breached ? '#fee2e2' : countdown.ratio < 0.25 ? '#fef3c7' : '#f0fdf4',
                          border: `1px solid ${countdown.breached ? '#fca5a5' : countdown.ratio < 0.25 ? '#fcd34d' : '#86efac'}`,
                          borderRadius: '8px',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155' }}>
                            {language === 'HI'
                              ? `टीयर-${tkt.currentTier} समय-सीमा (${currentTierInfo.authority}):`
                              : `Tier-${tkt.currentTier} Deadline (${currentTierInfo.authority}):`}
                          </span>
                          <span
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 900,
                              color: countdown.breached ? '#b91c1c' : countdown.ratio < 0.25 ? '#b45309' : '#15803d',
                              fontFamily: 'monospace',
                            }}
                          >
                            ⏱️ {countdown.text}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.round(countdown.ratio * 100)}%`,
                              height: '100%',
                              backgroundColor: countdown.breached ? '#dc2626' : countdown.ratio < 0.25 ? '#f59e0b' : '#16a34a',
                              transition: 'width 1s linear',
                            }}
                          />
                        </div>
                      </div>

                      {/* Escalation Action Button */}
                      {tkt.currentTier < 4 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => handleEscalateTier(tkt.id)}
                            style={{
                              minHeight: '44px',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#0369a1',
                              fontWeight: 700,
                              fontSize: '0.8125rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>⬆️</span>
                            <span>
                              {language === 'HI'
                                ? `अगले स्तर (टीयर-${tkt.currentTier + 1}) पर एस्केलेट करें`
                                : `Escalate to Tier ${tkt.currentTier + 1} (${MSCS_SLA_TIERS[tkt.currentTier].name})`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: LODGE NEW GRIEVANCE */}
          {activeTab === 'LODGE' && (
            <form onSubmit={handleLodgeGrievance} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'शिकायत श्रेणी (Category)' : 'Grievance Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GrievanceCategory)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  {GRIEVANCE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {language === 'HI' ? c.labelHi : c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'प्राथमिकता स्तर (Priority)' : 'Priority Level'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as GrievancePriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1,
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: priority === p ? '2px solid #0369a1' : '1px solid #cbd5e1',
                        backgroundColor: priority === p ? '#e0f2fe' : '#ffffff',
                        color: priority === p ? '#0369a1' : '#475569',
                        fontWeight: priority === p ? 800 : 600,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'संबद्ध समिति / प्रशिक्षण संस्थान' : 'Affiliated Society / Institute'}
                </label>
                <input
                  type="text"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'शिकायत का शीर्षक' : 'Grievance Title'}
                </label>
                <input
                  type="text"
                  value={title}
                  placeholder={language === 'HI' ? 'उदा. केसीसी ब्याज छूट खाते में जमा नहीं हुई' : 'e.g. KCC 3% interest subvention not credited'}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'विस्तृत विवरण एवं साक्ष्य' : 'Detailed Description & Context'}
                </label>
                <textarea
                  value={description}
                  placeholder={language === 'HI' ? 'कृपया तिथि, वाउचर क्रमांक एवं समस्या का पूरा विवरण दर्ज करें...' : 'Provide complete dates, voucher numbers, and discrepancy details...'}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: 1.55,
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    minHeight: '44px',
                    backgroundColor: '#0369a1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>⚖️</span>
                  <span>{language === 'HI' ? 'सांविधिक शिकायत दर्ज करें (48h SLA)' : 'Lodge Grievance with 48h SLA'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RESOLVED ARCHIVE */}
          {activeTab === 'RESOLVED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                {language === 'HI' ? 'निस्तारित शिकायतें एवं समाधान आदेश:' : 'Resolved Complaints & Settlement Orders:'}
              </div>

              {resolvedTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #86efac',
                    padding: '1rem',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        {tkt.ticketNumber}
                      </span>
                      <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{tkt.title}</strong>
                    </div>

                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '12px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                      }}
                    >
                      ✓ RESOLVED
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.55 }}>
                    {tkt.description}
                  </div>

                  <div
                    style={{
                      marginTop: '0.35rem',
                      padding: '0.65rem',
                      borderRadius: '6px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      fontSize: '0.8125rem',
                      color: '#166534',
                      lineHeight: 1.55,
                    }}
                  >
                    <strong>{language === 'HI' ? 'निस्तारण आदेश / विवरण:' : 'Resolution Summary:'}</strong>{' '}
                    {tkt.resolutionSummary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
