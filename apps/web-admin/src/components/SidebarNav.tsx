import React from 'react';
import { THEME, pillBadge } from './theme';
import {
  MinistryEmblemIcon,
  NcctEmblemIcon,
  OverviewIcon,
  FederationIcon,
  InstitutesIcon,
  ProgrammesIcon,
  BatchesIcon,
  CoursesIcon,
  AttendanceIcon,
  CredentialsIcon,
  EmploymentIcon,
  ErpLogisticsIcon,
  EdgeNodesIcon,
  SyncMonitorIcon,
  AuditLogIcon,
  PhoneSimulatorIcon,
  SchemeRadarIcon,
  CamelScorecardIcon,
  AnalyticsIcon,
  HeatmapIcon,
  ProofIcon,
  ScaleIcon,
  AtpBatchesIcon,
  TimetableAttendanceIcon,
  ContinuousGradebookIcon,
  DropoutRiskRadarIcon,
} from './icons';

export type AdminTab =
  | 'OVERVIEW'
  | 'FEDERATION'
  | 'SCHEME_RADAR'
  | 'CAMEL_SCORECARD'
  | 'INSTITUTES'
  | 'PROGRAMMES'
  | 'BATCHES'
  | 'COURSES'
  | 'VIVA_ANALYTICS'
  | 'PACS_SIMULATION_HEATMAP'
  | 'ATP_BATCHES'
  | 'GRADEBOOK'
  | 'DROPOUT_RISK_ANALYTICS'
  | 'atp-batches'
  | 'gradebook'
  | 'dropout-risk-analytics'
  | 'ATTENDANCE'
  | 'CREDENTIALS'
  | 'PROOF_INSPECTOR'
  | 'TIMETABLE_ATTENDANCE'
  | 'timetable-attendance'
  | 'GRIEVANCES'
  | 'EMPLOYMENT'
  | 'ERP_LOGISTICS'
  | 'EDGE_NODES'
  | 'SYNC_MONITOR'
  | 'AUDIT_LOG';

interface SidebarNavProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  showMobileSimulator: boolean;
  setShowMobileSimulator: (show: boolean) => void;
  simQueuedEventsCount: number;
}

