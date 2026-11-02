'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { PacsHealthScorecard, AuditGrade } from '@sahakar/types';
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
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  CamelScorecardIcon,
} from './icons';
import { CamelDetailsModal } from './CamelDetailsModal';

interface CamelScorecardViewProps {
  initialScorecards?: PacsHealthScorecard[];
}

export function CamelScorecardView({ initialScorecards }: CamelScorecardViewProps) {
  const [scorecards, setScorecards] = useState<PacsHealthScorecard[]>(initialScorecards || []);
  const [loading, setLoading] = useState<boolean>(!initialScorecards || initialScorecards.length === 0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | AuditGrade>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'THRIVING' | 'STABLE' | 'VULNERABLE' | 'CRITICAL'>('ALL');
  const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'SCORE_ASC' | 'NPA_DESC' | 'CAR_DESC'>('SCORE_DESC');
  const [selectedScorecard, setSelectedScorecard] = useState<PacsHealthScorecard | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getSocietyHealthScorecards();
      setScorecards(res.scorecards);
    } catch (err) {
      console.error('Failed to load scorecards', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialScorecards || initialScorecards.length === 0) {
      loadData();
    }
  }, [initialScorecards]);

  // Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    if (scorecards.length === 0) {
      return {
        avgCar: 16.4,
        avgNpa: 11.8,
        avgLiquidity: 15.3,
        avgNonCredit: 25.7,
        gradeA: 1,
        gradeB: 1,
        gradeC: 1,
        gradeD: 1,
      };
    }
    const sumCar = scorecards.reduce((acc, s) => acc + s.capitalAdequacyRatio, 0);
    const sumNpa = scorecards.reduce((acc, s) => acc + s.grossNpaPercentage, 0);
    const sumLiq = scorecards.reduce((acc, s) => acc + s.liquidityRatio, 0);
    const sumNonCredit = scorecards.reduce((acc, s) => acc + s.nonCreditRevenuePercentage, 0);
    const n = scorecards.length;

    return {
      avgCar: Math.round((sumCar / n) * 10) / 10,
      avgNpa: Math.round((sumNpa / n) * 10) / 10,
      avgLiquidity: Math.round((sumLiq / n) * 10) / 10,
      avgNonCredit: Math.round((sumNonCredit / n) * 10) / 10,
      gradeA: scorecards.filter((s) => s.auditGrade === 'A').length,
      gradeB: scorecards.filter((s) => s.auditGrade === 'B').length,
      gradeC: scorecards.filter((s) => s.auditGrade === 'C').length,
      gradeD: scorecards.filter((s) => s.auditGrade === 'D').length,
    };
  }, [scorecards]);

  // Filter & Sort
  const filteredScorecards = useMemo(() => {
    return scorecards
      .filter((s) => {
        if (gradeFilter !== 'ALL' && s.auditGrade !== gradeFilter) return false;
        if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            s.metrics.societyName.toLowerCase().includes(q) ||
            s.metrics.district.toLowerCase().includes(q) ||
            s.metrics.state.toLowerCase().includes(q) ||
            s.metrics.societyId.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE_DESC') return b.compositeHealthScore - a.compositeHealthScore;
        if (sortBy === 'SCORE_ASC') return a.compositeHealthScore - b.compositeHealthScore;
        if (sortBy === 'NPA_DESC') return b.grossNpaPercentage - a.grossNpaPercentage;
        if (sortBy === 'CAR_DESC') return b.capitalAdequacyRatio - a.capitalAdequacyRatio;
        return 0;
      });
  }, [scorecards, gradeFilter, statusFilter, searchQuery, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Macro CAMEL Health Overview Bento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Audited Primary Societies</div>
          <div style={bentoValueStyle}>{scorecards.length} Registered</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>3,845 Attached Nationwide</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Average Capital Adequacy</div>
          <div style={{ ...bentoValueStyle, color: aggregateMetrics.avgCar >= 9.0 ? '#16a34a' : '#dc2626' }}>
            {aggregateMetrics.avgCar}%
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Benchmark: ≥ 9.0% (Sec 45)</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Average Gross NPA</div>
          <div style={{ ...bentoValueStyle, color: aggregateMetrics.avgNpa > 7.0 ? '#dc2626' : '#16a34a' }}>
            {aggregateMetrics.avgNpa}%
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Ceiling: ≤ 7.0% (NABARD)</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Average Liquidity Buffer</div>
          <div style={{ ...bentoValueStyle, color: aggregateMetrics.avgLiquidity >= 15.0 ? '#16a34a' : '#d97706' }}>
            {aggregateMetrics.avgLiquidity}%
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Buffer: ≥ 15.0% at DCCB</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Non-Credit Diversification</div>
          <div style={{ ...bentoValueStyle, color: aggregateMetrics.avgNonCredit >= 25.0 ? '#16a34a' : '#0284c7' }}>
            {aggregateMetrics.avgNonCredit}%
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Multi-Service Target: ≥ 25%</div>
        </div>
      </div>

      {/* 2. Audit Grade Distribution Bar */}
      <div style={{ ...cardStyle, padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
              National CAMEL Audit Grade Distribution
            </h4>
            <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
              Statutory 4-tier health tier distribution across active primary societies
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={pillBadge('success')}>Grade A: {aggregateMetrics.gradeA}</span>
            <span style={pillBadge('info')}>Grade B: {aggregateMetrics.gradeB}</span>
            <span style={pillBadge('warning')}>Grade C: {aggregateMetrics.gradeC}</span>
            <span style={pillBadge('error')}>Grade D: {aggregateMetrics.gradeD}</span>
          </div>
        </div>

        <div style={{ height: '10px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${(aggregateMetrics.gradeA / (scorecards.length || 1)) * 100}%`, backgroundColor: '#16a34a' }} title="Grade A" />
          <div style={{ width: `${(aggregateMetrics.gradeB / (scorecards.length || 1)) * 100}%`, backgroundColor: '#0284c7' }} title="Grade B" />
          <div style={{ width: `${(aggregateMetrics.gradeC / (scorecards.length || 1)) * 100}%`, backgroundColor: '#d97706' }} title="Grade C" />
          <div style={{ width: `${(aggregateMetrics.gradeD / (scorecards.length || 1)) * 100}%`, backgroundColor: '#dc2626' }} title="Grade D" />
        </div>
      </div>

      {/* 3. Supervisory Alerts & Watchlist Banner */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: THEME.radii.sm,
          backgroundColor: '#fffbeb',
          border: '1.5px solid #f59e0b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', maxWidth: '820px' }}>
          <AlertTriangleIcon size={24} color="#d97706" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
              Supervisory Watchlist Alert (MSCS Act Section 45 & Form 8 Recovery)
            </div>
            <div style={{ fontSize: '0.85rem', color: THEME.colors.inkPrimary, marginTop: '0.2rem' }}>
              <strong>Marathwada Gramin Sanstha</strong> (Grade D • 24.0% Gross NPA) and <strong>Barabanki Kisan Samiti</strong> (Grade C • 13.0% Gross NPA)
              exceed NABARD prudential thresholds. Mandatory capital mobilization directives and joint DCCB recovery camps are in effect.
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          style={{
            ...buttonSecondaryStyle,
            minHeight: '44px',
            backgroundColor: '#ffffff',
          }}
        >
          <RefreshIcon size={14} />
          <span>Refresh Watchlist</span>
        </button>
      </div>

      {/* 4. Filter Toolbar & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: THEME.colors.inkMuted }}>
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              placeholder="Search society, district, state, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                border: `1px solid ${THEME.colors.borderHairline}`,
                borderRadius: THEME.radii.sm,
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as any)}
            style={{
              padding: '0.55rem 0.75rem',
              minHeight: '44px',
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Audit Grades (A-D)</option>
            <option value="A">Grade A (≥ 85)</option>
            <option value="B">Grade B (70–84)</option>
            <option value="C">Grade C (50–69)</option>
            <option value="D">Grade D (&lt; 50)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '0.55rem 0.75rem',
              minHeight: '44px',
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="THRIVING">THRIVING</option>
            <option value="STABLE">STABLE</option>
            <option value="VULNERABLE">VULNERABLE</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '0.55rem 0.75rem',
              minHeight: '44px',
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              fontSize: '0.82rem',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <option value="SCORE_DESC">Sort: Score High → Low</option>
            <option value="SCORE_ASC">Sort: Score Low → High</option>
            <option value="NPA_DESC">Sort: NPA High → Low</option>
            <option value="CAR_DESC">Sort: CAR High → Low</option>
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: THEME.colors.inkMuted }}>
          Showing {filteredScorecards.length} of {scorecards.length} audited societies
        </div>
      </div>

      {/* 5. Society CAMEL Audit Roster Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Society Name & State</th>
              <th style={tableHeaderStyle}>Composite Score</th>
              <th style={tableHeaderStyle}>Audit Grade</th>
              <th style={tableHeaderStyle}>Health Status</th>
              <th style={tableHeaderStyle}>CAR (%)</th>
              <th style={tableHeaderStyle}>Gross NPA (%)</th>
              <th style={tableHeaderStyle}>Liquidity (%)</th>
              <th style={tableHeaderStyle}>Diagnostic Directives</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ ...tableCellStyle, textAlign: 'center', padding: '2.5rem' }}>
                  Loading society CAMEL scorecards from Central API...
                </td>
              </tr>
            ) : filteredScorecards.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...tableCellStyle, textAlign: 'center', padding: '2.5rem', color: THEME.colors.inkMuted }}>
                  No cooperative societies match the specified filter criteria.
                </td>
              </tr>
            ) : (
              filteredScorecards.map((s) => (
                <tr key={s.metrics.societyId} style={{ transition: 'background-color 0.12s ease' }}>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 800, color: THEME.colors.inkPrimary }}>{s.metrics.societyName}</div>
                    <div style={{ fontSize: '0.74rem', color: THEME.colors.inkMuted }}>
                      {s.metrics.district}, {s.metrics.state} • UID: {s.metrics.societyId}
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 800, fontSize: '1rem', color: THEME.colors.navyPrimary }}>
                      {s.compositeHealthScore} / 100
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span
                      style={{
                        ...pillBadge(
                          s.auditGrade === 'A'
                            ? 'success'
                            : s.auditGrade === 'B'
                            ? 'info'
                            : s.auditGrade === 'C'
                            ? 'warning'
                            : 'error'
                        ),
                        fontWeight: 900,
                        fontSize: '0.8rem',
                      }}
                    >
                      Grade {s.auditGrade}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={pillBadge(s.status === 'THRIVING' ? 'success' : s.status === 'STABLE' ? 'info' : s.status === 'VULNERABLE' ? 'warning' : 'error')}>
                      {s.status}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 700, color: s.capitalAdequacyRatio >= 9.0 ? '#16a34a' : '#dc2626' }}>
                      {s.capitalAdequacyRatio.toFixed(1)}%
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 700, color: s.grossNpaPercentage > 7.0 ? '#dc2626' : '#16a34a' }}>
                      {s.grossNpaPercentage.toFixed(1)}%
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 700, color: s.liquidityRatio >= 15.0 ? '#16a34a' : '#d97706' }}>
                      {s.liquidityRatio.toFixed(1)}%
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={pillBadge(s.diagnosticAlerts.some((a) => a.severity === 'CRITICAL') ? 'error' : s.diagnosticAlerts.some((a) => a.severity === 'WARNING') ? 'warning' : 'neutral')}>
                      {s.diagnosticAlerts.length} Directives
                    </span>
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedScorecard(s)}
                      style={{
                        ...buttonSecondaryStyle,
                        minHeight: '44px',
                        padding: '0.4rem 0.85rem',
                      }}
                    >
                      <span>Inspect CAMEL</span>
                      <ExternalLinkIcon size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 6. CAMEL Detail Modal */}
      {selectedScorecard && (
        <CamelDetailsModal
          scorecard={selectedScorecard}
          onClose={() => setSelectedScorecard(null)}
        />
      )}
    </div>
  );
}
