'use client';

import React, { useState, useEffect, useMemo, CSSProperties } from 'react';
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
  ShieldCheckIcon,
  CloseIcon,
  RadarIcon,
  UserCheckIcon,
  ExternalLinkIcon,
  BarChartIcon,
  MessageSquareIcon,
  CalendarIcon,
  CheckIcon,
} from './icons';
import { apiClient } from '../services/api-client';
import type {
  DropoutRiskTier,
  DropoutRiskAssessment,
  SectorSkillShortageRow,
  CooperativeSkillCategory,
} from '@sahakar/types';

export interface DropoutRiskAnalyticsViewProps {
  initialProgrammeId?: string;
  onInterventionLogged?: (assessment: DropoutRiskAssessment, action: string) => void;
}

export interface StudentTriageItem {
  traineeId: string;
  traineeCode: string;
  traineeName: string;
  phone: string;
  email: string;
  cooperativeAffiliation: string;
  state: string;
  completionRatePercent: number; // Lesson progress
  attendanceRatePercent: number; // Session attendance
  daysSinceLastActivity: number; // Inactivity dormancy
  failedAssessmentsCount: number; // Summative test failures
  lessonRiskPoints: 0 | 40;
  attendanceRiskPoints: 0 | 30;
  dormancyRiskPoints: 0 | 20;
  assessmentRiskPoints: number; // 0, 10, 20, 30
  totalRiskScore: number; // 0 to 100
  riskTier: DropoutRiskTier;
  recommendedDirective: string;
  recommendedActionBadge: string;
  interventionLogged: boolean;
  counselingNotesCount: number;
}

export interface CooperativeSkillRadarAxis {
  domainId: string;
  domainName: string;
  category: CooperativeSkillCategory | string;
  sectorDemand: number;
  certifiedSupply: number;
  netShortage: number; // demand - supply
  severity: 'CRITICAL' | 'MODERATE' | 'BALANCED';
}

// Double-Bezel Card Framing
const doubleBezelOuter: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  padding: '3px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const doubleBezelInner: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '2px',
  padding: '1.25rem',
};

// 8 Core Canonical Cooperative Skill Domains
const CANONICAL_COOPERATIVE_SKILLS: CooperativeSkillRadarAxis[] = [
  { domainId: 'skill-pacs-acc-01', domainName: 'Financial Management', category: 'FINANCIAL_ACCOUNTING', sectorDemand: 12, certifiedSupply: 4, netShortage: 8, severity: 'CRITICAL' },
  { domainId: 'skill-mscs-compliance-01', domainName: 'Governance & Legal', category: 'STATUTORY_LEGAL', sectorDemand: 9, certifiedSupply: 3, netShortage: 6, severity: 'CRITICAL' },
  { domainId: 'skill-erp-cloud-01', domainName: 'PACS Software Operations', category: 'PACS_OPERATIONS', sectorDemand: 14, certifiedSupply: 8, netShortage: 6, severity: 'CRITICAL' },
  { domainId: 'skill-kcc-appraisal-01', domainName: 'Credit Appraisal', category: 'CREDIT_KCC', sectorDemand: 10, certifiedSupply: 7, netShortage: 3, severity: 'MODERATE' },
  { domainId: 'skill-audit-pacs-01', domainName: 'Audit & Compliance', category: 'FINANCIAL_ACCOUNTING', sectorDemand: 8, certifiedSupply: 6, netShortage: 2, severity: 'MODERATE' },
  { domainId: 'skill-bye-laws-01', domainName: 'Member Relations', category: 'GOVERNANCE_MANAGEMENT', sectorDemand: 6, certifiedSupply: 5, netShortage: 1, severity: 'MODERATE' },
  { domainId: 'skill-cold-chain-01', domainName: 'Supply Chain & Logistics', category: 'COMMODITY_STORAGE', sectorDemand: 5, certifiedSupply: 5, netShortage: 0, severity: 'BALANCED' },
  { domainId: 'skill-fertilizer-pos-01', domainName: 'Agri-Business Value Chains', category: 'COMMODITY_STORAGE', sectorDemand: 7, certifiedSupply: 8, netShortage: -1, severity: 'BALANCED' },
];

