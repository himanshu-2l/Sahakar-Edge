'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { GrievanceTicket, GrievancePriority, GrievanceStatus } from '@sahakar/types';
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
  ScaleIcon,
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  CheckIcon,
  ClockIcon,
  AlertTriangleIcon,
  CloseIcon,
  ExternalLinkIcon,
} from './icons';
import { GrievanceResolutionModal } from './GrievanceResolutionModal';
import { GrievanceEscalateModal } from './GrievanceEscalateModal';

export const MSCS_STATUTORY_TIERS = [
  { tier: 1, name: 'Tier 1: Society / PACS Level', slaHours: 48, authority: 'PACS Secretary / Management Committee', color: '#0284c7' },
  { tier: 2, name: 'Tier 2: District Level (DCCB / DRCS)', slaHours: 168, authority: 'District Deputy Registrar / Bank Inspection Officer', color: '#d97706' },
  { tier: 3, name: 'Tier 3: State Conciliation (RCS)', slaHours: 360, authority: 'State Co-operative Registrar Conciliation Board', color: '#7c3aed' },
  { tier: 4, name: 'Tier 4: Central Ombudsman (CRCS)', slaHours: 720, authority: 'Central Co-operative Ombudsman & Central Registrar', color: '#dc2626' },
];

export function OmbudsmanRegistryView() {
  const [tickets, setTickets] = useState<GrievanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | GrievanceStatus>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<'ALL' | GrievancePriority>('ALL');

  // Modals & Drawers
  const [resolutionTicket, setResolutionTicket] = useState<GrievanceTicket | null>(null);
  const [escalateTicket, setEscalateTicket] = useState<GrievanceTicket | null>(null);
  const [inspectTicket, setInspectTicket] = useState<GrievanceTicket | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // 1,000ms Live Countdown Heartbeat Hook
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Escape key handler for Inspect Ticket Modal
  useEffect(() => {
    if (!inspectTicket) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectTicket(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectTicket]);

  // Fetch Tickets
  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getGrievances();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load grievances', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Filtered List
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedTier !== 'ALL' && t.currentTier !== selectedTier) return false;
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          t.ticketNumber.toLowerCase().includes(q) ||
          t.complainantName.toLowerCase().includes(q) ||
          t.societyName.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [tickets, selectedTier, selectedStatus, selectedPriority, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = tickets.length;
    const lodged = tickets.filter((t) => t.status === 'LODGED').length;
    const underInvestigation = tickets.filter((t) => t.status === 'UNDER_INVESTIGATION').length;
    const ministerialEscalated = tickets.filter((t) => t.status === 'ESCALATED_MINISTERIAL').length;
    const resolved = tickets.filter((t) => t.status === 'RESOLVED').length;
    const breached = tickets.filter((t) => {
      if (t.status === 'RESOLVED') return false;
      return new Date(t.escalationDeadline).getTime() <= currentTime.getTime();
    }).length;

    return { total, lodged, underInvestigation, ministerialEscalated, resolved, breached };
  }, [tickets, currentTime]);

  // SLA Calculation Helper
  const getSlaDetails = (ticket: GrievanceTicket) => {
    if (ticket.status === 'RESOLVED') {
      return { formatted: 'RESOLVED (ORDER ISSUED)', breached: false, percentElapsed: 100, color: '#16a34a' };
    }

    const deadline = new Date(ticket.escalationDeadline).getTime();
    const remainingMs = deadline - currentTime.getTime();
    const totalDurationMs =
      (ticket.currentTier === 1 ? 48 : ticket.currentTier === 2 ? 168 : ticket.currentTier === 3 ? 360 : 720) *
      3600000;
    const elapsedMs = totalDurationMs - remainingMs;
    const percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

    if (remainingMs <= 0) {
      return { formatted: '00h 00m 00s (SLA BREACHED)', breached: true, percentElapsed: 100, color: '#dc2626' };
    }

    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    const s = Math.floor((remainingMs % 60000) / 1000);
    const formatted = `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;

    let color = '#16a34a';
    if (h < 6 || percentElapsed > 85) color = '#dc2626';
    else if (h < 24 || percentElapsed > 60) color = '#d97706';

    return { formatted, breached: false, percentElapsed, color };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Statutory Directive & Emblem Banner */}
      <div
        style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%)',
          color: '#ffffff',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                padding: '0.15rem 0.5rem',
                borderRadius: THEME.radii.pill,
                textTransform: 'uppercase',
              }}
            >
              Statutory Redressal Division
            </span>
            <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 600 }}>
              Multi-State Co-operative Societies Act 2023 (Sec 85 & 85A)
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.2rem 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            National Co-operative Ombudsman & Grievance SLA Registry
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            Central administrative oversight of multi-tier member disputes, credit subvention irregularities,
            election quorum complaints, and Section 108 forensic inquiry demands with automated statutory escalation triggers.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <button
            onClick={loadTickets}
            style={{
              ...buttonSecondaryStyle,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              minHeight: '44px',
            }}
          >
            <RefreshIcon size={14} color="#ffffff" />
            <span>Sync Live Queue</span>
          </button>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Active Heartbeat: {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Dismissible Notice Alert */}
      {actionNotice && (
        <div
          style={{
            backgroundColor: THEME.colors.status.success.bg,
            border: `1px solid ${THEME.colors.status.success.border}`,
            color: THEME.colors.status.success.text,
            padding: '0.85rem 1.25rem',
            borderRadius: THEME.radii.sm,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <CheckIcon size={16} color={THEME.colors.status.success.text} />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            aria-label="Dismiss alert"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: THEME.colors.status.success.text,
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* 2. Executive Metric Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Total National Queue</div>
          <div style={bentoValueStyle}>{metrics.total}</div>
          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Active & closed disputes</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Tier 1 Lodged</div>
          <div style={{ ...bentoValueStyle, color: '#0284c7' }}>{metrics.lodged}</div>
          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>48-hour preliminary window</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Under Investigation</div>
          <div style={{ ...bentoValueStyle, color: '#d97706' }}>{metrics.underInvestigation}</div>
          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>District / State conciliation</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Escalated Ministerial</div>
          <div style={{ ...bentoValueStyle, color: '#dc2626' }}>{metrics.ministerialEscalated}</div>
          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>CRCS Ombudsman Tier 4</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Statutory Resolved</div>
          <div style={{ ...bentoValueStyle, color: '#16a34a' }}>{metrics.resolved}</div>
          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>Binding orders issued</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>SLA Breached / At Risk</div>
          <div style={{ ...bentoValueStyle, color: metrics.breached > 0 ? '#991b1b' : '#16a34a' }}>
            {metrics.breached}
          </div>
          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
            {metrics.breached > 0 ? 'Mandatory escalation due' : '100% on statutory schedule'}
          </div>
        </div>
      </div>

      {/* 3. Interactive MSCS 4-Tier Statutory Stepper & Filter Bar */}
      <div style={{ ...cardStyle, padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.navyPrimary, marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Statutory 4-Tier Escalation Hierarchy (Click to filter queue)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          {MSCS_STATUTORY_TIERS.map((t) => {
            const count = tickets.filter((tk) => tk.currentTier === t.tier).length;
            const isSelected = selectedTier === t.tier;
            return (
              <div
                key={t.tier}
                onClick={() => setSelectedTier(isSelected ? 'ALL' : (t.tier as any))}
                style={{
                  border: isSelected ? `2px solid ${t.color}` : `1px solid ${THEME.colors.borderHairline}`,
                  borderRadius: THEME.radii.sm,
                  padding: '0.85rem 1rem',
                  backgroundColor: isSelected ? `${t.color}0a` : THEME.colors.bgMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: t.color }}>
                    {t.name.split(':')[0]}
                  </span>
                  <span style={{ ...pillBadge('neutral'), backgroundColor: '#ffffff' }}>
                    {t.slaHours}h SLA
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.inkPrimary, margin: '0.25rem 0' }}>
                  {t.name.split(':')[1]?.trim() || t.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>{t.authority}</div>
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: THEME.colors.inkBody }}>
                    {count} Tickets in Tier
                  </span>
                  {isSelected && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: t.color }}>FILTER ACTIVE ✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: THEME.colors.inkMuted }}>
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              placeholder="Search by ticket #, complainant, society, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                border: `1px solid ${THEME.colors.borderHairline}`,
                borderRadius: THEME.radii.sm,
                fontSize: '0.85rem',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Tier Selector */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value === 'ALL' ? 'ALL' : (Number(e.target.value) as any))}
            style={{
              padding: '0.55rem 0.75rem',
              minHeight: '44px',
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              color: THEME.colors.inkBody,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Tiers (1–4)</option>
            <option value="1">Tier 1: Society (48h)</option>
            <option value="2">Tier 2: District (7d)</option>
            <option value="3">Tier 3: State (15d)</option>
            <option value="4">Tier 4: Central Ombudsman (30d)</option>
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            style={{
              padding: '0.55rem 0.75rem',
              minHeight: '44px',
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              color: THEME.colors.inkBody,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="LODGED">LODGED</option>
            <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
            <option value="RESOLUTION_PROPOSED">RESOLUTION_PROPOSED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="ESCALATED_MINISTERIAL">ESCALATED_MINISTERIAL</option>
          </select>

          {/* Priority Selector */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as any)}
            style={{
              padding: '0.55rem 0.75rem',
              minHeight: '44px',
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              color: THEME.colors.inkBody,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">URGENT</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: THEME.colors.inkMuted }}>
          Showing {filteredTickets.length} of {tickets.length} disputes
        </div>
      </div>

      {/* 5. Active Grievance Queue Table */}
      <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Ticket & Priority</th>
              <th style={tableHeaderStyle}>Complainant Profile</th>
              <th style={tableHeaderStyle}>Society / Institution</th>
              <th style={tableHeaderStyle}>Grievance Category & Title</th>
              <th style={tableHeaderStyle}>Statutory Tier</th>
              <th style={tableHeaderStyle}>Live SLA Countdown</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Administrative Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ ...tableCellStyle, textAlign: 'center', padding: '2.5rem' }}>
                  Loading grievance records from Central API...
                </td>
              </tr>
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...tableCellStyle, textAlign: 'center', padding: '2.5rem', color: THEME.colors.inkMuted }}>
                  No grievances match the specified filter criteria.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const sla = getSlaDetails(t);
                return (
                  <tr key={t.id} style={{ transition: 'background-color 0.12s ease' }}>
                    {/* Ticket & Priority */}
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 700, fontSize: '0.82rem', color: THEME.colors.navyPrimary }}>
                          {t.ticketNumber}
                        </span>
                        <span
                          style={{
                            ...pillBadge(
                              t.priority === 'URGENT'
                                ? 'error'
                                : t.priority === 'HIGH'
                                ? 'warning'
                                : t.priority === 'MEDIUM'
                                ? 'info'
                                : 'neutral'
                            ),
                            fontSize: '0.65rem',
                          }}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </td>

                    {/* Complainant Profile */}
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700, color: THEME.colors.inkPrimary }}>{t.complainantName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <span style={{ ...pillBadge('neutral'), fontSize: '0.65rem' }}>
                          {t.complainantRole}
                        </span>
                      </div>
                    </td>

                    {/* Society / Institution */}
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 600, color: THEME.colors.inkBody, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.societyName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>ID: {t.societyOrInstituteId}</div>
                    </td>

                    {/* Category & Title */}
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: 700, color: THEME.colors.inkPrimary, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
                        {t.category.replace(/_/g, ' ')}
                      </div>
                    </td>

                    {/* Statutory Tier */}
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor:
                              t.currentTier === 4 ? '#fef2f2' : t.currentTier === 3 ? '#faf5ff' : t.currentTier === 2 ? '#fffbeb' : '#f0fdf4',
                            color:
                              t.currentTier === 4 ? '#dc2626' : t.currentTier === 3 ? '#7c3aed' : t.currentTier === 2 ? '#d97706' : '#16a34a',
                            border: `1px solid ${
                              t.currentTier === 4 ? '#fca5a5' : t.currentTier === 3 ? '#d8b4fe' : t.currentTier === 2 ? '#fde68a' : '#bbf7d0'
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                          }}
                        >
                          T{t.currentTier}
                        </span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: THEME.colors.inkBody }}>
                          {t.currentTier === 1
                            ? 'Society'
                            : t.currentTier === 2
                            ? 'District'
                            : t.currentTier === 3
                            ? 'State RCS'
                            : 'Ministerial'}
                        </div>
                      </div>
                    </td>

                    {/* Live SLA Countdown */}
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ClockIcon size={13} color={sla.color} />
                          <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 700, fontSize: '0.78rem', color: sla.color }}>
                            {sla.formatted}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        {t.status !== 'RESOLVED' && (
                          <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${sla.percentElapsed}%`,
                                height: '100%',
                                backgroundColor: sla.color,
                                transition: 'width 1s linear',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={tableCellStyle}>
                      <span
                        style={pillBadge(
                          t.status === 'RESOLVED'
                            ? 'success'
                            : t.status === 'ESCALATED_MINISTERIAL'
                            ? 'error'
                            : t.status === 'UNDER_INVESTIGATION'
                            ? 'warning'
                            : 'info'
                        )}
                      >
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => setInspectTicket(t)}
                          style={{
                            ...buttonSecondaryStyle,
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            minHeight: '44px',
                          }}
                        >
                          Inspect
                        </button>

                        {t.status !== 'RESOLVED' && t.currentTier < 4 && (
                          <button
                            onClick={() => setEscalateTicket(t)}
                            title="Escalate dispute to next statutory tier"
                            style={{
                              ...buttonSecondaryStyle,
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              minHeight: '44px',
                            }}
                          >
                            Escalate
                          </button>
                        )}

                        {t.status !== 'RESOLVED' && (
                          <button
                            onClick={() => setResolutionTicket(t)}
                            style={{
                              ...buttonPrimaryStyle,
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              minHeight: '44px',
                            }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resolution Modal */}
      {resolutionTicket && (
        <GrievanceResolutionModal
          ticket={resolutionTicket}
          onClose={() => setResolutionTicket(null)}
          onResolved={(updatedTicket) => {
            setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
            setResolutionTicket(null);
            setActionNotice(`Dispute #${updatedTicket.ticketNumber} resolved with statutory order.`);
          }}
        />
      )}

      {/* Escalation Modal */}
      {escalateTicket && (
        <GrievanceEscalateModal
          ticket={escalateTicket}
          onClose={() => setEscalateTicket(null)}
          onEscalated={(updatedTicket) => {
            setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
            setEscalateTicket(null);
            setActionNotice(`Dispute #${updatedTicket.ticketNumber} escalated to Tier ${updatedTicket.currentTier}.`);
          }}
        />
      )}

      {/* Inspect Ticket Detail Modal */}
      {inspectTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspect-ticket-modal-title"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.md,
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: THEME.shadows.modal,
              overflow: 'hidden',
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: `1px solid ${THEME.colors.borderHairline}`,
                backgroundColor: THEME.colors.bgMuted,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={pillBadge('apex')}>DISPUTE DOSSIER</span>
                <h3
                  id="inspect-ticket-modal-title"
                  style={{ fontSize: '1.15rem', fontWeight: 800, color: THEME.colors.inkPrimary, margin: '0.2rem 0 0 0' }}
                >
                  {inspectTicket.ticketNumber}: {inspectTicket.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectTicket(null)}
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
                <div style={{ fontWeight: 700, color: THEME.colors.navyPrimary, marginBottom: '0.25rem' }}>Full Description:</div>
                <div style={{ color: THEME.colors.inkBody, lineHeight: '1.5' }}>{inspectTicket.description}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '0.75rem', borderRadius: THEME.radii.xs }}>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Complainant Details:</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{inspectTicket.complainantName} ({inspectTicket.complainantRole})</div>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>ID: {inspectTicket.complainantId}</div>
                </div>

                <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '0.75rem', borderRadius: THEME.radii.xs }}>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Respondent Cooperative:</div>
                  <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{inspectTicket.societyName}</div>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>ID: {inspectTicket.societyOrInstituteId}</div>
                </div>
              </div>

              {inspectTicket.resolutionSummary && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: THEME.radii.sm }}>
                  <div style={{ fontWeight: 800, color: '#166534', marginBottom: '0.25rem' }}>Official Resolution Summary:</div>
                  <pre style={{ margin: 0, fontSize: '0.78rem', color: '#166534', fontFamily: THEME.fonts.mono, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {inspectTicket.resolutionSummary}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${THEME.colors.borderHairline}`, backgroundColor: THEME.colors.bgMuted, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setInspectTicket(null)}
                style={{ ...buttonPrimaryStyle, minHeight: '44px' }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
