import React from 'react';
import { THEME, pillBadge } from './theme';
import { BackendStatus } from '../services/api-client';
import { AdminTab } from './SidebarNav';

interface TopHeaderProps {
  activeTab: AdminTab;
  backendStatus: BackendStatus;
  edgeNodesCount: number;
}

export function TopHeader({ activeTab, backendStatus, edgeNodesCount }: TopHeaderProps) {
  const tabTitles: Record<AdminTab, { directorate: string; title: string }> = {
    OVERVIEW: {
      directorate: 'Directorate 1: Apex Governance',
      title: 'Executive Overview & National KPIs',
    },
    FEDERATION: {
      directorate: 'Directorate 1: Apex Governance',
      title: 'National Multi-Tier Federation & Hierarchy Map',
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
    ATTENDANCE: {
      directorate: 'Directorate 3: Trainee Verification',
      title: 'Multi-Modal Attendance & Biometric Audit',
    },
    CREDENTIALS: {
      directorate: 'Directorate 3: Trainee Verification',
      title: 'Statutory Digital Credentials (Ed25519)',
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

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: '#ffffff',
        borderBottom: `1px solid ${THEME.colors.borderHairline}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* 2px National Tri-Color Accent Ribbon */}
      <div style={{ height: '2.5px', width: '100%', display: 'flex' }}>
        <div style={{ flex: 1, backgroundColor: '#ea580c' }} />
        <div style={{ flex: 1, backgroundColor: '#ffffff', borderBottom: '0.5px solid #e5e7eb' }} />
        <div style={{ flex: 1, backgroundColor: '#15803d' }} />
      </div>

      <div
        style={{
          padding: '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Breadcrumb & Section Name */}
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: THEME.colors.inkMuted,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>{current.directorate}</span>
            <span>/</span>
            <span style={{ color: THEME.colors.navyPrimary }}>{activeTab}</span>
          </div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: THEME.colors.inkPrimary,
              margin: '0.15rem 0 0 0',
              letterSpacing: '-0.015em',
            }}
          >
            {current.title}
          </h1>
        </div>

        {/* Live System Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            <span>{backendStatus.online ? 'CENTRAL API ONLINE' : 'LOCAL CACHE MODE'}</span>
          </div>

          {/* Edge Fleet Status */}
          <div
            title="ARM64 Linux Edge Nodes operational in training institutes"
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

          {/* Slogan Pill */}
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: '#eff6ff',
              color: '#1e3a5f',
              padding: '0.15rem 0.55rem',
              borderRadius: THEME.radii.pill,
              border: '1px solid #bfdbfe',
              letterSpacing: '0.02em',
            }}
          >
            सहकार से समृद्धि
          </div>
        </div>
      </div>
    </header>
  );
}
