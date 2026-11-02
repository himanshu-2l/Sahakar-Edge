'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ExternalLinkIcon,
  CloseIcon,
  CheckIcon,
  AlertTriangleIcon,
  AnalyticsIcon,
} from './icons';

interface InstituteVivaStat {
  id: string;
  name: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East';
  state: string;
  traineesCount: number;
  passRate: number; // percentage
  technicalScore: number; // out of 40
  proceduralScore: number; // out of 30
  vernacularScore: number; // out of 20
  controlsScore: number; // out of 10
  status: 'ACCREDITED_A' | 'ACCREDITED_B' | 'REMEDIATION_REVIEW';
}

const NCCT_INSTITUTES_VIVA_DATA: InstituteVivaStat[] = [
  {
    id: 'vamnicom-pune',
    name: 'VAMNICOM (Apex National Institute), Pune',
    zone: 'West',
    state: 'Maharashtra',
    traineesCount: 120,
    passRate: 94.2,
    technicalScore: 35.8,
    proceduralScore: 26.5,
    vernacularScore: 18.2,
    controlsScore: 8.4,
    status: 'ACCREDITED_A',
  },
  {
    id: 'ricm-bhopal',
    name: 'Regional Institute of Cooperative Management (RICM), Bhopal',
    zone: 'Central',
    state: 'Madhya Pradesh',
    traineesCount: 150,
    passRate: 91.3,
    technicalScore: 33.7,
    proceduralScore: 24.8,
    vernacularScore: 17.9,
    controlsScore: 7.9,
    status: 'ACCREDITED_A',
  },
  {
    id: 'ricm-gandhinagar',
    name: 'Regional Institute of Cooperative Management (RICM), Gandhinagar',
    zone: 'West',
    state: 'Gujarat',
    traineesCount: 110,
    passRate: 88.5,
    technicalScore: 32.1,
    proceduralScore: 23.9,
    vernacularScore: 17.5,
    controlsScore: 7.5,
    status: 'ACCREDITED_A',
  },
  {
    id: 'ricm-chandigarh',
    name: 'Regional Institute of Cooperative Management (RICM), Chandigarh',
    zone: 'North',
    state: 'Punjab / Haryana',
    traineesCount: 95,
    passRate: 87.4,
    technicalScore: 31.8,
    proceduralScore: 23.4,
    vernacularScore: 17.2,
    controlsScore: 7.4,
    status: 'ACCREDITED_A',
  },
  {
    id: 'ricm-bengaluru',
    name: 'Regional Institute of Cooperative Management (RICM), Bengaluru',
    zone: 'South',
    state: 'Karnataka',
    traineesCount: 105,
    passRate: 86.8,
    technicalScore: 31.5,
    proceduralScore: 23.2,
    vernacularScore: 17.0,
    controlsScore: 7.3,
    status: 'ACCREDITED_A',
  },
  {
    id: 'ricm-kalyani',
    name: 'Regional Institute of Cooperative Management (RICM), Kalyani',
    zone: 'East',
    state: 'West Bengal',
    traineesCount: 88,
    passRate: 85.2,
    technicalScore: 31.0,
    proceduralScore: 22.8,
    vernacularScore: 16.8,
    controlsScore: 7.2,
    status: 'ACCREDITED_A',
  },
  {
    id: 'icm-lucknow',
    name: 'Institute of Cooperative Management (ICM), Lucknow',
    zone: 'North',
    state: 'Uttar Pradesh',
    traineesCount: 140,
    passRate: 86.4,
    technicalScore: 31.6,
    proceduralScore: 22.9,
    vernacularScore: 17.6,
    controlsScore: 7.1,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-jaipur',
    name: 'Institute of Cooperative Management (ICM), Jaipur',
    zone: 'North',
    state: 'Rajasthan',
    traineesCount: 85,
    passRate: 84.7,
    technicalScore: 30.8,
    proceduralScore: 22.4,
    vernacularScore: 17.4,
    controlsScore: 7.0,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-dehradun',
    name: 'Institute of Cooperative Management (ICM), Dehradun',
    zone: 'North',
    state: 'Uttarakhand',
    traineesCount: 65,
    passRate: 83.1,
    technicalScore: 30.2,
    proceduralScore: 22.1,
    vernacularScore: 17.1,
    controlsScore: 6.9,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-hyderabad',
    name: 'Institute of Cooperative Management (ICM), Hyderabad',
    zone: 'South',
    state: 'Telangana',
    traineesCount: 75,
    passRate: 84.0,
    technicalScore: 30.5,
    proceduralScore: 22.3,
    vernacularScore: 16.9,
    controlsScore: 7.1,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-madurai',
    name: 'Institute of Cooperative Management (ICM), Madurai',
    zone: 'South',
    state: 'Tamil Nadu',
    traineesCount: 70,
    passRate: 83.5,
    technicalScore: 30.1,
    proceduralScore: 22.2,
    vernacularScore: 16.7,
    controlsScore: 7.0,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-thiruvananthapuram',
    name: 'Institute of Cooperative Management (ICM), Thiruvananthapuram',
    zone: 'South',
    state: 'Kerala',
    traineesCount: 60,
    passRate: 85.0,
    technicalScore: 31.0,
    proceduralScore: 22.7,
    vernacularScore: 16.8,
    controlsScore: 7.2,
    status: 'ACCREDITED_A',
  },
  {
    id: 'icm-bhubaneswar',
    name: 'Institute of Cooperative Management (ICM), Bhubaneswar',
    zone: 'East',
    state: 'Odisha',
    traineesCount: 68,
    passRate: 82.4,
    technicalScore: 29.8,
    proceduralScore: 21.9,
    vernacularScore: 16.5,
    controlsScore: 6.8,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-ranchi',
    name: 'Institute of Cooperative Management (ICM), Ranchi',
    zone: 'East',
    state: 'Jharkhand',
    traineesCount: 55,
    passRate: 79.2,
    technicalScore: 28.5,
    proceduralScore: 21.0,
    vernacularScore: 16.2,
    controlsScore: 6.5,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-patna',
    name: 'Institute of Cooperative Management (ICM), Patna',
    zone: 'East',
    state: 'Bihar',
    traineesCount: 95,
    passRate: 76.8,
    technicalScore: 28.4,
    proceduralScore: 20.5,
    vernacularScore: 16.4,
    controlsScore: 6.2,
    status: 'REMEDIATION_REVIEW',
  },
  {
    id: 'icm-guwahati',
    name: 'Institute of Cooperative Management (ICM), Guwahati',
    zone: 'North-East',
    state: 'Assam',
    traineesCount: 62,
    passRate: 81.2,
    technicalScore: 29.4,
    proceduralScore: 21.5,
    vernacularScore: 16.3,
    controlsScore: 6.7,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-imphal',
    name: 'Institute of Cooperative Management (ICM), Imphal',
    zone: 'North-East',
    state: 'Manipur',
    traineesCount: 45,
    passRate: 77.8,
    technicalScore: 28.2,
    proceduralScore: 20.8,
    vernacularScore: 16.0,
    controlsScore: 6.4,
    status: 'REMEDIATION_REVIEW',
  },
  {
    id: 'icm-nagpur',
    name: 'Institute of Cooperative Management (ICM), Nagpur',
    zone: 'West',
    state: 'Maharashtra',
    traineesCount: 50,
    passRate: 83.0,
    technicalScore: 30.0,
    proceduralScore: 22.0,
    vernacularScore: 16.8,
    controlsScore: 6.9,
    status: 'ACCREDITED_B',
  },
  {
    id: 'icm-shillong',
    name: 'Institute of Cooperative Management (ICM), Shillong',
    zone: 'North-East',
    state: 'Meghalaya',
    traineesCount: 40,
    passRate: 78.5,
    technicalScore: 28.6,
    proceduralScore: 20.9,
    vernacularScore: 16.1,
    controlsScore: 6.5,
    status: 'REMEDIATION_REVIEW',
  },
  {
    id: 'icm-raipur',
    name: 'Institute of Cooperative Management (ICM), Raipur',
    zone: 'Central',
    state: 'Chhattisgarh',
    traineesCount: 40,
    passRate: 80.5,
    technicalScore: 29.0,
    proceduralScore: 21.4,
    vernacularScore: 16.4,
    controlsScore: 6.6,
    status: 'ACCREDITED_B',
  },
];

