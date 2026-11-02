import React from 'react';
import { THEME, pillBadge } from './theme';
import { BackendStatus } from '../services/api-client';
import { AdminTab } from './SidebarNav';
import { AshokChakraIcon } from './icons';

interface TopHeaderProps {
  activeTab: AdminTab;
  setActiveTab?: (tab: AdminTab) => void;
  backendStatus: BackendStatus;
  edgeNodesCount: number;
}

export function TopHeader({ activeTab, setActiveTab, backendStatus, edgeNodesCount }: TopHeaderProps) {
  const [liveDateTime, setLiveDateTime] = React.useState('');
  const [lang, setLang] = React.useState<'HI' | 'EN'>('HI');

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString(lang === 'HI' ? 'hi-IN' : 'en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
      setLiveDateTime(`${dateStr} | ${timeStr} IST`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  const tabTitles: Record<string, { directorate: string; title: string }> = {
    OVERVIEW: {
      directorate: 'Directorate 1: Apex Governance',
      title: 'Executive Overview & National KPIs',
    },
    FEDERATION: {
      directorate: 'Directorate 1: Apex Governance',
      title: 'National Multi-Tier Federation & Hierarchy Map',
    },
    SCHEME_RADAR: {
      directorate: 'Directorate 1: Apex Governance',
      title: 'National Scheme Advisory Radar & Society Benefit Simulator',
    },
    CAMEL_SCORECARD: {
      directorate: 'Directorate 1: Apex Governance',
      title: 'Primary Cooperative CAMEL Health Scorecard & Audit Roster',
    },
    INSTITUTES: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'Cooperative Training Centers & Institutes',
    },
    PROGRAMMES: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'Capacity Building Programmes',
    },
    BATCHES: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'Training Cohorts & Batch Assignments',
    },
    COURSES: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'Curricular Courses & Offline Modules',
    },
    VIVA_ANALYTICS: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'NCCT Viva-Voce Rubric Performance & Institutional League Table',
    },
    PACS_SIMULATION_HEATMAP: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'PACS Operations Lab: Student Ledger Balancing Error Heatmap',
    },
    ATP_BATCHES: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'वार्षिक प्रशिक्षण योजना एवं बैच नामांकन / Annual Training Plan (ATP) & Batch Nominations',
    },
    'atp-batches': {
      directorate: 'Directorate 2: Institutional Training',
      title: 'वार्षिक प्रशिक्षण योजना एवं बैच नामांकन / Annual Training Plan (ATP) & Batch Nominations',
    },
    GRADEBOOK: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'सतत मूल्यांकन, संचयी अंक संकलन एवं संविधिक ग्रेडबुक / Continuous Gradebook & Multi-Sheet XLSX Export',
    },
    gradebook: {
      directorate: 'Directorate 2: Institutional Training',
      title: 'सतत मूल्यांकन, संचयी अंक संकलन एवं संविधिक ग्रेडबुक / Continuous Gradebook & Multi-Sheet XLSX Export',
    },
    DROPOUT_RISK_ANALYTICS: {
      directorate: 'Directorate 2: Institutional Training',
      title: '4-कारक ड्रॉपआउट जोखिम निवारण एवं सहकारी कौशल रडार / Dropout-Risk Triage & Skill Gap Radar',
    },
    'dropout-risk-analytics': {
      directorate: 'Directorate 2: Institutional Training',
      title: '4-कारक ड्रॉपआउट जोखिम निवारण एवं सहकारी कौशल रडार / Dropout-Risk Triage & Skill Gap Radar',
    },
    ATTENDANCE: {
      directorate: 'Directorate 3: Trainee Verification',
      title: 'Multi-Modal Attendance & Biometric Audit',
    },
    CREDENTIALS: {
      directorate: 'Directorate 3: Trainee Verification',
      title: 'Statutory Digital Credentials (Ed25519)',
    },
    PROOF_INSPECTOR: {
      directorate: 'Directorate 3: Trainee Verification',
      title: 'Sovereign Cryptographic Proof Inspector & Tamper Sandbox',
    },
    TIMETABLE_ATTENDANCE: {
      directorate: 'Directorate 3: Trainee Verification',
      title: 'समय-सारणी, गतिशील 6-अंकीय उपस्थिति एवं संकाय पंजी / Academic Timetable & Attendance Register',
    },
    'timetable-attendance': {
      directorate: 'Directorate 3: Trainee Verification',
      title: 'समय-सारणी, गतिशील 6-अंकीय उपस्थिति एवं संकाय पंजी / Academic Timetable & Attendance Register',
    },
    GRIEVANCES: {
      directorate: 'Directorate 4: Ombudsman & Redressal',
      title: 'National Co-operative Ombudsman & Grievance SLA Registry',
    },
    EMPLOYMENT: {
      directorate: 'Directorate 4: Industry & Logistics',
      title: 'Recruiter Kanban & Candidate Progression',
    },
    ERP_LOGISTICS: {
      directorate: 'Directorate 4: Industry & Logistics',
      title: 'Residential Hostel, Mess & Logistics ERP',
    },
    EDGE_NODES: {
      directorate: 'Directorate 5: Infrastructure & Security',
      title: 'Edge Hardware Fleet Telemetry (ARM64)',
    },
    SYNC_MONITOR: {
      directorate: 'Directorate 5: Infrastructure & Security',
      title: 'Offline Event Ingestion & Journal Sync',
    },
    AUDIT_LOG: {
      directorate: 'Directorate 5: Infrastructure & Security',
      title: 'Security & Compliance Audit Trail',
    },
  };

  const current = tabTitles[activeTab] || {
    directorate: 'Ministry Portal',
    title: activeTab,
  };

  const directorateCommands: Array<{
    id: number;
    label: string;
    targetTab: AdminTab;
    matches: AdminTab[];
  }> = [
    {
      id: 1,
      label: 'Dir 1: Apex Governance',
      targetTab: 'OVERVIEW',
      matches: ['OVERVIEW', 'FEDERATION', 'SCHEME_RADAR', 'CAMEL_SCORECARD'],
    },
    {
      id: 2,
      label: 'Dir 2: Institutional Training',
      targetTab: 'ATP_BATCHES',
      matches: [
        'INSTITUTES',
        'PROGRAMMES',
        'BATCHES',
        'COURSES',
        'VIVA_ANALYTICS',
        'PACS_SIMULATION_HEATMAP',
        'ATP_BATCHES',
        'atp-batches' as AdminTab,
        'GRADEBOOK',
        'gradebook' as AdminTab,
        'DROPOUT_RISK_ANALYTICS',
        'dropout-risk-analytics' as AdminTab,
      ],
    },
    {
      id: 3,
      label: 'Dir 3: Verification & Attendance',
      targetTab: 'TIMETABLE_ATTENDANCE',
      matches: [
        'ATTENDANCE',
        'CREDENTIALS',
        'PROOF_INSPECTOR',
        'TIMETABLE_ATTENDANCE',
        'timetable-attendance' as AdminTab,
      ],
    },
    {
      id: 4,
      label: 'Dir 4: Ombudsman & Redressal',
      targetTab: 'GRIEVANCES',
      matches: ['GRIEVANCES', 'EMPLOYMENT', 'ERP_LOGISTICS'],
    },
    {
      id: 5,
      label: 'Dir 5: Fleet & Infrastructure',
      targetTab: 'EDGE_NODES',
      matches: ['EDGE_NODES', 'SYNC_MONITOR', 'AUDIT_LOG'],
    },
  ];

  const lastActiveTabRef = React.useRef<Record<number, AdminTab>>({
    1: 'OVERVIEW',
    2: 'ATP_BATCHES',
    3: 'TIMETABLE_ATTENDANCE',
    4: 'GRIEVANCES',
    5: 'EDGE_NODES',
  });

  React.useEffect(() => {
    for (const cmd of directorateCommands) {
      if (cmd.matches.includes(activeTab)) {
        lastActiveTabRef.current[cmd.id] = activeTab;
        break;
      }
    }
  }, [activeTab]);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: '#ffffff',
        borderBottom: `1px solid ${THEME.colors.borderHairline}`,
        boxShadow: '0 1px 2px rgba(8, 24, 84, 0.04)',
      }}
    >
      {/* 1. National Tricolor Accent Strip (3.5px) */}
      <div style={{ height: '3.5px', width: '100%', display: 'flex' }}>
        <div style={{ flex: 1, backgroundColor: '#ff9933' }} />
        <div style={{ flex: 1, backgroundColor: '#ffffff', borderBottom: '0.5px solid #cbd5e1' }} />
        <div style={{ flex: 1, backgroundColor: '#138808' }} />
      </div>

      {/* 2. Top Government Utility Bar (#081854) */}
      <div
        style={{
          backgroundColor: '#081854',
          color: '#ffffff',
          padding: '0.28rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, letterSpacing: '0.03em' }}>
            भारत सरकार | Government of India
          </span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ opacity: 0.9 }}>
            सहकारिता मंत्रालय | Ministry of Cooperation
          </span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ fontFeatureSettings: '"tnum" 1', color: '#feb505', fontWeight: 600 }}>
            {liveDateTime}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <a
            href="#main-content"
            style={{
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0.1rem 0.4rem',
              borderRadius: '2px',
              backgroundColor: 'rgba(255,255,255,0.12)',
              fontSize: '0.68rem',
            }}
          >
            मुख्य सामग्री पर जाएं | Skip to Content
          </a>
          <button
            type="button"
            onClick={() => setLang(lang === 'HI' ? 'EN' : 'HI')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '2px',
              color: '#ffffff',
              padding: '0.1rem 0.45rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {lang === 'HI' ? 'English' : 'हिन्दी'}
          </button>
          <div style={{ display: 'inline-flex', gap: '0.15rem' }}>
            <button
              type="button"
              aria-label="Decrease Font Size"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              A-
            </button>
            <button
              type="button"
              aria-label="Default Font Size"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              A
            </button>
            <button
              type="button"
              aria-label="Increase Font Size"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              A+
            </button>
          </div>
          <span
            style={{
              backgroundColor: '#1b4698',
              color: '#ffffff',
              border: '1px solid #feb505',
              borderRadius: '2px',
              padding: '0.1rem 0.45rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            SUPER_ADMIN
          </span>
        </div>
      </div>

      {/* 3. Authoritative Masthead & Status Telemetry */}
      <div
        style={{
          padding: '0.65rem 2rem 0.55rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Left: Ashok Chakra & Council Statutory Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <AshokChakraIcon size={32} color="#0649a2" />
          <div>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: THEME.colors.navySovereign,
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{current.directorate}</span>
              <span>•</span>
              <span>राष्ट्रीय सहकारी प्रशिक्षण परिषद (NCCT)</span>
            </div>
            <h1
              style={{
                fontSize: '1.18rem',
                fontWeight: 800,
                color: THEME.colors.navyDeep,
                margin: '0.1rem 0 0 0',
                letterSpacing: '-0.015em',
              }}
            >
              {current.title}
            </h1>
          </div>
        </div>

        {/* Right: Live Telemetry Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Live Central API Status Pill */}
          <div
            title={`Central API: ${backendStatus.url} (${backendStatus.online ? 'Online' : 'Offline / Standalone Cache'})`}
            style={pillBadge(backendStatus.online ? 'success' : 'warning')}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: backendStatus.online ? '#16a34a' : '#ca8a04',
                display: 'inline-block',
              }}
            />
            <span>{backendStatus.online ? 'CENTRAL API ONLINE' : 'STANDALONE CACHE'}</span>
          </div>

          {/* Edge Fleet Status */}
          <div
            title="ARM64 Linux Edge Nodes operational in 20 training institutes"
            style={pillBadge('neutral')}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#0284c7',
                display: 'inline-block',
              }}
            />
            <span>{edgeNodesCount} EDGE NODES ONLINE</span>
          </div>

          {/* Slogan Pill with Ashok Chakra */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.74rem',
              fontWeight: 800,
              backgroundColor: '#f0fdf4',
              color: '#166534',
              padding: '0.22rem 0.65rem',
              borderRadius: THEME.radii.sharp,
              border: '1px solid #86efac',
              letterSpacing: '0.02em',
            }}
          >
            <AshokChakraIcon size={14} color="#166534" />
            <span>सहकार से समृद्धि</span>
          </div>
        </div>
      </div>

      {/* 4. Directorate Command Strip for 1-Click Macro Switching */}
      <div
        role="tablist"
        aria-label="Directorate Command Navigation"
        style={{
          padding: '0.35rem 2rem 0.5rem 2rem',
          borderTop: `1px solid ${THEME.colors.borderHairline}`,
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: THEME.colors.inkMuted,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginRight: '0.25rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Directorate Strip:
        </span>
        {directorateCommands.map((cmd) => {
          const isActive = cmd.matches.includes(activeTab);
          return (
            <button
              key={cmd.id}
              role="tab"
              aria-selected={isActive}
              aria-label={`Switch to ${cmd.label}`}
              onClick={() => {
                if (setActiveTab) {
                  const targetTab = lastActiveTabRef.current[cmd.id] || cmd.targetTab;
                  setActiveTab(targetTab);
                }
              }}
              style={{
                minHeight: '38px',
                padding: '0.35rem 0.85rem',
                borderRadius: THEME.radii.sm,
                border: isActive
                  ? `1.5px solid ${THEME.colors.navyPrimary}`
                  : `1px solid ${THEME.colors.borderHairline}`,
                backgroundColor: isActive ? '#0649a2' : '#ffffff',
                color: isActive ? '#ffffff' : THEME.colors.inkBody,
                fontSize: '0.76rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{cmd.label}</span>
              {isActive && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#feb505',
                    display: 'inline-block',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
