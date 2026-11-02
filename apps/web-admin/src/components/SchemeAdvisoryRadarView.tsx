'use client';

import React, { useState, useEffect } from 'react';
import {
  SchemeDefinition,
  SchemeEvaluationInput,
  SchemeEvaluationResult,
  CooperativeSocietyType,
  SchemeProjectCategory,
  AuditGrade,
  PacsHealthScorecard,
} from '@sahakar/types';
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
  CheckIcon,
  SearchIcon,
  FilterIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  RefreshIcon,
  SchemeRadarIcon,
} from './icons';
import { SchemeDossierModal } from './SchemeDossierModal';

interface SchemeAdvisoryRadarViewProps {
  scorecards?: PacsHealthScorecard[];
}

export function SchemeAdvisoryRadarView({ scorecards = [] }: SchemeAdvisoryRadarViewProps) {
  // 1. Schemes catalog state
  const [schemes, setSchemes] = useState<SchemeDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  // 2. Simulation parameters
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pacs-mp-bho-001');
  const [societyType, setSocietyType] = useState<CooperativeSocietyType>('PACS');
  const [auditGrade, setAuditGrade] = useState<AuditGrade>('A');
  const [projectCategory, setProjectCategory] = useState<SchemeProjectCategory>('POST_HARVEST_STORAGE');
  const [projectCostLakhs, setProjectCostLakhs] = useState<number>(150);
  const [womenPct, setWomenPct] = useState<number>(38);
  const [turnoverLakhs, setTurnoverLakhs] = useState<number>(120);
  const [netWorthLakhs, setNetWorthLakhs] = useState<number>(70.5);
  const [yearsActive, setYearsActive] = useState<number>(14);
  const [societyName, setSocietyName] = useState<string>('Bilkisganj Primary Agricultural Credit Cooperative Society');

  // 3. Evaluations and Checklist state
  const [evaluations, setEvaluations] = useState<SchemeEvaluationResult[]>([]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [activeDossier, setActiveDossier] = useState<{ scheme: SchemeDefinition; result: SchemeEvaluationResult } | null>(null);

  // Load schemes catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      const list = await apiClient.getSchemes();
      setSchemes(list);
    }
    loadCatalog();
  }, []);

  // Handle Preset Society selection
  const handleSelectPreset = (socId: string) => {
    setSelectedPresetId(socId);
    if (socId === 'custom') {
      setSocietyName('Custom Cooperative Enterprise');
      return;
    }
    const target = scorecards.find((s) => s.metrics.societyId === socId);
    if (target) {
      setSocietyName(target.metrics.societyName);
      setSocietyType('PACS');
      setAuditGrade(target.auditGrade);
      setTurnoverLakhs(target.metrics.totalRevenueLakhs);
      setNetWorthLakhs(target.metrics.shareCapitalLakhs + target.metrics.reservesAndSurplusLakhs);
      if (socId === 'pacs-mp-bho-001') {
        setProjectCostLakhs(150);
        setProjectCategory('POST_HARVEST_STORAGE');
        setWomenPct(38);
      } else if (socId === 'pacs-gj-ana-002') {
        setProjectCostLakhs(40);
        setProjectCategory('FOOD_PROCESSING');
        setWomenPct(25);
      } else if (socId === 'pacs-up-bar-003') {
        setProjectCostLakhs(80);
        setProjectCategory('AGRI_INPUT_RETAIL');
        setWomenPct(18);
      } else {
        setProjectCostLakhs(4);
        setProjectCategory('CSC_DIGITAL_SERVICES');
        setWomenPct(12);
      }
    } else {
      // Default fallbacks if scorecards prop not yet loaded
      if (socId === 'pacs-mp-bho-001') {
        setSocietyName('Bilkisganj Primary Agricultural Credit Cooperative Society');
        setAuditGrade('A');
        setProjectCostLakhs(150);
        setProjectCategory('POST_HARVEST_STORAGE');
        setWomenPct(38);
        setTurnoverLakhs(120);
        setNetWorthLakhs(70.5);
      } else if (socId === 'pacs-gj-ana-002') {
        setSocietyName('Anand Taluka Khedut Sahakari Mandali');
        setAuditGrade('B');
        setProjectCostLakhs(40);
        setProjectCategory('FOOD_PROCESSING');
        setWomenPct(25);
        setTurnoverLakhs(95);
        setNetWorthLakhs(51.5);
      } else if (socId === 'pacs-up-bar-003') {
        setSocietyName('Barabanki Kisan Sewa Sahakari Samiti');
        setAuditGrade('C');
        setProjectCostLakhs(80);
        setProjectCategory('AGRI_INPUT_RETAIL');
        setWomenPct(18);
        setTurnoverLakhs(68);
        setNetWorthLakhs(28.0);
      } else if (socId === 'pacs-mh-nan-004') {
        setSocietyName('Marathwada Gramin Vikas Sahakari Sanstha');
        setAuditGrade('D');
        setProjectCostLakhs(4);
        setProjectCategory('CSC_DIGITAL_SERVICES');
        setWomenPct(12);
        setTurnoverLakhs(35);
        setNetWorthLakhs(9.5);
      }
    }
  };

  // Re-run evaluation on any parameter change
  useEffect(() => {
    async function evaluate() {
      setLoading(true);
      const res = await apiClient.evaluateScheme({
        societyName,
        societyType,
        auditGrade,
        projectCategory,
        proposedProjectCostLakhs: projectCostLakhs,
        womenMemberPercentage: womenPct,
        annualTurnoverLakhs: turnoverLakhs,
        netWorthLakhs,
        yearsActive,
        memberCount: 850,
      });
      setEvaluations(res.evaluations);
      setLoading(false);
    }
    evaluate();
  }, [
    societyName,
    societyType,
    auditGrade,
    projectCategory,
    projectCostLakhs,
    womenPct,
    turnoverLakhs,
    netWorthLakhs,
    yearsActive,
  ]);

  const toggleDoc = (key: string) => {
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Macro-Disbursement Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Total National Scheme Pipeline</div>
          <div style={bentoValueStyle}>₹1,420.0 Cr</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.status.success.text, fontWeight: 700 }}>
            ● 4 Flagship Central Schemes
          </div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>AIF Post-Harvest Infrastructure</div>
          <div style={bentoValueStyle}>₹850.0 Cr</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>3% Annual Interest Subvention (7 Yrs)</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>PMFME Micro-Food Processing</div>
          <div style={bentoValueStyle}>₹180.0 Cr</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>35% Capital Subsidy (₹10L Cap)</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Yuva Sahakar Cooperative Fund</div>
          <div style={bentoValueStyle}>₹240.0 Cr</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>2% Base + 1% Women Incentive (NCDC)</div>
        </div>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>PACS Computerization Grant</div>
          <div style={bentoValueStyle}>₹150.0 Cr</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>100% Centrally Sponsored Grant (₹4L/PACS)</div>
        </div>
      </div>

      {/* 2. Flagship Scheme Comparative Matrix Table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
              National Cooperative Scheme Comparative Radar Matrix
            </h3>
            <p style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0 0' }}>
              Statutory comparison of subsidy ceilings, interest subvention rates, and regulatory eligibility criteria
            </p>
          </div>
          <span style={pillBadge('apex')}>GOVERNMENT OF INDIA SCHEMES</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Scheme Code & Name</th>
                <th style={tableHeaderStyle}>Nodal Ministry</th>
                <th style={tableHeaderStyle}>Max Project Cost</th>
                <th style={tableHeaderStyle}>Subsidy Cap</th>
                <th style={tableHeaderStyle}>Subvention %</th>
                <th style={tableHeaderStyle}>Min Audit Grade</th>
                <th style={tableHeaderStyle}>Tenure / Moratorium</th>
                <th style={tableHeaderStyle}>Mandatory Documents</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${THEME.colors.borderHairline}` }}>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 800, color: THEME.colors.navyPrimary }}>{s.code}</div>
                    <div style={{ fontSize: '0.78rem', color: THEME.colors.inkBody }}>{s.name}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontSize: '0.78rem', color: THEME.colors.inkBody }}>{s.nodalMinistry}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ fontWeight: 700, fontFamily: THEME.fonts.mono }}>₹{s.maxProjectCostLakhs} L</span>
                  </td>
                  <td style={tableCellStyle}>
                    {s.subsidyPercentage > 0 ? (
                      <span style={pillBadge('success')}>
                        {s.subsidyPercentage}% (₹{s.maxSubsidyLakhs}L Max)
                      </span>
                    ) : (
                      <span style={{ color: THEME.colors.inkMuted, fontSize: '0.78rem' }}>Nil Capital Subsidy</span>
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    {s.interestSubventionPercent > 0 ? (
                      <span style={pillBadge('info')}>
                        {s.interestSubventionPercent}% p.a.
                      </span>
                    ) : (
                      <span style={{ color: THEME.colors.inkMuted, fontSize: '0.78rem' }}>0% Subvention</span>
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    <span
                      style={pillBadge(
                        s.minimumAuditGrade === 'A' ? 'success' : s.minimumAuditGrade === 'B' ? 'info' : 'warning'
                      )}
                    >
                      Grade {s.minimumAuditGrade}+
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontSize: '0.78rem', fontFamily: THEME.fonts.mono }}>
                      {(s.tenureYears ?? 0) > 0 ? `${s.tenureYears} Yrs (${s.moratoriumMonths ?? 0}m Moratorium)` : 'N/A (Direct Grant)'}
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={pillBadge('neutral')}>{s.mandatoryDocuments.length} Documents</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Interactive Society Scheme Eligibility Simulator */}
      <div style={{ ...cardStyle, border: `1.5px solid ${THEME.colors.navyPrimary}` }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: `1px solid ${THEME.colors.borderHairline}`,
            paddingBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={pillBadge('apex')}>SIMULATOR ENGINE</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
                Primary Cooperative Scheme Advisory & Subsidy Calculator
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0 0' }}>
              Simulate society project eligibility, interest subvention savings, and document checklist readiness in real-time
            </p>
          </div>
          {/* Preset Society Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted }}>LOAD SOCIETY PRESET:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                minHeight: '44px',
                borderRadius: THEME.radii.sm,
                border: `1px solid ${THEME.colors.borderHairline}`,
                fontSize: '0.82rem',
                fontWeight: 600,
                color: THEME.colors.inkPrimary,
                backgroundColor: THEME.colors.bgMuted,
              }}
            >
              <option value="pacs-mp-bho-001">Bilkisganj PACS (Grade A • Sehore, MP)</option>
              <option value="pacs-gj-ana-002">Anand Taluka Mandali (Grade B • Anand, Gujarat)</option>
              <option value="pacs-up-bar-003">Barabanki Kisan Samiti (Grade C • UP)</option>
              <option value="pacs-mh-nan-004">Marathwada Gramin Sanstha (Grade D • Maharashtra)</option>
              <option value="custom">-- Custom Society Simulation --</option>
            </select>
          </div>
        </div>

        {/* Simulation Parameter Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: THEME.colors.bgMuted,
            padding: '1.25rem',
            borderRadius: THEME.radii.sm,
            border: `1px solid ${THEME.colors.borderHairline}`,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.35rem' }}>
              SOCIETY TYPE
            </label>
            <select
              value={societyType}
              onChange={(e) => setSocietyType(e.target.value as CooperativeSocietyType)}
              style={{ width: '100%', minHeight: '44px', padding: '0.45rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}`, fontSize: '0.82rem' }}
            >
              <option value="PACS">PACS (Primary Agri Credit)</option>
              <option value="MULTI_PURPOSE">Multi-Purpose Society (LAMPS/FAMP)</option>
              <option value="DAIRY">Dairy Cooperative Society</option>
              <option value="FISHERY">Fishery Cooperative</option>
              <option value="FPO">Farmer Producer Organization (FPO)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.35rem' }}>
              REGULATORY AUDIT GRADE
            </label>
            <select
              value={auditGrade}
              onChange={(e) => setAuditGrade(e.target.value as AuditGrade)}
              style={{ width: '100%', minHeight: '44px', padding: '0.45rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}`, fontSize: '0.82rem' }}
            >
              <option value="A">Grade A (Score ≥ 85 — Thriving)</option>
              <option value="B">Grade B (Score 70–84 — Stable)</option>
              <option value="C">Grade C (Score 50–69 — Vulnerable)</option>
              <option value="D">Grade D (Score &lt; 50 — Critical)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.35rem' }}>
              PROJECT CATEGORY
            </label>
            <select
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value as SchemeProjectCategory)}
              style={{ width: '100%', minHeight: '44px', padding: '0.45rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}`, fontSize: '0.82rem' }}
            >
              <option value="POST_HARVEST_STORAGE">Post-Harvest Storage & Warehousing</option>
              <option value="DAIRY_COLD_CHAIN">Dairy Cold Chain & Milk Chilling</option>
              <option value="AGRI_INPUT_RETAIL">Agri-Input & Custom Hiring Center</option>
              <option value="FOOD_PROCESSING">Micro Food Processing Unit</option>
              <option value="CSC_DIGITAL_SERVICES">CSC Digital Services & IT Modernization</option>
              <option value="SOLAR_KUSUM">Solar Kusum Feeder & Green Energy</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted }}>PROPOSED COST</label>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>₹{projectCostLakhs} Lakhs</span>
            </div>
            <input
              type="range"
              min={1}
              max={300}
              step={1}
              value={projectCostLakhs}
              onChange={(e) => setProjectCostLakhs(Number(e.target.value))}
              style={{ width: '100%', minHeight: '44px' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted }}>WOMEN MEMBER %</label>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>{womenPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={womenPct}
              onChange={(e) => setWomenPct(Number(e.target.value))}
              style={{ width: '100%', minHeight: '44px' }}
            />
            {womenPct >= 50 && (
              <span style={{ fontSize: '0.68rem', color: THEME.colors.status.success.text, fontWeight: 700 }}>
                ★ +1% Yuva Sahakar Bonus Active
              </span>
            )}
          </div>
        </div>

        {/* 4 Evaluated Scheme Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.25rem' }}>
          {evaluations.map((result) => {
            const def = schemes.find((s) => s.id === result.schemeId) || {
              id: result.schemeId,
              code: result.schemeName,
              name: result.schemeName,
              nodalMinistry: 'Ministry of Cooperation',
              subsidyPercentage: 0,
              maxSubsidyLakhs: 0,
              maxProjectCostLakhs: 200,
              interestSubventionPercent: 0,
              eligibleSocietyTypes: ['PACS'],
              minimumAuditGrade: 'B' as AuditGrade,
              mandatoryDocuments: result.documentChecklist,
              category: 'INFRASTRUCTURE' as const,
              description: '',
              tenureYears: 5,
              moratoriumMonths: 12,
            };

            return (
              <div
                key={result.schemeId}
                style={{
                  ...cardStyle,
                  border: `1.5px solid ${result.eligible ? THEME.colors.status.success.border : THEME.colors.borderHairline}`,
                  backgroundColor: result.eligible ? '#ffffff' : '#fdfdfe',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Top Scheme Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                          {def.code}
                        </span>
                        <span style={pillBadge(result.eligible ? 'success' : 'error')}>
                          {result.eligible ? '● ELIGIBLE FOR SANCTION' : '✕ NON-COMPLIANT'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginTop: '0.15rem' }}>
                        {result.schemeName}
                      </div>
                    </div>
                    {/* Radial Match Score Pill */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: THEME.colors.inkMuted }}>MATCH SCORE</div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: result.matchScore >= 70 ? THEME.colors.navyPrimary : THEME.colors.status.error.text,
                          fontFamily: THEME.fonts.mono,
                        }}
                      >
                        {result.matchScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Financial Subsidy Breakdown Tile */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.5rem',
                      backgroundColor: THEME.colors.bgMuted,
                      padding: '0.75rem',
                      borderRadius: THEME.radii.sm,
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: THEME.colors.inkMuted }}>CAPITAL SUBSIDY</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: THEME.colors.inkPrimary, fontFamily: THEME.fonts.mono }}>
                        ₹{result.eligibleSubsidyLakhs} L
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: THEME.colors.inkMuted }}>SUBVENTION</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: THEME.colors.inkPrimary, fontFamily: THEME.fonts.mono }}>
                        {result.applicableSubventionPercent}% p.a.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: THEME.colors.inkMuted }}>ANNUAL SAVINGS</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: THEME.colors.status.success.text, fontFamily: THEME.fonts.mono }}>
                        ₹{result.estimatedAnnualInterestSavingsLakhs} L
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: THEME.colors.inkMuted }}>EFFECTIVE RATE</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: THEME.colors.navyPrimary, fontFamily: THEME.fonts.mono }}>
                        {result.effectiveInterestRate}%
                      </div>
                    </div>
                  </div>

                  {/* Reasons / Disqualification Notice */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.25rem' }}>
                      REGULATORY DETERMINATION
                    </div>
                    {result.reasons.map((r, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '0.78rem',
                          color: result.eligible ? THEME.colors.inkBody : THEME.colors.status.error.text,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.4rem',
                          marginTop: '0.2rem',
                        }}
                      >
                        <span>{result.eligible ? '✓' : '⚠'}</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mandatory Document Checklist */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted }}>
                        MANDATORY STATUTORY DOCUMENTS ({result.documentChecklist.length})
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: THEME.colors.navyPrimary }}>
                        {result.documentChecklist.filter((_, i) => checkedDocs[`${def.code}-${i}`]).length} / {result.documentChecklist.length} VERIFIED
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {result.documentChecklist.map((doc, docIdx) => {
                        const key = `${def.code}-${docIdx}`;
                        const isChecked = Boolean(checkedDocs[key]);
                        return (
                          <label
                            key={key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.74rem',
                              color: isChecked ? THEME.colors.inkPrimary : THEME.colors.inkMuted,
                              cursor: 'pointer',
                              padding: '0.25rem 0.4rem',
                              borderRadius: THEME.radii.xs,
                              backgroundColor: isChecked ? THEME.colors.status.success.bg : 'transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDoc(key)}
                            />
                            <span style={{ fontWeight: isChecked ? 600 : 400 }}>
                              {doc}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: `1px solid ${THEME.colors.borderHairline}`,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.5rem',
                  }}
                >
                  <button
                    onClick={() => setActiveDossier({ scheme: def as SchemeDefinition, result })}
                    style={{
                      ...buttonSecondaryStyle,
                      minHeight: '44px',
                    }}
                  >
                    <span>View Scheme Dossier</span>
                    <ExternalLinkIcon size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Scheme Dossier Modal */}
      {activeDossier && (
        <SchemeDossierModal
          scheme={activeDossier.scheme}
          result={activeDossier.result}
          societyName={societyName}
          auditGrade={auditGrade}
          projectCostLakhs={projectCostLakhs}
          onClose={() => setActiveDossier(null)}
        />
      )}
    </div>
  );
}
