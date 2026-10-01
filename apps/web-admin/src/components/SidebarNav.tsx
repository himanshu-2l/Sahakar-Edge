import React from 'react';
import { THEME, pillBadge } from './theme';
import {
  MinistryEmblemIcon,
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
} from './icons';

export type AdminTab =
  | 'OVERVIEW'
  | 'FEDERATION'
  | 'INSTITUTES'
  | 'PROGRAMMES'
  | 'BATCHES'
  | 'COURSES'
  | 'ATTENDANCE'
  | 'CREDENTIALS'
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
          label: 'Executive Overview',
          icon: <OverviewIcon size={16} />,
        },
        {
          id: 'FEDERATION',
          label: 'National Federation Map',
          icon: <FederationIcon size={16} />,
          badge: { text: '3-TIER', type: 'apex' },
        },
      ],
    },
    {
      title: 'Directorate 2: Institutional Training',
      items: [
        {
          id: 'INSTITUTES',
          label: 'Cooperative Institutes (20)',
          icon: <InstitutesIcon size={16} />,
        },
        {
          id: 'PROGRAMMES',
          label: 'Capacity Programmes',
          icon: <ProgrammesIcon size={16} />,
        },
        {
          id: 'BATCHES',
          label: 'Training Batches',
          icon: <BatchesIcon size={16} />,
        },
        {
          id: 'COURSES',
          label: 'Curricular Courses',
          icon: <CoursesIcon size={16} />,
        },
      ],
    },
    {
      title: 'Directorate 3: Trainee Verification',
      items: [
        {
          id: 'ATTENDANCE',
          label: 'Attendance & Biometrics',
          icon: <AttendanceIcon size={16} />,
        },
        {
          id: 'CREDENTIALS',
          label: 'Digital Credentials',
          icon: <CredentialsIcon size={16} />,
          badge: { text: 'ED25519', type: 'info' },
        },
      ],
    },
    {
      title: 'Directorate 4: Industry & Logistics',
      items: [
        {
          id: 'EMPLOYMENT',
          label: 'Recruiter Kanban Board',
          icon: <EmploymentIcon size={16} />,
        },
        {
          id: 'ERP_LOGISTICS',
          label: 'Hostel & Logistics ERP',
          icon: <ErpLogisticsIcon size={16} />,
        },
      ],
    },
    {
      title: 'Directorate 5: Infrastructure & Security',
      items: [
        {
          id: 'EDGE_NODES',
          label: 'Edge Hardware Fleet',
          icon: <EdgeNodesIcon size={16} />,
          badge: { text: 'ONLINE', type: 'success' },
        },
        {
          id: 'SYNC_MONITOR',
          label: 'Offline Ingestion & Sync',
          icon: <SyncMonitorIcon size={16} />,
        },
        {
          id: 'AUDIT_LOG',
          label: 'Security Audit Trail',
          icon: <AuditLogIcon size={16} />,
        },
      ],
    },
  ];

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
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: THEME.radii.sm,
            backgroundColor: THEME.colors.bgMuted,
            border: `1px solid ${THEME.colors.borderHairline}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: THEME.colors.navyPrimary,
            flexShrink: 0,
          }}
        >
          <MinistryEmblemIcon size={22} />
        </div>
        <div>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: THEME.colors.navyPrimary,
              textTransform: 'uppercase',
            }}
          >
            Ministry of Cooperation
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
            NCCT Central Portal
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
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.55rem 0.65rem',
                      borderRadius: THEME.radii.sm,
                      border: isActive ? `1px solid ${THEME.colors.borderHairline}` : '1px solid transparent',
                      backgroundColor: isActive ? THEME.colors.bgMuted : 'transparent',
                      color: isActive ? THEME.colors.navyPrimary : THEME.colors.inkBody,
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
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
                          fontSize: '0.62rem',
                          padding: '0.05rem 0.35rem',
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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.55rem 0.75rem',
            borderRadius: THEME.radii.sm,
            border: `1px solid ${THEME.colors.borderHairline}`,
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
                backgroundColor: '#ea580c',
                color: '#ffffff',
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
              borderRadius: THEME.radii.pill,
              backgroundColor: THEME.colors.navyPrimary,
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
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