export function SidebarNav({
  activeTab,
  setActiveTab,
  showMobileSimulator,
  setShowMobileSimulator,
  simQueuedEventsCount,
}: SidebarNavProps) {
  const directorates: Array<{
    title: string;
    items: Array<{
      id: AdminTab;
      label: string;
      icon: React.ReactNode;
      badge?: { text: string; type: 'apex' | 'info' | 'success' | 'warning' };
    }>;
  }> = [
    {
      title: 'Directorate 1: Apex Governance',
      items: [
        {
          id: 'OVERVIEW',
          label: 'कार्यकारी अवलोकन / Executive Overview',
          icon: <OverviewIcon size={16} />,
        },
        {
          id: 'FEDERATION',
          label: 'राष्ट्रीय परिसंघ / Federation Map',
          icon: <FederationIcon size={16} />,
          badge: { text: '3-TIER', type: 'apex' },
        },
        {
          id: 'SCHEME_RADAR',
          label: 'योजना परामर्श रडार / Scheme Advisory',
          icon: <SchemeRadarIcon size={16} />,
          badge: { text: 'AIF/PMFME', type: 'info' },
        },
        {
          id: 'CAMEL_SCORECARD',
          label: 'सोसायटी कैमेल / CAMEL Scorecard',
          icon: <CamelScorecardIcon size={16} />,
          badge: { text: '5-DIM', type: 'apex' },
        },
      ],
    },
    {
      title: 'Directorate 2: Institutional Training',
      items: [
        {
          id: 'ATP_BATCHES',
          label: 'वार्षिक प्रशिक्षण योजना / ATP & Nominations',
          icon: <AtpBatchesIcon size={16} />,
          badge: { text: 'ATP 2026', type: 'apex' },
        },
        {
          id: 'INSTITUTES',
          label: 'सहकारी संस्थान / Institutes (20)',
          icon: <InstitutesIcon size={16} />,
        },
        {
          id: 'PROGRAMMES',
          label: 'क्षमता कार्यक्रम / Capacity Programmes',
          icon: <ProgrammesIcon size={16} />,
        },
        {
          id: 'BATCHES',
          label: 'प्रशिक्षण बैच / Training Batches',
          icon: <BatchesIcon size={16} />,
        },
        {
          id: 'COURSES',
          label: 'पाठ्यक्रम / Curricular Courses',
          icon: <CoursesIcon size={16} />,
        },
        {
          id: 'GRADEBOOK',
          label: 'सतत मूल्यांकन / Continuous Gradebook',
          icon: <ContinuousGradebookIcon size={16} />,
          badge: { text: 'XLSX EXPORT', type: 'apex' },
        },
        {
          id: 'DROPOUT_RISK_ANALYTICS',
          label: 'जोखिम एवं कौशल / Retention & Skill Radar',
          icon: <DropoutRiskRadarIcon size={16} />,
          badge: { text: '4-FACTOR', type: 'warning' },
        },
        {
          id: 'VIVA_ANALYTICS',
          label: 'मौखिकी विश्लेषण / Viva Rubric',
          icon: <AnalyticsIcon size={16} />,
          badge: { text: 'NCCT 4D', type: 'success' },
        },
        {
          id: 'PACS_SIMULATION_HEATMAP',
          label: 'पैक्स हीटमैप / PACS Ledger Heatmap',
          icon: <HeatmapIcon size={16} />,
          badge: { text: '5x5 DIAG', type: 'warning' },
        },
      ],
    },
    {
      title: 'Directorate 3: Trainee Verification',
      items: [
        {
          id: 'TIMETABLE_ATTENDANCE',
          label: 'समय-सारणी एवं उपस्थिति / Timetable & Attendance',
          icon: <TimetableAttendanceIcon size={16} />,
          badge: { text: '6-DIGIT CODE', type: 'success' },
        },
        {
          id: 'ATTENDANCE',
          label: 'उपस्थिति / Multi-Modal Attendance',
          icon: <AttendanceIcon size={16} />,
        },
        {
          id: 'CREDENTIALS',
          label: 'डिजिटल प्रमाण-पत्र / Digital Credentials',
          icon: <CredentialsIcon size={16} />,
          badge: { text: 'ED25519', type: 'info' },
        },
        {
          id: 'PROOF_INSPECTOR',
          label: 'प्रमाण सैंडबॉक्स / Proof Sandbox',
          icon: <ProofIcon size={16} />,
          badge: { text: 'ED25519', type: 'apex' },
        },
      ],
    },
    {
      title: 'Directorate 4: Industry & Logistics',
      items: [
        {
          id: 'GRIEVANCES',
          label: 'लोकपाल निवारण / Ombudsman SLA',
          icon: <ScaleIcon size={16} />,
          badge: { text: '4-TIER SLA', type: 'warning' },
        },
        {
          id: 'EMPLOYMENT',
          label: 'भर्ती बोर्ड / Recruiter Kanban',
          icon: <EmploymentIcon size={16} />,
        },
        {
          id: 'ERP_LOGISTICS',
          label: 'छात्रावास ईआरपी / Hostel & Logistics',
          icon: <ErpLogisticsIcon size={16} />,
        },
      ],
    },
    {
      title: 'Directorate 5: Infrastructure & Security',
      items: [
        {
          id: 'EDGE_NODES',
          label: 'एज हार्डवेयर / Edge Hardware Fleet',
          icon: <EdgeNodesIcon size={16} />,
          badge: { text: 'ONLINE', type: 'success' },
        },
        {
          id: 'SYNC_MONITOR',
          label: 'ऑफ़लाइन सिंक / Ingestion & Sync',
          icon: <SyncMonitorIcon size={16} />,
        },
        {
          id: 'AUDIT_LOG',
          label: 'सुरक्षा ऑडिट / Security Audit Trail',
          icon: <AuditLogIcon size={16} />,
        },
      ],
    },
  ];

  const isTabActive = (itemId: AdminTab) => {
    if (activeTab === itemId) return true;
    if (itemId === 'ATP_BATCHES' && activeTab === 'atp-batches') return true;
    if (itemId === 'TIMETABLE_ATTENDANCE' && activeTab === 'timetable-attendance') return true;
    if (itemId === 'GRADEBOOK' && activeTab === 'gradebook') return true;
    if (itemId === 'DROPOUT_RISK_ANALYTICS' && activeTab === 'dropout-risk-analytics') return true;
    return false;
  };

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '250px',
        backgroundColor: '#ffffff',
        borderRight: `1px solid ${THEME.colors.borderHairline}`,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Ministry Top Seal */}
      <div
        style={{
          padding: '1.25rem 1.15rem 1rem 1.15rem',
          borderBottom: `1px solid ${THEME.colors.borderHairline}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: THEME.radii.sharp,
            backgroundColor: '#ffffff',
            border: `1px solid ${THEME.colors.borderOuter}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: THEME.shadows.card,
            flexShrink: 0,
          }}
        >
          <NcctEmblemIcon size={34} />
        </div>
        <div>
          <div
            style={{
              fontSize: '0.64rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: THEME.colors.navySovereign,
              textTransform: 'uppercase',
            }}
          >
            सहकारिता मंत्रालय | GOI
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: THEME.colors.navyDeep }}>
            राष्ट्रीय सहकारी प्रशिक्षण परिषद
          </div>
          <div style={{ fontSize: '0.64rem', fontWeight: 600, color: THEME.colors.inkMuted }}>
            NCCT Central Governance
          </div>
        </div>
      </div>

      {/* Nav List with Directorates */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.85rem 0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {directorates.map((dir, dIdx) => (
          <div key={dIdx}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: THEME.colors.inkMuted,
                padding: '0 0.5rem 0.35rem 0.5rem',
              }}
            >
              {dir.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              {dir.items.map((item) => {
                const isActive = isTabActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      minHeight: '40px',
                      padding: '0.5rem 0.65rem',
                      boxSizing: 'border-box',
                      borderRadius: THEME.radii.sharp,
                      border: isActive ? `1px solid ${THEME.colors.navyPrimary}` : '1px solid transparent',
                      backgroundColor: isActive ? THEME.colors.navyLight : 'transparent',
                      color: isActive ? THEME.colors.navyPrimary : THEME.colors.inkBody,
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 800 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                      <span
                        style={{
                          color: isActive ? THEME.colors.navyPrimary : THEME.colors.inkMuted,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span
                        style={{
                          ...pillBadge(item.badge.type),
                          fontSize: '0.60rem',
                          padding: '0.05rem 0.3rem',
                        }}
                      >
                        {item.badge.text}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Simulator Trigger & User Profile Footer */}
      <div
        style={{
          borderTop: `1px solid ${THEME.colors.borderHairline}`,
          padding: '0.85rem 0.75rem',
          backgroundColor: THEME.colors.bgMuted,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        <button
          onClick={() => setShowMobileSimulator(!showMobileSimulator)}
          aria-pressed={showMobileSimulator}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            minHeight: '40px',
            padding: '0.5rem 0.75rem',
            boxSizing: 'border-box',
            borderRadius: THEME.radii.sharp,
            border: `1px solid ${THEME.colors.borderOuter}`,
            backgroundColor: showMobileSimulator ? THEME.colors.navyPrimary : '#ffffff',
            color: showMobileSimulator ? '#ffffff' : THEME.colors.inkPrimary,
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PhoneSimulatorIcon size={16} />
            <span>{showMobileSimulator ? 'Hide Simulator' : 'Trainee Simulator'}</span>
          </div>
          {simQueuedEventsCount > 0 && (
            <span
              style={{
                backgroundColor: '#ff9933',
                color: '#081854',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: THEME.radii.pill,
              }}
            >
              {simQueuedEventsCount}
            </span>
          )}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.25rem 0 0.25rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: THEME.radii.sharp,
              backgroundColor: THEME.colors.navyDeep,
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid #feb505',
            }}
          >
            RV
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: THEME.colors.inkPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Shri Rajesh Verma
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                color: THEME.colors.inkMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Central Director • SUPER_ADMIN
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