export function VivaAnalyticsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<'ALL' | string>('ALL');
  const [sortBy, setSortBy] = useState<'PASS_DESC' | 'TRAINEES_DESC' | 'TECH_DESC'>('PASS_DESC');
  const [transcriptModalOpen, setTranscriptModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    return NCCT_INSTITUTES_VIVA_DATA.filter((item) => {
      if (selectedZone !== 'ALL' && item.zone !== selectedZone) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !item.state.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'PASS_DESC') return b.passRate - a.passRate;
      if (sortBy === 'TRAINEES_DESC') return b.traineesCount - a.traineesCount;
      if (sortBy === 'TECH_DESC') return b.technicalScore - a.technicalScore;
      return 0;
    });
  }, [searchQuery, selectedZone, sortBy]);

  useEffect(() => {
    if (!transcriptModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTranscriptModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transcriptModalOpen]);

  // Dynamic Macro Metrics: Computes metrics dynamically from NCCT_INSTITUTES_VIVA_DATA
  // Reconciles either the full dataset (selectedZone === 'ALL') or the filtered zone view
  const bentoMetrics = useMemo(() => {
    const data =
      selectedZone === 'ALL'
        ? NCCT_INSTITUTES_VIVA_DATA
        : NCCT_INSTITUTES_VIVA_DATA.filter((item) => item.zone === selectedZone);

    const instituteCount = data.length;
    let totalTrainees = 0;
    let exactCertified = 0;
    let weightedScoreSum = 0;

    for (const inst of data) {
      totalTrainees += inst.traineesCount;
      exactCertified += (inst.passRate / 100) * inst.traineesCount;
      const compositeScore =
        inst.technicalScore +
        inst.proceduralScore +
        inst.vernacularScore +
        inst.controlsScore;
      weightedScoreSum += compositeScore * inst.traineesCount;
    }

    const totalCertified = Math.round(exactCertified);
    const passRate = totalTrainees > 0 ? ((exactCertified / totalTrainees) * 100).toFixed(1) : '0.0';
    const avgScore = totalTrainees > 0 ? (weightedScoreSum / totalTrainees).toFixed(1) : '0.0';
    const remedialQueue = Math.max(0, totalTrainees - totalCertified);

    return {
      instituteCount,
      totalTrainees,
      totalCertified,
      passRate,
      avgScore,
      remedialQueue,
    };
  }, [selectedZone]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Executive Metric Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Total Examinees Assessed</div>
          <div style={bentoValueStyle}>{bentoMetrics.totalTrainees.toLocaleString()} Trainees</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
            {bentoMetrics.instituteCount} NCCT Training Center{bentoMetrics.instituteCount === 1 ? '' : 's'}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>
            {selectedZone === 'ALL' ? 'National' : `${selectedZone} Zone`} Oral Pass Rate
          </div>
          <div style={{ ...bentoValueStyle, color: '#16a34a' }}>{bentoMetrics.passRate}%</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
            {bentoMetrics.totalCertified.toLocaleString()} Certified Trainees
          </div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>
            {selectedZone === 'ALL' ? 'National' : `${selectedZone} Zone`} Average Score
          </div>
          <div style={{ ...bentoValueStyle, color: THEME.colors.navyPrimary }}>{bentoMetrics.avgScore} / 100</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Benchmark Threshold: 70.0%</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Bilingual Assessment Share</div>
          <div style={bentoValueStyle}>68% Hindi</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>32% English / Regional</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Remedial Tutoring Queue</div>
          <div style={{ ...bentoValueStyle, color: '#d97706' }}>
            {bentoMetrics.remedialQueue.toLocaleString()} Trainees
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Scheduled for Re-Viva Drills</div>
        </div>
      </div>

      {/* 2. NCCT 4-Dimension Rubric Model & Concept Mapping */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
              NCCT 4-Dimension Oral Examination Rubric Performance
            </h3>
            <p style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0 0' }}>
              Statutory weightage compliance: Technical Accuracy (40%), Procedural Logic (30%), Vernacular (20%), Internal Controls (10%)
            </p>
          </div>
          <button
            onClick={() => setTranscriptModalOpen(true)}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              padding: '0.45rem 0.85rem',
            }}
          >
            <span>Inspect Trainee Oral Transcript</span>
            <ExternalLinkIcon size={12} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {/* Dimension 1: Technical Accuracy */}
          <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                1. TECHNICAL & STATUTORY
              </span>
              <span style={pillBadge('apex')}>40% WEIGHT</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: THEME.colors.inkPrimary, margin: '0.35rem 0' }}>
              31.3 / 40.0 <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>(78.2%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted, marginBottom: '0.5rem' }}>
              Target: ≥ 30.0 Pts (75%) • Top: VAMNICOM (35.8 Pts)
            </div>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '78.2%', height: '100%', backgroundColor: '#16a34a' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkBody, marginTop: '0.4rem' }}>
              Concepts: 25% Statutory Reserve, Day Book Balancing, NPA Classification
            </div>
          </div>

          {/* Dimension 2: Procedural Logic */}
          <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                2. PROCEDURAL LOGIC
              </span>
              <span style={pillBadge('info')}>30% WEIGHT</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: THEME.colors.inkPrimary, margin: '0.35rem 0' }}>
              22.4 / 30.0 <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>(74.5%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted, marginBottom: '0.5rem' }}>
              Target: ≥ 21.0 Pts (70%) • Top: VAMNICOM (26.5 Pts)
            </div>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '74.5%', height: '100%', backgroundColor: '#0284c7' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkBody, marginTop: '0.4rem' }}>
              Concepts: Loan Disbursement Credit Direction, Cash Tally Logic
            </div>
          </div>

          {/* Dimension 3: Cooperative Vernacular */}
          <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                3. COOPERATIVE VERNACULAR
              </span>
              <span style={pillBadge('success')}>20% WEIGHT</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: THEME.colors.inkPrimary, margin: '0.35rem 0' }}>
              17.7 / 20.0 <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#16a34a' }}>(88.4%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted, marginBottom: '0.5rem' }}>
              Target: ≥ 16.0 Pts (80%) • Top: RICM Bhopal (17.9 Pts)
            </div>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '88.4%', height: '100%', backgroundColor: '#15803d' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkBody, marginTop: '0.4rem' }}>
              Concepts: Rojnamcha, Rokadbahi, Tijori, Sahakar Terminology
            </div>
          </div>

          {/* Dimension 4: Internal Controls */}
          <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                4. INTERNAL CONTROLS
              </span>
              <span style={pillBadge('warning')}>10% WEIGHT</span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: THEME.colors.inkPrimary, margin: '0.35rem 0' }}>
              6.9 / 10.0 <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d97706' }}>(69.1%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted, marginBottom: '0.5rem' }}>
              Target: ≥ 7.5 Pts (75%) • Attention Required
            </div>
            <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '69.1%', height: '100%', backgroundColor: '#d97706' }} />
            </div>
            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkBody, marginTop: '0.4rem' }}>
              Concepts: Dual-Custody Physical Vault Count, Anti-Fraud Protocols
            </div>
          </div>
        </div>
      </div>

      {/* 3. Missed Concepts Gap Analysis & Pedagogical Directive */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: THEME.radii.sm,
          backgroundColor: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: THEME.colors.navyPrimary, fontWeight: 800, fontSize: '0.88rem' }}>
          <AlertTriangleIcon size={18} color="#0284c7" />
          <span>National Pedagogical Gap Analysis & Automated Remediation Directives</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: THEME.radii.xs, border: '1px solid #bfdbfe', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 800, color: '#dc2626' }}>Top Deficit #1: Physical Vault Dual-Custody (41.2% Missed)</div>
            <div style={{ color: THEME.colors.inkBody, marginTop: '0.2rem' }}>
              Students omit dual-key vault custody rules during daily cash closing.
            </div>
            <div style={{ fontSize: '0.72rem', color: THEME.colors.navyPrimary, fontWeight: 700, marginTop: '0.3rem' }}>
              ➔ Prescribed Action: Module 3 Lab 4 (Cash Vault Dual Custody)
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: THEME.radii.xs, border: '1px solid #bfdbfe', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 800, color: '#d97706' }}>Top Deficit #2: Statutory Reserve Indivisibility (28.7% Missed)</div>
            <div style={{ color: THEME.colors.inkBody, marginTop: '0.2rem' }}>
              Confusion regarding mandatory 25% allocation prior to member dividends.
            </div>
            <div style={{ fontSize: '0.72rem', color: THEME.colors.navyPrimary, fontWeight: 700, marginTop: '0.3rem' }}>
              ➔ Prescribed Action: Model Bye-Laws Workshop (Section 45 MSCS Act)
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: THEME.radii.xs, border: '1px solid #bfdbfe', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 800, color: '#0284c7' }}>Top Deficit #3: Loan Cashbook Credit Direction (24.1% Missed)</div>
            <div style={{ color: THEME.colors.inkBody, marginTop: '0.2rem' }}>
              Novices invert credit/debit on KCC disbursements.
            </div>
            <div style={{ fontSize: '0.72rem', color: THEME.colors.navyPrimary, fontWeight: 700, marginTop: '0.3rem' }}>
              ➔ Prescribed Action: Interactive T-Account Lab #1 (Opposing Ledgers)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: THEME.colors.inkMuted }}>
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              placeholder="Search institute name or state..."
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
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
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
            <option value="ALL">All National Zones (6)</option>
            <option value="North">North Zone</option>
            <option value="South">South Zone</option>
            <option value="East">East Zone</option>
            <option value="West">West Zone</option>
            <option value="Central">Central Zone</option>
            <option value="North-East">North-East Zone</option>
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
            <option value="PASS_DESC">Sort: Pass Rate High → Low</option>
            <option value="TRAINEES_DESC">Sort: Trainees Examined High → Low</option>
            <option value="TECH_DESC">Sort: Technical Score High → Low</option>
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: THEME.colors.inkMuted }}>
          Showing {filteredData.length} of {NCCT_INSTITUTES_VIVA_DATA.length} institutes
        </div>
      </div>

      {/* 5. Institutional League Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Institute Name & State</th>
              <th style={tableHeaderStyle}>Zone</th>
              <th style={tableHeaderStyle}>Trainees</th>
              <th style={tableHeaderStyle}>Pass Rate</th>
              <th style={tableHeaderStyle}>Technical (40)</th>
              <th style={tableHeaderStyle}>Procedural (30)</th>
              <th style={tableHeaderStyle}>Vernacular (20)</th>
              <th style={tableHeaderStyle}>Controls (10)</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((inst) => (
              <tr key={inst.id} style={{ transition: 'background-color 0.12s ease' }}>
                <td style={tableCellStyle}>
                  <div style={{ fontWeight: 800, color: THEME.colors.inkPrimary }}>{inst.name}</div>
                  <div style={{ fontSize: '0.74rem', color: THEME.colors.inkMuted }}>{inst.state}</div>
                </td>
                <td style={tableCellStyle}>
                  <span style={pillBadge('neutral')}>{inst.zone}</span>
                </td>
                <td style={tableCellStyle}>
                  <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 700 }}>{inst.traineesCount}</span>
                </td>
                <td style={tableCellStyle}>
                  <span
                    style={{
                      fontFamily: THEME.fonts.mono,
                      fontWeight: 800,
                      color: inst.passRate >= 85.0 ? '#16a34a' : inst.passRate >= 80.0 ? '#0284c7' : '#dc2626',
                    }}
                  >
                    {inst.passRate.toFixed(1)}%
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <span style={{ fontFamily: THEME.fonts.mono }}>{inst.technicalScore.toFixed(1)}</span>
                </td>
                <td style={tableCellStyle}>
                  <span style={{ fontFamily: THEME.fonts.mono }}>{inst.proceduralScore.toFixed(1)}</span>
                </td>
                <td style={tableCellStyle}>
                  <span style={{ fontFamily: THEME.fonts.mono }}>{inst.vernacularScore.toFixed(1)}</span>
                </td>
                <td style={tableCellStyle}>
                  <span
                    style={{
                      fontFamily: THEME.fonts.mono,
                      color: inst.controlsScore < 7.0 ? '#dc2626' : THEME.colors.inkBody,
                      fontWeight: inst.controlsScore < 7.0 ? 800 : 400,
                    }}
                  >
                    {inst.controlsScore.toFixed(1)}
                  </span>
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                  <span
                    style={pillBadge(
                      inst.status === 'ACCREDITED_A'
                        ? 'success'
                        : inst.status === 'ACCREDITED_B'
                        ? 'info'
                        : 'warning'
                    )}
                  >
                    {inst.status === 'ACCREDITED_A'
                      ? 'Grade A'
                      : inst.status === 'ACCREDITED_B'
                      ? 'Grade B'
                      : 'Review Required'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. Sample Trainee Transcript Modal */}
      {transcriptModalOpen && (
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
            aria-labelledby="oral-transcript-modal-title"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: THEME.radii.md,
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: THEME.shadows.modal,
              overflow: 'hidden',
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
                <span style={pillBadge('apex')}>VERBATIM ORAL TRANSCRIPT</span>
                <h3
                  id="oral-transcript-modal-title"
                  style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0.2rem 0 0 0', color: THEME.colors.inkPrimary }}
                >
                  Candidate Smt. Anita Patel (RICM Bhopal • Score: 95.0%)
                </h3>
              </div>
              <button
                onClick={() => setTranscriptModalOpen(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
                <div style={{ fontWeight: 800, color: THEME.colors.navyPrimary, marginBottom: '0.35rem' }}>
                  Question 1: Explain the statutory reserve requirement under Section 45 of the MSCS Act.
                </div>
                <div style={{ color: THEME.colors.inkBody, fontStyle: 'italic', lineHeight: '1.5' }}>
                  Candidate Audio Transcript (Hindi): "समिति के शुद्ध लाभ में से कम से कम 25 प्रतिशत वैधानिक आरक्षित निधि (Statutory Reserve Fund) में हस्तांतरित किया जाना अनिवार्य है। यह निधि अविभाज्य होती है और सदस्यों में लाभांश के रूप में वितरित नहीं की जा सकती।"
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={pillBadge('success')}>Phonetic Match: 96.4%</span>
                  <span style={pillBadge('info')}>Technical: 10/10</span>
                  <span style={pillBadge('neutral')}>Vernacular: 10/10</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
                <div style={{ fontWeight: 800, color: THEME.colors.navyPrimary, marginBottom: '0.35rem' }}>
                  Question 2: How do you verify daily physical cash against the daybook cash balance?
                </div>
                <div style={{ color: THEME.colors.inkBody, fontStyle: 'italic', lineHeight: '1.5' }}>
                  Candidate Audio Transcript (Hindi/English): "रोजाना दिन के अंत में तिजोरी का भौतिक नकद (Physical Cash Vault Count) गिना जाता है। प्रारंभिक शेष (Opening Cash) + कुल प्राप्तियां (Receipts) - कुल भुगतान (Disbursements) = परिकलित अंतिम रोकड़। यदि कोई अंतर हो तो रोकड़बही और रोजनामचा में मिलान किया जाता है और सचिव तथा रोकड़िया द्वारा दोहरी कस्टडी में हस्ताक्षर होते हैं।"
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={pillBadge('success')}>Phonetic Match: 94.8%</span>
                  <span style={pillBadge('info')}>Procedural: 10/10</span>
                  <span style={pillBadge('neutral')}>Controls: 10/10</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${THEME.colors.borderHairline}`, backgroundColor: THEME.colors.bgMuted, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTranscriptModalOpen(false)}
                style={{ ...buttonPrimaryStyle, minHeight: '44px' }}
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
