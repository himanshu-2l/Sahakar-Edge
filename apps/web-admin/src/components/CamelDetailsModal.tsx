'use client';

import React, { useState } from 'react';
import type { PacsHealthScorecard, AuditGrade } from '@sahakar/types';
import { THEME, cardStyle, buttonPrimaryStyle, buttonSecondaryStyle, pillBadge } from './theme';
import {
  MinistryEmblemIcon,
  CloseIcon,
  PrinterIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckIcon,
} from './icons';

interface CamelDetailsModalProps {
  scorecard: PacsHealthScorecard;
  onClose: () => void;
}

export function CamelDetailsModal({ scorecard, onClose }: CamelDetailsModalProps) {
  // Remediation Sandbox state
  const [injectCapitalLakhs, setInjectCapitalLakhs] = useState<number>(0);
  const [recoverNpaLakhs, setRecoverNpaLakhs] = useState<number>(0);
  const [extraGovChecklist, setExtraGovChecklist] = useState<number>(0);
  const [directiveIssued, setDirectiveIssued] = useState<boolean>(false);

  // Recalculate CAMEL with simulated interventions
  const base = scorecard.metrics;
  const simShareCapital = base.shareCapitalLakhs + injectCapitalLakhs;
  const simGrossNpa = Math.max(0, base.grossNpaLakhs - recoverNpaLakhs);
  const simGovChecklist = Math.min(10, base.governanceChecklistPassed + extraGovChecklist);

  // 1. Recalculated CAR
  const simOwnFunds = simShareCapital + base.reservesAndSurplusLakhs;
  const simCar = base.totalAdvancesLakhs > 0 ? (simOwnFunds / base.totalAdvancesLakhs) * 100 : 100;
  let simCScore = 0;
  if (simCar >= 15.0) simCScore = 20.0;
  else if (simCar >= 12.0) simCScore = 16.0 + ((simCar - 12.0) / 3.0) * 4.0;
  else if (simCar >= 9.0) simCScore = 12.0 + ((simCar - 9.0) / 3.0) * 4.0;
  else if (simCar >= 6.0) simCScore = 6.0 + ((simCar - 6.0) / 3.0) * 6.0;
  else simCScore = Math.max(0, (simCar / 6.0) * 6.0);
  simCScore = Math.round(simCScore * 10) / 10;

  // 2. Recalculated NPA %
  const simNpaPct = base.totalAdvancesLakhs > 0 ? (simGrossNpa / base.totalAdvancesLakhs) * 100 : 0;
  let simAScore = 0;
  if (simNpaPct <= 2.0) simAScore = 25.0;
  else if (simNpaPct <= 5.0) simAScore = 25.0 - ((simNpaPct - 2.0) / 3.0) * 5.0;
  else if (simNpaPct <= 10.0) simAScore = 20.0 - ((simNpaPct - 5.0) / 5.0) * 8.0;
  else if (simNpaPct <= 20.0) simAScore = 12.0 - ((simNpaPct - 10.0) / 10.0) * 8.0;
  else simAScore = Math.max(0, 4.0 - ((simNpaPct - 20.0) / 10.0) * 4.0);
  simAScore = Math.round(simAScore * 10) / 10;

  // 3. Recalculated Management Score
  const simMScore = Math.min(20.0, Math.round(simGovChecklist * 2.0 * 10) / 10);

  // 4 & 5. Earnings & Liquidity hold from base
  const simEScore = scorecard.camelScores.earningsScore;
  const simLScore = scorecard.camelScores.liquidityScore;

  const simCompositeScore =
    Math.round((simCScore + simAScore + simMScore + simEScore + simLScore) * 10) / 10;
  let simGrade: AuditGrade = 'D';
  let simStatus: 'THRIVING' | 'STABLE' | 'VULNERABLE' | 'CRITICAL' = 'CRITICAL';
  if (simCompositeScore >= 85.0) {
    simGrade = 'A';
    simStatus = 'THRIVING';
  } else if (simCompositeScore >= 70.0) {
    simGrade = 'B';
    simStatus = 'STABLE';
  } else if (simCompositeScore >= 50.0) {
    simGrade = 'C';
    simStatus = 'VULNERABLE';
  } else {
    simGrade = 'D';
    simStatus = 'CRITICAL';
  }

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
        aria-labelledby="camel-details-modal-title"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: THEME.radii.md,
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: THEME.shadows.modal,
          overflow: 'hidden',
          border: `1px solid ${THEME.colors.borderHairline}`,
        }}
      >
        {/* National Tri-Color Accent Bar */}
        <div style={{ height: '3px', width: '100%', display: 'flex' }}>
          <div style={{ flex: 1, backgroundColor: '#ea580c' }} />
          <div style={{ flex: 1, backgroundColor: '#ffffff', borderBottom: '0.5px solid #e5e7eb' }} />
          <div style={{ flex: 1, backgroundColor: '#15803d' }} />
        </div>

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: `1px solid ${THEME.colors.borderHairline}`,
            backgroundColor: THEME.colors.bgMuted,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MinistryEmblemIcon size={28} color={THEME.colors.navyPrimary} />
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: THEME.colors.navyPrimary,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Statutory Regulatory Inspection • NABARD / RBI Co-operative Guidelines
              </div>
              <h2
                id="camel-details-modal-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: THEME.colors.inkPrimary,
                  margin: '0.15rem 0 0 0',
                }}
              >
                Cooperative CAMEL Prudential Rating & Inspection Dossier
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: THEME.colors.inkMuted,
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {directiveIssued && (
            <div
              style={{
                padding: '0.85rem 1.25rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                borderRadius: THEME.radii.sm,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <CheckIcon size={18} color="#166534" />
              <span>
                Supervisory Statutory Directive formally dispatched under MSCS Act Section 45 & Section 108.
              </span>
            </div>
          )}

          {/* Society Header & Official Audit Grade Stamp */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem',
              borderRadius: THEME.radii.sm,
              backgroundColor: '#f8fafc',
              border: `1px solid ${THEME.colors.borderHairline}`,
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                SOCIETY ID: {scorecard.metrics.societyId} • {scorecard.metrics.district}, {scorecard.metrics.state}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.inkPrimary, margin: '0.2rem 0' }}>
                {scorecard.metrics.societyName}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                <span style={pillBadge(scorecard.status === 'THRIVING' ? 'success' : scorecard.status === 'STABLE' ? 'info' : scorecard.status === 'VULNERABLE' ? 'warning' : 'error')}>
                  {scorecard.status}
                </span>
                <span style={pillBadge('neutral')}>
                  Evaluated: {new Date(scorecard.evaluatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Official Grade Stamp Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: '#ffffff',
                border: `2px solid ${THEME.colors.navyPrimary}`,
                borderRadius: THEME.radii.sm,
                padding: '0.75rem 1.25rem',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: THEME.colors.inkMuted, textTransform: 'uppercase' }}>
                  Audit Grade
                </div>
                <div
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 900,
                    lineHeight: '1',
                    color:
                      scorecard.auditGrade === 'A'
                        ? '#16a34a'
                        : scorecard.auditGrade === 'B'
                        ? '#0284c7'
                        : scorecard.auditGrade === 'C'
                        ? '#d97706'
                        : '#dc2626',
                    fontFamily: THEME.fonts.mono,
                  }}
                >
                  {scorecard.auditGrade}
                </div>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: THEME.colors.borderHairline }} />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: THEME.colors.inkMuted, textTransform: 'uppercase' }}>
                  Composite Score
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                  {scorecard.compositeHealthScore} / 100
                </div>
              </div>
            </div>
          </div>

          {/* 5-Dimension CAMEL Breakdown Grid */}
          <div>
            <h4
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: THEME.colors.navyPrimary,
                margin: '0 0 0.75rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              1. 5-Dimension CAMEL Scorecard Breakdown
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
              {/* Capital Adequacy */}
              <div style={{ ...cardStyle, padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                  [C] CAPITAL ADEQUACY
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono, margin: '0.2rem 0' }}>
                  {scorecard.camelScores.capitalScore} / 20.0
                </div>
                <div style={{ fontSize: '0.72rem', color: THEME.colors.inkBody }}>
                  CAR: <strong>{scorecard.capitalAdequacyRatio.toFixed(1)}%</strong>
                </div>
                <div style={{ fontSize: '0.65rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
                  Min 9.0% Required (Sec 45)
                </div>
              </div>

              {/* Asset Quality */}
              <div style={{ ...cardStyle, padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                  [A] ASSET QUALITY
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono, margin: '0.2rem 0' }}>
                  {scorecard.camelScores.assetQualityScore} / 25.0
                </div>
                <div style={{ fontSize: '0.72rem', color: scorecard.grossNpaPercentage > 7.0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                  Gross NPA: {scorecard.grossNpaPercentage.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.65rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
                  Ceiling: 7.0% (NABARD)
                </div>
              </div>

              {/* Management */}
              <div style={{ ...cardStyle, padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                  [M] MANAGEMENT & GOV
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono, margin: '0.2rem 0' }}>
                  {scorecard.camelScores.managementScore} / 20.0
                </div>
                <div style={{ fontSize: '0.72rem', color: THEME.colors.inkBody }}>
                  Checklist: <strong>{scorecard.metrics.governanceChecklistPassed}/10 Passed</strong>
                </div>
                <div style={{ fontSize: '0.65rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
                  AGM, Audit & Dual Custody
                </div>
              </div>

              {/* Earnings */}
              <div style={{ ...cardStyle, padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                  [E] EARNINGS & PROFIT
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono, margin: '0.2rem 0' }}>
                  {scorecard.camelScores.earningsScore} / 20.0
                </div>
                <div style={{ fontSize: '0.72rem', color: scorecard.metrics.netProfitLakhs > 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  Net Profit: ₹{scorecard.metrics.netProfitLakhs} L
                </div>
                <div style={{ fontSize: '0.65rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
                  Non-Credit: {scorecard.nonCreditRevenuePercentage.toFixed(1)}%
                </div>
              </div>

              {/* Liquidity */}
              <div style={{ ...cardStyle, padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                  [L] LIQUIDITY BUFFER
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono, margin: '0.2rem 0' }}>
                  {scorecard.camelScores.liquidityScore} / 15.0
                </div>
                <div style={{ fontSize: '0.72rem', color: THEME.colors.inkBody }}>
                  Liquidity: <strong>{scorecard.liquidityRatio.toFixed(1)}%</strong>
                </div>
                <div style={{ fontSize: '0.65rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
                  Min 15.0% Buffer at DCCB
                </div>
              </div>
            </div>
          </div>

          {/* Society Balance Sheet Snapshot */}
          <div>
            <h4
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: THEME.colors.navyPrimary,
                margin: '0 0 0.75rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              2. Key Ledger & Financial Position Snapshot
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                backgroundColor: THEME.colors.bgMuted,
                border: `1px solid ${THEME.colors.borderHairline}`,
                borderRadius: THEME.radii.sm,
                padding: '1rem',
                fontSize: '0.82rem',
              }}
            >
              <div><span style={{ color: THEME.colors.inkMuted }}>Share Capital:</span> <strong>₹{scorecard.metrics.shareCapitalLakhs} L</strong></div>
              <div><span style={{ color: THEME.colors.inkMuted }}>Reserves & Surplus:</span> <strong>₹{scorecard.metrics.reservesAndSurplusLakhs} L</strong></div>
              <div><span style={{ color: THEME.colors.inkMuted }}>Total Deposits:</span> <strong>₹{scorecard.metrics.totalDepositsLakhs} L</strong></div>
              <div><span style={{ color: THEME.colors.inkMuted }}>Total Advances:</span> <strong>₹{scorecard.metrics.totalAdvancesLakhs} L</strong></div>
              <div><span style={{ color: THEME.colors.inkMuted }}>Gross NPAs:</span> <strong style={{ color: '#dc2626' }}>₹{scorecard.metrics.grossNpaLakhs} L</strong></div>
              <div><span style={{ color: THEME.colors.inkMuted }}>Liquid Assets:</span> <strong>₹{scorecard.metrics.liquidAssetsLakhs} L</strong></div>
              <div><span style={{ color: THEME.colors.inkMuted }}>Annual Revenue:</span> <strong>₹{scorecard.metrics.totalRevenueLakhs} L</strong></div>
              <div><span style={{ color: THEME.colors.inkMuted }}>Non-Credit Revenue:</span> <strong>₹{scorecard.metrics.nonCreditRevenueLakhs} L</strong></div>
            </div>
          </div>

          {/* Diagnostic Alerts with Statutory Directives */}
          <div>
            <h4
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: THEME.colors.navyPrimary,
                margin: '0 0 0.75rem 0',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              3. Regulatory Diagnostic Alerts & Statutory Directives ({scorecard.diagnosticAlerts.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {scorecard.diagnosticAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: THEME.radii.sm,
                    backgroundColor:
                      alert.severity === 'CRITICAL'
                        ? '#fef2f2'
                        : alert.severity === 'WARNING'
                        ? '#fffbeb'
                        : '#f0fdf4',
                    border: `1px solid ${
                      alert.severity === 'CRITICAL'
                        ? '#fca5a5'
                        : alert.severity === 'WARNING'
                        ? '#fde68a'
                        : '#bbf7d0'
                    }`,
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: alert.severity === 'CRITICAL' ? '#991b1b' : alert.severity === 'WARNING' ? '#92400e' : '#166534' }}>
                    <AlertTriangleIcon size={14} />
                    <span>{alert.title}</span>
                  </div>
                  <div style={{ color: THEME.colors.inkBody, margin: '0.25rem 0' }}>{alert.description}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.navyPrimary, marginTop: '0.35rem' }}>
                    STATUTORY DIRECTIVE: {alert.statutoryDirective}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Remediation & Capital Injection Sandbox */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: THEME.radii.sm,
              backgroundColor: '#eff6ff',
              border: '1.5px solid #3b82f6',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={pillBadge('apex')}>INTERACTIVE SIMULATOR</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: THEME.colors.navyPrimary, margin: '0.2rem 0' }}>
                  Supervisory Remediation & Capital Injection Sandbox
                </h4>
                <p style={{ fontSize: '0.78rem', color: THEME.colors.inkMuted, margin: 0 }}>
                  Simulate capital augmentation, NPA recovery camps, and governance compliance to witness live score upgrades
                </p>
              </div>

              {/* Simulated Outcome Stamp */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: `2px solid ${simGrade === 'A' ? '#16a34a' : simGrade === 'B' ? '#0284c7' : '#d97706'}`,
                  borderRadius: THEME.radii.sm,
                  padding: '0.5rem 1rem',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: THEME.colors.inkMuted }}>SIMULATED GRADE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                  Grade {simGrade} ({simCompositeScore}/100)
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a' }}>
                  {simCompositeScore > scorecard.compositeHealthScore ? `+${(simCompositeScore - scorecard.compositeHealthScore).toFixed(1)} Points Upgrade` : 'Baseline'}
                </div>
              </div>
            </div>

            {/* Sandbox Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                    INJECT SHARE CAPITAL
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                    +₹{injectCapitalLakhs} Lakhs
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={injectCapitalLakhs}
                  onChange={(e) => setInjectCapitalLakhs(Number(e.target.value))}
                  style={{ width: '100%', minHeight: '44px' }}
                />
                <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>
                  Simulated CAR: <strong>{simCar.toFixed(1)}%</strong> (Score: {simCScore}/20)
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                    RECOVER GROSS NPAS
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                    -₹{recoverNpaLakhs} Lakhs
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.min(30, Math.ceil(base.grossNpaLakhs))}
                  step={0.5}
                  value={recoverNpaLakhs}
                  onChange={(e) => setRecoverNpaLakhs(Number(e.target.value))}
                  style={{ width: '100%', minHeight: '44px' }}
                />
                <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>
                  Simulated NPA: <strong>{simNpaPct.toFixed(1)}%</strong> (Score: {simAScore}/25)
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                    COMPLETE GOV CHECKLIST
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                    +{extraGovChecklist} Items
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, 10 - base.governanceChecklistPassed)}
                  step={1}
                  value={extraGovChecklist}
                  onChange={(e) => setExtraGovChecklist(Number(e.target.value))}
                  style={{ width: '100%', minHeight: '44px' }}
                />
                <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>
                  Simulated Governance: <strong>{simGovChecklist}/10</strong> (Score: {simMScore}/20)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: `1px solid ${THEME.colors.borderHairline}`,
            backgroundColor: THEME.colors.bgMuted,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => setDirectiveIssued(true)}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              minWidth: '44px',
              color: '#dc2626',
              borderColor: '#fca5a5',
            }}
          >
            Issue Supervisory Directive
          </button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              style={{
                ...buttonSecondaryStyle,
                minHeight: '44px',
                minWidth: '44px',
              }}
            >
              <PrinterIcon size={16} />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              style={{
                ...buttonPrimaryStyle,
                minHeight: '44px',
                minWidth: '44px',
              }}
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
