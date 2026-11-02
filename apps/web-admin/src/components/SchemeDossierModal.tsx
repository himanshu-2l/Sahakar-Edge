'use client';

import React from 'react';
import type { SchemeDefinition, SchemeEvaluationResult, AuditGrade } from '@sahakar/types';
import { THEME, cardStyle, buttonPrimaryStyle, buttonSecondaryStyle, pillBadge } from './theme';
import { MinistryEmblemIcon, CloseIcon, PrinterIcon, DownloadIcon, ShieldCheckIcon } from './icons';

interface SchemeDossierModalProps {
  scheme: SchemeDefinition;
  result: SchemeEvaluationResult;
  societyName: string;
  auditGrade: AuditGrade;
  projectCostLakhs: number;
  onClose: () => void;
}

export function SchemeDossierModal({
  scheme,
  result,
  societyName,
  auditGrade,
  projectCostLakhs,
  onClose,
}: SchemeDossierModalProps) {
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
        aria-labelledby="scheme-dossier-modal-title"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: THEME.radii.md,
          width: '100%',
          maxWidth: '840px',
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
                Government of India • Ministry of Cooperation
              </div>
              <h2
                id="scheme-dossier-modal-title"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: THEME.colors.inkPrimary,
                  margin: '0.15rem 0 0 0',
                }}
              >
                Statutory Scheme Sanction Dossier: {scheme.code}
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

        {/* Dossier Content Body */}
        <div
          style={{
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Official Seal & Status Banner */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: THEME.radii.sm,
              backgroundColor: result.eligible ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result.eligible ? '#bbf7d0' : '#fca5a5'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: result.eligible ? '#166534' : '#991b1b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {result.eligible
                  ? 'Official Sanction Determination: Approved in Principle'
                  : 'Regulatory Determination: Non-Compliant / Ineligible'}
              </div>
              <div style={{ fontSize: '0.85rem', color: THEME.colors.inkPrimary, marginTop: '0.2rem' }}>
                Match Score: <strong>{result.matchScore}/100</strong> • Regulatory Audit Grade: <strong>Grade {auditGrade}</strong>
              </div>
            </div>
            <span style={pillBadge(result.eligible ? 'success' : 'error')}>
              {result.eligible ? 'ELIGIBLE FOR SANCTION' : 'REJECTED'}
            </span>
          </div>

          {/* Society Details Card */}
          <div
            style={{
              backgroundColor: THEME.colors.bgMuted,
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              padding: '1.25rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>APPLICANT ENTITY</div>
              <div style={{ fontWeight: 800, color: THEME.colors.inkPrimary, marginTop: '0.2rem' }}>{societyName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>SCHEME NAME</div>
              <div style={{ fontWeight: 800, color: THEME.colors.navyPrimary, marginTop: '0.2rem' }}>{scheme.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>NODAL MINISTRY</div>
              <div style={{ fontWeight: 600, color: THEME.colors.inkBody, marginTop: '0.2rem' }}>{scheme.nodalMinistry}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>PROPOSED PROJECT COST</div>
              <div style={{ fontWeight: 800, color: THEME.colors.inkPrimary, marginTop: '0.2rem' }}>
                ₹{projectCostLakhs} Lakhs (Cap: ₹{scheme.maxProjectCostLakhs}L)
              </div>
            </div>
          </div>

          {/* Financial Appraisal Matrix */}
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
              1. Financial Appraisal & Subvention Computation
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                backgroundColor: '#ffffff',
                border: `1px solid ${THEME.colors.borderHairline}`,
                borderRadius: THEME.radii.sm,
                padding: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>CAPITAL SUBSIDY</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: THEME.colors.inkPrimary, marginTop: '0.2rem' }}>
                  ₹{result.eligibleSubsidyLakhs} Lakhs
                </div>
                <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>
                  {scheme.subsidyPercentage}% on eligible project cost
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>INTEREST SUBVENTION</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: THEME.colors.navyPrimary, marginTop: '0.2rem' }}>
                  {result.applicableSubventionPercent}% p.a.
                </div>
                <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>
                  {(scheme.tenureYears ?? 0) > 0 ? `${scheme.tenureYears} Years (${scheme.moratoriumMonths ?? 0}m Moratorium)` : 'Direct Grant'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>ESTIMATED ANNUAL SAVINGS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>
                  ₹{result.estimatedAnnualInterestSavingsLakhs} Lakhs
                </div>
                <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>Annual subvention benefit</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: THEME.colors.inkMuted, fontWeight: 700 }}>EFFECTIVE LENDING RATE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: THEME.colors.navyPrimary, marginTop: '0.2rem' }}>
                  {result.effectiveInterestRate}% p.a.
                </div>
                <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted }}>Benchmark rate: 9.00%</div>
              </div>
            </div>
          </div>

          {/* Statutory Directives and Compliance Rationale */}
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
              2. Statutory Compliance & Evaluation Findings
            </h4>
            <div
              style={{
                backgroundColor: THEME.colors.bgMuted,
                border: `1px solid ${THEME.colors.borderHairline}`,
                borderRadius: THEME.radii.sm,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {result.reasons.map((reason, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <span style={{ color: result.eligible ? '#16a34a' : '#dc2626', fontWeight: 800 }}>
                    {result.eligible ? '✓' : '⚠'}
                  </span>
                  <span style={{ color: THEME.colors.inkBody }}>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Document Checklist */}
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
              3. Mandatory Statutory Document Verification List ({result.documentChecklist.length})
            </h4>
            <div
              style={{
                border: `1px solid ${THEME.colors.borderHairline}`,
                borderRadius: THEME.radii.sm,
                overflow: 'hidden',
              }}
            >
              {result.documentChecklist.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.65rem 1rem',
                    borderBottom: idx === result.documentChecklist.length - 1 ? 'none' : `1px solid ${THEME.colors.borderHairline}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: THEME.colors.navyPrimary }}>{idx + 1}.</span>
                    <span style={{ color: THEME.colors.inkPrimary, fontWeight: 500 }}>{doc}</span>
                  </div>
                  <span style={pillBadge('neutral')}>STATUTORY REQUIREMENT</span>
                </div>
              ))}
            </div>
          </div>

          {/* Officer Certification Box */}
          <div
            style={{
              padding: '1rem',
              border: '1px dashed #93c5fd',
              borderRadius: THEME.radii.sm,
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <ShieldCheckIcon size={24} color="#1e3a5f" />
            <div style={{ fontSize: '0.78rem', color: '#1e3a5f' }}>
              <strong>CERTIFICATION STATEMENT:</strong> This sanction dossier has been generated through the National
              Cooperative Scheme Advisory Engine in full alignment with official guidelines of the Ministry of Cooperation
              and NCDC. All statutory subventions and subsidies are subject to standard verification of audited financial statements.
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
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
          <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
            Document Reference: <span style={{ fontFamily: THEME.fonts.mono }}>MOC/SCH/{scheme.code}/{Date.now().toString().slice(-6)}</span>
          </div>
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
              <span>Print Dossier</span>
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