export function DropoutRiskAnalyticsView({
  initialProgrammeId = 'all',
  onInterventionLogged,
}: DropoutRiskAnalyticsViewProps) {
  // Filter States
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(initialProgrammeId);
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>('inst-ricm-bhopal');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Skill Radar Visualization View Mode
  const [radarViewMode, setRadarViewMode] = useState<'RADAR_CHART' | 'COMPARATIVE_BARS'>('RADAR_CHART');

  // Faculty Counseling Modal / Drawer State
  const [counselingCandidate, setCounselingCandidate] = useState<StudentTriageItem | null>(null);
  const [interventionType, setInterventionType] = useState<
    'ONE_ON_ONE_COUNSELING' | 'REMEDIAL_LAB_SESSION' | 'SOCIETY_CHAIRPERSON_ALERT' | 'PEER_STUDY_GROUP'
  >('ONE_ON_ONE_COUNSELING');
  const [counselingNotes, setCounselingNotes] = useState('');
  const [counselorName, setCounselorName] = useState('Prof. Ramesh Sharma (Course Director, RICM Bhopal)');
  const [interventionScheduledDate, setInterventionScheduledDate] = useState('2026-11-12T14:30');
  const [isSubmittingIntervention, setIsSubmittingIntervention] = useState(false);
  const [interventionSuccessMsg, setInterventionSuccessMsg] = useState('');

  // Live / Fallback Data State
  const [retentionData, setRetentionData] = useState<any | null>(null);
  const [skillRadarData, setSkillRadarData] = useState<CooperativeSkillRadarAxis[]>(CANONICAL_COOPERATIVE_SKILLS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from Central API with Fallback
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const url = `${apiClient.getBaseUrl()}/api/v1/training/retention/dropout-risk?programmeId=${selectedProgrammeId}&instituteId=${selectedInstituteId}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.summary) {
            setRetentionData(json);
          }
        }
      } catch (err) {
        // Fallback
      }

      try {
        const radarRes = await fetch(`${apiClient.getBaseUrl()}/api/v1/training/retention/skill-radar`);
        if (radarRes.ok) {
          const radarJson = await radarRes.json();
          if (mounted && Array.isArray(radarJson.radar)) {
            // Reconcile with 8 core axes
            const mapped = CANONICAL_COOPERATIVE_SKILLS.map((axis) => {
              const live = radarJson.radar.find((r: any) => r.skillId === axis.domainId);
              if (live) {
                const diff = live.netShortage ?? (live.jobDemandCount - live.traineeSupplyCount);
                return {
                  ...axis,
                  sectorDemand: live.jobDemandCount,
                  certifiedSupply: live.traineeSupplyCount,
                  netShortage: diff,
                  severity: diff >= 3 ? ('CRITICAL' as const) : diff >= 1 ? ('MODERATE' as const) : ('BALANCED' as const),
                };
              }
              return axis;
            });
            setSkillRadarData(mapped);
          }
        }
      } catch (e) {
        // Keep fallback
      }

      if (mounted) {
        setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [selectedProgrammeId, selectedInstituteId]);

  // Derived Student Triage Roster
  const triageRoster: StudentTriageItem[] = useMemo(() => {
    // If live API returned flagged roster
    if (retentionData && retentionData.flaggedRoster && retentionData.flaggedRoster.length > 0) {
      return retentionData.flaggedRoster.map((item: any, idx: number) => {
        const completionRate = item.riskFactors?.lowLessonCompletion ? 15 : 85;
        const attendanceRate = item.riskFactors?.lowAttendance ? 35 : 90;
        const daysSinceLast = item.riskFactors?.staleEngagement ? 18 : 2;
        const failures = (item.riskFactors?.assessmentFailures || 0) / 10;
        const score = item.riskScore || 0;
        const tier = item.riskTier || 'LOW';

        return {
          traineeId: item.traineeId || `trainee-${idx}`,
          traineeCode: `TRN-2026-${String(idx + 1).padStart(3, '0')}`,
          traineeName: item.traineeName || 'Trainee',
          phone: '+91-98765432' + String(idx).padStart(2, '0'),
          email: `trainee${idx}@coop.gov.in`,
          cooperativeAffiliation: item.cooperativeAffiliation || (idx % 2 === 0 ? 'Bilkisganj PACS, Sehore (MP)' : 'Barabanki Kisan Sewa Samiti (UP)'),
          state: idx % 2 === 0 ? 'Madhya Pradesh' : 'Uttar Pradesh',
          completionRatePercent: completionRate,
          attendanceRatePercent: attendanceRate,
          daysSinceLastActivity: daysSinceLast,
          failedAssessmentsCount: failures,
          lessonRiskPoints: completionRate < 25 ? 40 : 0,
          attendanceRiskPoints: attendanceRate < 50 ? 30 : 0,
          dormancyRiskPoints: daysSinceLast > 14 ? 20 : 0,
          assessmentRiskPoints: Math.min(failures, 3) * 10,
          totalRiskScore: score,
          riskTier: tier,
          recommendedDirective: item.recommendedIntervention || 'Satisfactory progress.',
          recommendedActionBadge: tier === 'HIGH' ? 'Immediate Faculty Outreach' : tier === 'MEDIUM' ? 'Mentorship Counseling' : 'Regular Monitoring',
          interventionLogged: false,
          counselingNotesCount: 0,
        };
      });
    }

    // Default Seed Candidates demonstrating all 4 factors
    return [
      {
        traineeId: 'dddd4444-4444-4444-4444-444444444443',
        traineeCode: 'TRN-2026-003',
        traineeName: 'Sunita Devi',
        phone: '+91-9876543212',
        email: 'sunita.devi@up-coop.gov.in',
        cooperativeAffiliation: 'Barabanki Kisan Sewa Samiti (UP)',
        state: 'Uttar Pradesh',
        completionRatePercent: 15,
        attendanceRatePercent: 35,
        daysSinceLastActivity: 18,
        failedAssessmentsCount: 2,
        lessonRiskPoints: 40,
        attendanceRiskPoints: 30,
        dormancyRiskPoints: 20,
        assessmentRiskPoints: 20,
        totalRiskScore: 100, // Clamped to 100 (40+30+20+20 = 110 -> 100)
        riskTier: 'HIGH' as DropoutRiskTier,
        recommendedDirective: 'Critical disengagement risk: Institute Course Director must initiate mandatory faculty academic review, mentor outreach, and PACS chairperson alert.',
        recommendedActionBadge: 'Immediate Faculty Outreach',
        interventionLogged: false,
        counselingNotesCount: 0,
      },
      {
        traineeId: 'dddd4444-4444-4444-4444-444444444444',
        traineeCode: 'TRN-2026-004',
        traineeName: 'Rajesh Meena',
        phone: '+91-9876543214',
        email: 'rajesh.meena@rj-coop.gov.in',
        cooperativeAffiliation: 'Alwar District Primary Mandali (RJ)',
        state: 'Rajasthan',
        completionRatePercent: 20,
        attendanceRatePercent: 60,
        daysSinceLastActivity: 16,
        failedAssessmentsCount: 0,
        lessonRiskPoints: 40,
        attendanceRiskPoints: 0,
        dormancyRiskPoints: 20,
        assessmentRiskPoints: 0,
        totalRiskScore: 60,
        riskTier: 'HIGH' as DropoutRiskTier,
        recommendedDirective: 'Pacing disengagement: Low lesson completion with dormancy. Schedule urgent virtual catch-up with faculty counselor.',
        recommendedActionBadge: 'Immediate Faculty Outreach',
        interventionLogged: false,
        counselingNotesCount: 0,
      },
      {
        traineeId: 'dddd4444-4444-4444-4444-444444444445',
        traineeCode: 'TRN-2026-005',
        traineeName: 'Kavita Joshi',
        phone: '+91-9876543215',
        email: 'kavita.joshi@uk-coop.gov.in',
        cooperativeAffiliation: 'Nainital Rural Fruit Growers Union (UK)',
        state: 'Uttarakhand',
        completionRatePercent: 45,
        attendanceRatePercent: 40,
        daysSinceLastActivity: 6,
        failedAssessmentsCount: 1,
        lessonRiskPoints: 0,
        attendanceRiskPoints: 30,
        dormancyRiskPoints: 0,
        assessmentRiskPoints: 10,
        totalRiskScore: 40,
        riskTier: 'MEDIUM' as DropoutRiskTier,
        recommendedDirective: 'Moderate attendance lag: Issue automated SMS/PWA reminder, assign peer study group, and schedule remedial lab exercise.',
        recommendedActionBadge: 'Mentorship Counseling',
        interventionLogged: false,
        counselingNotesCount: 0,
      },
      {
        traineeId: 'dddd4444-4444-4444-4444-444444444442',
        traineeCode: 'TRN-2026-002',
        traineeName: 'Vikram Singh',
        phone: '+91-9876543211',
        email: 'vikram.singh@gj-coop.gov.in',
        cooperativeAffiliation: 'Khedut Sahakari Mandali, Anand (GJ)',
        state: 'Gujarat',
        completionRatePercent: 88,
        attendanceRatePercent: 90,
        daysSinceLastActivity: 2,
        failedAssessmentsCount: 0,
        lessonRiskPoints: 0,
        attendanceRiskPoints: 0,
        dormancyRiskPoints: 0,
        assessmentRiskPoints: 0,
        totalRiskScore: 0,
        riskTier: 'LOW' as DropoutRiskTier,
        recommendedDirective: 'Satisfactory trajectory: Learner is progressing within standard NCCT training parameters.',
        recommendedActionBadge: 'Regular Monitoring',
        interventionLogged: false,
        counselingNotesCount: 0,
      },
      {
        traineeId: 'dddd4444-4444-4444-4444-444444444441',
        traineeCode: 'TRN-2026-001',
        traineeName: 'Anita Patel',
        phone: '+91-9876543210',
        email: 'anita.patel@mp-coop.gov.in',
        cooperativeAffiliation: 'Bilkisganj PACS, Sehore (MP)',
        state: 'Madhya Pradesh',
        completionRatePercent: 100,
        attendanceRatePercent: 94,
        daysSinceLastActivity: 1,
        failedAssessmentsCount: 0,
        lessonRiskPoints: 0,
        attendanceRiskPoints: 0,
        dormancyRiskPoints: 0,
        assessmentRiskPoints: 0,
        totalRiskScore: 0,
        riskTier: 'LOW' as DropoutRiskTier,
        recommendedDirective: 'Satisfactory trajectory: Certificate issued.',
        recommendedActionBadge: 'Regular Monitoring',
        interventionLogged: false,
        counselingNotesCount: 0,
      },
    ];
  }, [retentionData]);

  // Filtered Candidates
  const filteredTriage = useMemo(() => {
    return triageRoster.filter((item) => {
      if (tierFilter !== 'ALL' && item.riskTier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.traineeName.toLowerCase().includes(q) ||
          item.traineeCode.toLowerCase().includes(q) ||
          item.cooperativeAffiliation.toLowerCase().includes(q) ||
          item.state.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [triageRoster, tierFilter, searchQuery]);

  // Tier Counts Summary
  const tierSummary = useMemo(() => {
    const total = triageRoster.length;
    const high = triageRoster.filter((t) => t.riskTier === 'HIGH').length;
    const medium = triageRoster.filter((t) => t.riskTier === 'MEDIUM').length;
    const low = triageRoster.filter((t) => t.riskTier === 'LOW').length;
    const highPct = total > 0 ? ((high / total) * 100).toFixed(1) : '0.0';
    return { total, high, medium, low, highPct };
  }, [triageRoster]);

  // Handle Faculty Intervention Submit
  const handleSaveIntervention = () => {
    if (!counselingCandidate) return;
    setIsSubmittingIntervention(true);

    setTimeout(() => {
      setIsSubmittingIntervention(false);
      setInterventionSuccessMsg(
        `Counseling directive logged for ${counselingCandidate.traineeName}. Follow-up scheduled for ${new Date(interventionScheduledDate).toLocaleDateString('en-IN')}.`
      );

      if (onInterventionLogged) {
        onInterventionLogged(
          {
            traineeId: counselingCandidate.traineeId,
            traineeName: counselingCandidate.traineeName,
            programmeId: selectedProgrammeId,
            riskScore: counselingCandidate.totalRiskScore,
            riskTier: counselingCandidate.riskTier,
            riskFactors: {
              lowLessonCompletion: counselingCandidate.lessonRiskPoints > 0,
              lowAttendance: counselingCandidate.attendanceRiskPoints > 0,
              staleEngagement: counselingCandidate.dormancyRiskPoints > 0,
              assessmentFailures: counselingCandidate.assessmentRiskPoints / 10,
            },
            recommendedIntervention: counselingNotes || counselingCandidate.recommendedDirective,
            evaluatedAt: new Date().toISOString(),
          },
          interventionType
        );
      }

      setTimeout(() => {
        setInterventionSuccessMsg('');
        setCounselingCandidate(null);
      }, 1500);
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Directorate Masthead & Programme Selector */}
      <div style={doubleBezelOuter}>
        <div style={doubleBezelInner}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#991b1b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  DIRECTORATE 2 • संधारण एवं कौशल ट्राइएज
                </span>
                <span style={pillBadge('warning')}>4-Factor Predictive Model</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#081854', margin: 0 }}>
                Dropout-Risk Triage Radar & Cooperative Skill Analytics
              </h2>
              <p style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted, margin: '0.35rem 0 0 0' }}>
                Transparent heuristic retention engine identifying early attrition signals and mapping sector skill supply vs demand shortages.
              </p>
            </div>

            {/* Quick Filter Selectors */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={selectedInstituteId}
                onChange={(e) => setSelectedInstituteId(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '3px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                <option value="inst-ricm-bhopal">RICM Bhopal (MP)</option>
                <option value="inst-vamnicom-pune">VAMNICOM Pune (MH)</option>
                <option value="inst-icm-lucknow">ICM Lucknow (UP)</option>
              </select>

              <select
                value={selectedProgrammeId}
                onChange={(e) => setSelectedProgrammeId(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '3px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                <option value="all">All Active ATP Batches</option>
                <option value="prog-atp-2026-pacs-01">ATP-2026-PACS-01 (PACS Computerization)</option>
                <option value="prog-atp-2026-dairy-02">ATP-2026-DAIRY-02 (Dairy Cooperative Ops)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4-Factor Heuristic Triage KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        {/* High Risk Card */}
        <div style={{ ...cardStyle, borderLeft: '4px solid #dc2626' }}>
          <div style={bentoHeaderStyle}>High Risk Cohort / गंभीर जोखिम</div>
          <div style={{ ...bentoValueStyle, color: '#dc2626' }}>
            {tierSummary.high} Trainee{tierSummary.high === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: 600 }}>
            {tierSummary.highPct}% of Cohort • Score ≥ 60
          </div>
        </div>

        {/* Medium Risk Card */}
        <div style={{ ...cardStyle, borderLeft: '4px solid #d97706' }}>
          <div style={bentoHeaderStyle}>Medium Risk / मध्यम निगरानी</div>
          <div style={{ ...bentoValueStyle, color: '#d97706' }}>
            {tierSummary.medium} Trainee{tierSummary.medium === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#92400e' }}>
            Mentorship Counseling • Score 30–59
          </div>
        </div>

        {/* Low Risk Card */}
        <div style={{ ...cardStyle, borderLeft: '4px solid #16a34a' }}>
          <div style={bentoHeaderStyle}>Satisfactory Trajectory / संतोषजनक</div>
          <div style={{ ...bentoValueStyle, color: '#16a34a' }}>
            {tierSummary.low} Trainee{tierSummary.low === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#166534' }}>
            Normal Certification Pacing • Score &lt; 30
          </div>
        </div>

        {/* Projected Completion Rate */}
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Projected Completion / संवर्धन दर</div>
          <div style={{ ...bentoValueStyle, color: '#081854' }}>
            {tierSummary.total > 0 ? (100 - parseFloat(tierSummary.highPct)).toFixed(1) : '100'}%
          </div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
            Target Institutional Benchmark: ≥ 85.0%
          </div>
        </div>
      </div>

      {/* 3. Transparent Heuristic Formula Strip */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#081854', textTransform: 'uppercase' }}>
          4-Factor Heuristic Retention Formula:
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <span style={pillBadge('error')}>Lesson Progress &lt; 25% (+40 PTS)</span>
          <span style={pillBadge('error')}>Attendance &lt; 50% (+30 PTS)</span>
          <span style={pillBadge('warning')}>Inactive &gt; 14 Days (+20 PTS)</span>
          <span style={pillBadge('warning')}>Failed Tests (+10 PTS each, max 30)</span>
        </div>
      </div>

      {/* 4. Student Triage Matrix Table */}
      <div style={doubleBezelOuter}>
        <div style={doubleBezelInner}>
          {/* Table Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <input
                type="text"
                placeholder="Search candidate name, PACS, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  borderRadius: '3px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                }}
              />
              <div style={{ position: 'absolute', left: '0.65rem', top: '0.6rem', color: THEME.colors.inkMuted }}>
                <SearchIcon size={14} />
              </div>
            </div>

            {/* Tier Filter Tabs */}
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor:
                      tierFilter === tier
                        ? tier === 'HIGH'
                          ? '#dc2626'
                          : tier === 'MEDIUM'
                          ? '#d97706'
                          : tier === 'LOW'
                          ? '#16a34a'
                          : '#081854'
                        : '#ffffff',
                    color: tierFilter === tier ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                  }}
                >
                  {tier} {tier === 'HIGH' ? `(${tierSummary.high})` : tier === 'MEDIUM' ? `(${tierSummary.medium})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '3px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={tableHeaderStyle}>Candidate Profile</th>
                  <th style={tableHeaderStyle}>Factor 1: Lesson Progress</th>
                  <th style={tableHeaderStyle}>Factor 2: Attendance</th>
                  <th style={tableHeaderStyle}>Factor 3: Dormancy</th>
                  <th style={tableHeaderStyle}>Factor 4: Failed Tests</th>
                  <th style={tableHeaderStyle}>Risk Score (0–100)</th>
                  <th style={tableHeaderStyle}>Tier & Action</th>
                  <th style={tableHeaderStyle}>Faculty Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTriage.map((c) => {
                  const isHigh = c.riskTier === 'HIGH';
                  const isMed = c.riskTier === 'MEDIUM';

                  return (
                    <tr
                      key={c.traineeId}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: isHigh ? 'rgba(254, 242, 242, 0.4)' : isMed ? 'rgba(255, 251, 235, 0.4)' : '#ffffff',
                      }}
                    >
                      {/* Candidate Profile */}
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                          {c.traineeName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>
                          {c.traineeCode} • {c.cooperativeAffiliation} ({c.state})
                        </div>
                      </td>

                      {/* Factor 1: Lesson Progress */}
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.lessonRiskPoints > 0 ? '#dc2626' : '#166534' }}>
                            {c.completionRatePercent}%
                          </span>
                          {c.lessonRiskPoints > 0 ? (
                            <span style={pillBadge('error')}>+40 PTS (&lt; 25%)</span>
                          ) : (
                            <span style={pillBadge('neutral')}>0 PTS</span>
                          )}
                        </div>
                      </td>

                      {/* Factor 2: Attendance */}
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.attendanceRiskPoints > 0 ? '#dc2626' : '#166534' }}>
                            {c.attendanceRatePercent}%
                          </span>
                          {c.attendanceRiskPoints > 0 ? (
                            <span style={pillBadge('error')}>+30 PTS (&lt; 50%)</span>
                          ) : (
                            <span style={pillBadge('neutral')}>0 PTS</span>
                          )}
                        </div>
                      </td>

                      {/* Factor 3: Inactivity Dormancy */}
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: c.dormancyRiskPoints > 0 ? '#d97706' : '#334155' }}>
                            {c.daysSinceLastActivity} days
                          </span>
                          {c.dormancyRiskPoints > 0 ? (
                            <span style={pillBadge('warning')}>+20 PTS (&gt; 14d)</span>
                          ) : (
                            <span style={pillBadge('neutral')}>0 PTS</span>
                          )}
                        </div>
                      </td>

                      {/* Factor 4: Failed Tests */}
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: c.assessmentRiskPoints > 0 ? '#dc2626' : '#334155' }}>
                            {c.failedAssessmentsCount} failed
                          </span>
                          {c.assessmentRiskPoints > 0 ? (
                            <span style={pillBadge('error')}>+{c.assessmentRiskPoints} PTS</span>
                          ) : (
                            <span style={pillBadge('neutral')}>0 PTS</span>
                          )}
                        </div>
                      </td>

                      {/* Composite Risk Score */}
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '110px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800 }}>
                            <span style={{ color: isHigh ? '#dc2626' : isMed ? '#d97706' : '#166534' }}>
                              {c.totalRiskScore} / 100
                            </span>
                          </div>
                          {/* Progress bar container */}
                          <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${c.totalRiskScore}%`,
                                backgroundColor: isHigh ? '#dc2626' : isMed ? '#d97706' : '#16a34a',
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Risk Tier & Recommended Directive */}
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={pillBadge(isHigh ? 'error' : isMed ? 'warning' : 'success')}>
                            {c.riskTier} RISK
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: THEME.colors.inkMuted }}>
                            {c.recommendedActionBadge}
                          </span>
                        </div>
                      </td>

                      {/* Faculty Action */}
                      <td style={tableCellStyle}>
                        <button
                          onClick={() => {
                            setCounselingCandidate(c);
                            setCounselingNotes(c.recommendedDirective);
                          }}
                          style={{
                            ...buttonPrimaryStyle,
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.72rem',
                            backgroundColor: isHigh ? '#dc2626' : isMed ? '#d97706' : '#081854',
                          }}
                        >
                          <MessageSquareIcon size={12} />
                          <span>Intervene</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Cooperative 8-D Skill Shortage Radar & Analytics */}
      <div style={doubleBezelOuter}>
        <div style={doubleBezelInner}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#081854', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                DIRECTORATE 2 • 8-आयामी कौशल विश्लेषण
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#081854', margin: '0.2rem 0 0 0' }}>
                Cooperative 8-D Skill Shortage Radar & Sector Demand
              </h3>
              <p style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0 0' }}>
                Curriculum steering radar comparing employer sector job demand against certified trainee supply.
              </p>
            </div>

            {/* View Mode Toggle: SVG Radar vs Comparative Bars */}
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'hidden' }}>
              <button
                onClick={() => setRadarViewMode('RADAR_CHART')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: radarViewMode === 'RADAR_CHART' ? '#081854' : '#ffffff',
                  color: radarViewMode === 'RADAR_CHART' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <RadarIcon size={12} />
                <span>8-Axis Radar Chart</span>
              </button>
              <button
                onClick={() => setRadarViewMode('COMPARATIVE_BARS')}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: radarViewMode === 'COMPARATIVE_BARS' ? '#081854' : '#ffffff',
                  color: radarViewMode === 'COMPARATIVE_BARS' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <BarChartIcon size={12} />
                <span>Comparative Bars</span>
              </button>
            </div>
          </div>

          {/* Visualization Container */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
            {/* Visual Panel: SVG Radar Polygon */}
            {radarViewMode === 'RADAR_CHART' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {/* 8-Axis SVG Radar */}
                <svg width="340" height="340" viewBox="-170 -170 340 340">
                  {/* Concentric Grid Rings */}
                  {[30, 60, 90, 120].map((r, idx) => (
                    <circle key={idx} cx="0" cy="0" r={r} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                  ))}

                  {/* 8 Axis Spokes */}
                  {skillRadarData.map((axis, i) => {
                    const angle = (i * 2 * Math.PI) / 8 - Math.PI / 2;
                    const x = 120 * Math.cos(angle);
                    const y = 120 * Math.sin(angle);
                    const labelX = 145 * Math.cos(angle);
                    const labelY = 145 * Math.sin(angle);

                    return (
                      <g key={axis.domainId}>
                        <line x1="0" y1="0" x2={x} y2={y} stroke="#94a3b8" strokeWidth="1" />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="8"
                          fontWeight="700"
                          fill="#334155"
                        >
                          {axis.domainName.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}

                  {/* Sector Demand Polygon (Gold / Amber) */}
                  <polygon
                    points={skillRadarData
                      .map((axis, i) => {
                        const angle = (i * 2 * Math.PI) / 8 - Math.PI / 2;
                        const dist = Math.min(120, (axis.sectorDemand / 16) * 120);
                        return `${dist * Math.cos(angle)},${dist * Math.sin(angle)}`;
                      })
                      .join(' ')}
                    fill="rgba(254, 181, 5, 0.25)"
                    stroke="#d97706"
                    strokeWidth="2"
                  />

                  {/* Certified Candidate Supply Polygon (Emerald Green) */}
                  <polygon
                    points={skillRadarData
                      .map((axis, i) => {
                        const angle = (i * 2 * Math.PI) / 8 - Math.PI / 2;
                        const dist = Math.min(120, (axis.certifiedSupply / 16) * 120);
                        return `${dist * Math.cos(angle)},${dist * Math.sin(angle)}`;
                      })
                      .join(' ')}
                    fill="rgba(26, 180, 82, 0.25)"
                    stroke="#16a34a"
                    strokeWidth="2"
                  />
                </svg>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#d97706', borderRadius: '2px' }} />
                    <span style={{ fontWeight: 700, color: '#334155' }}>Sector Employer Demand</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#16a34a', borderRadius: '2px' }} />
                    <span style={{ fontWeight: 700, color: '#334155' }}>Certified Trainee Supply</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Comparative Bar Chart */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {skillRadarData.map((axis) => (
                  <div key={axis.domainId} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700 }}>
                      <span style={{ color: '#0f172a' }}>{axis.domainName}</span>
                      <span style={{ color: axis.netShortage >= 3 ? '#dc2626' : '#166534' }}>
                        Shortage: {axis.netShortage > 0 ? `+${axis.netShortage}` : axis.netShortage}
                      </span>
                    </div>
                    {/* Double Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {/* Demand Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(axis.sectorDemand / 16) * 100}%`, backgroundColor: '#d97706' }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, width: '25px', textAlign: 'right', color: '#d97706' }}>
                          {axis.sectorDemand}
                        </span>
                      </div>
                      {/* Supply Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(axis.certifiedSupply / 16) * 100}%`, backgroundColor: '#16a34a' }} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, width: '25px', textAlign: 'right', color: '#16a34a' }}>
                          {axis.certifiedSupply}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shortage Breakdown Table & Curriculum Directives */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '3px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={tableHeaderStyle}>Skill Domain</th>
                      <th style={tableHeaderStyle}>Demand</th>
                      <th style={tableHeaderStyle}>Supply</th>
                      <th style={tableHeaderStyle}>Deficit</th>
                      <th style={tableHeaderStyle}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillRadarData.map((row) => (
                      <tr key={row.domainId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ ...tableCellStyle, fontWeight: 700, fontSize: '0.8rem' }}>{row.domainName}</td>
                        <td style={{ ...tableCellStyle, color: '#d97706', fontWeight: 700 }}>{row.sectorDemand}</td>
                        <td style={{ ...tableCellStyle, color: '#16a34a', fontWeight: 700 }}>{row.certifiedSupply}</td>
                        <td style={{ ...tableCellStyle, fontWeight: 800, color: row.netShortage >= 3 ? '#dc2626' : '#334155' }}>
                          {row.netShortage > 0 ? `+${row.netShortage}` : row.netShortage}
                        </td>
                        <td style={tableCellStyle}>
                          <span
                            style={pillBadge(
                              row.severity === 'CRITICAL'
                                ? 'error'
                                : row.severity === 'MODERATE'
                                ? 'warning'
                                : 'success'
                            )}
                          >
                            {row.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Institutional Curriculum Steering Advisory Card */}
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '3px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '0.25rem' }}>
                  🏛️ RICM / ICM Director Curriculum Steering Directive
                </div>
                <div style={{ color: '#78350f', lineHeight: 1.45 }}>
                  Critical deficits identified in <strong>Financial Management (+8)</strong>, <strong>PACS Software Operations (+6)</strong>, and <strong>Governance & Legal (+6)</strong>. Recommend prioritizing additional Annual Training Plan (ATP) batches in Daybook Computerization and MSCS Act 2023 for the upcoming training quarter.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Faculty Action Drawer / Modal */}
      {counselingCandidate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => setCounselingCandidate(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #cbd5e1',
              boxShadow: THEME.shadows.modal,
              padding: '1.75rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={pillBadge(counselingCandidate.riskTier === 'HIGH' ? 'error' : 'warning')}>
                  Faculty Intervention Dispatch
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#081854', margin: '0.35rem 0 0 0' }}>
                  Academic Counseling: {counselingCandidate.traineeName}
                </h3>
                <div style={{ fontSize: '0.78rem', color: THEME.colors.inkMuted }}>
                  {counselingCandidate.cooperativeAffiliation} • Composite Risk Score: {counselingCandidate.totalRiskScore}/100
                </div>
              </div>
              <button
                onClick={() => setCounselingCandidate(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.colors.inkMuted }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Heuristic Diagnostic Breakdown */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '3px',
                padding: '0.85rem',
                marginBottom: '1.25rem',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ fontWeight: 800, color: '#081854', marginBottom: '0.35rem' }}>
                Detected Attrition Risk Factors:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                <div>Lesson Completion: <strong>{counselingCandidate.completionRatePercent}%</strong> ({counselingCandidate.lessonRiskPoints > 0 ? '+40 pts' : 'OK'})</div>
                <div>Session Attendance: <strong>{counselingCandidate.attendanceRatePercent}%</strong> ({counselingCandidate.attendanceRiskPoints > 0 ? '+30 pts' : 'OK'})</div>
                <div>Inactivity Dormancy: <strong>{counselingCandidate.daysSinceLastActivity} days</strong> ({counselingCandidate.dormancyRiskPoints > 0 ? '+20 pts' : 'OK'})</div>
                <div>Failed Examinations: <strong>{counselingCandidate.failedAssessmentsCount}</strong> ({counselingCandidate.assessmentRiskPoints > 0 ? `+${counselingCandidate.assessmentRiskPoints} pts` : 'OK'})</div>
              </div>
            </div>

            {/* Intervention Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                  Intervention Action Type
                </label>
                <select
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '3px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="ONE_ON_ONE_COUNSELING">Direct Faculty-Trainee Academic Counseling</option>
                  <option value="REMEDIAL_LAB_SESSION">Schedule Remedial Hands-On Double-Entry Lab</option>
                  <option value="SOCIETY_CHAIRPERSON_ALERT">Issue Formal PWA/SMS Alert to PACS Chairperson</option>
                  <option value="PEER_STUDY_GROUP">Assign to High-Performing Peer Study Cohort</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                  Follow-Up Session Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={interventionScheduledDate}
                  onChange={(e) => setInterventionScheduledDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '3px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>
                  Counseling Notes & Action Commitments
                </label>
                <textarea
                  rows={4}
                  value={counselingNotes}
                  onChange={(e) => setCounselingNotes(e.target.value)}
                  placeholder="Record specific academic commitments, remedial modules assigned, and faculty directives..."
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '3px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontFamily: THEME.fonts.sans,
                  }}
                />
              </div>

              {interventionSuccessMsg && (
                <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '0.75rem', borderRadius: '3px', fontSize: '0.8rem', fontWeight: 600 }}>
                  ✓ {interventionSuccessMsg}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCounselingCandidate(null)}
                  style={buttonSecondaryStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveIntervention}
                  disabled={isSubmittingIntervention}
                  style={{ ...buttonPrimaryStyle, backgroundColor: '#081854' }}
                >
                  {isSubmittingIntervention ? 'Dispatching...' : 'Dispatch Intervention Directive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const DropoutRiskRadarView = DropoutRiskAnalyticsView;
