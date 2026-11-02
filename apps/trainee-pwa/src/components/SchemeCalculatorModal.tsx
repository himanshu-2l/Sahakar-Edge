import React, { useState } from 'react';
import type {
  CooperativeSocietyType,
  AuditGrade,
  SchemeProjectCategory,
  SchemeEvaluationInput,
  SchemeEvaluationResult,
} from '@sahakar/types';

export interface SchemeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'EN' | 'HI';
  initialSocietyType?: CooperativeSocietyType;
  initialAuditGrade?: AuditGrade;
}

export interface LocalSchemeDefinition {
  id: string;
  code: string;
  name: string;
  nameHi: string;
  nodalMinistry: string;
  category: string;
  maxProjectCostLakhs: number;
  subsidyPercentage: number;
  maxSubsidyLakhs: number;
  interestSubventionPercent: number;
  eligibleSocietyTypes: CooperativeSocietyType[];
  minimumAuditGrade: AuditGrade;
  allowedCategories: SchemeProjectCategory[];
  mandatoryDocuments: string[];
  mandatoryDocumentsHi: string[];
}

export const LOCAL_SCHEMES: LocalSchemeDefinition[] = [
  {
    id: 'scheme-aif-01',
    code: 'AIF',
    name: 'Agriculture Infrastructure Fund (AIF)',
    nameHi: 'कृषि अवसंरचना कोष (एआईएफ)',
    nodalMinistry: 'Ministry of Agriculture & Farmers Welfare / Ministry of Cooperation',
    category: 'INFRASTRUCTURE',
    maxProjectCostLakhs: 200,
    subsidyPercentage: 0,
    maxSubsidyLakhs: 0,
    interestSubventionPercent: 3.0,
    eligibleSocietyTypes: ['PACS', 'FPO', 'MULTI_PURPOSE'],
    minimumAuditGrade: 'B',
    allowedCategories: ['POST_HARVEST_STORAGE', 'DAIRY_COLD_CHAIN', 'AGRI_INPUT_RETAIL', 'SOLAR_KUSUM'],
    mandatoryDocuments: [
      'Detailed Project Report (DPR)',
      'Audited Balance Sheets (Past 3 Years)',
      'Managing Committee Board Resolution',
      'Land Ownership or Long-Term Lease Deed (Min 10 Years)',
      'DCCB / Commercial Bank In-Principle Sanction Letter',
    ],
    mandatoryDocumentsHi: [
      'विस्तृत परियोजना रिपोर्ट (डीपीआर)',
      'पिछले 3 वर्षों की अंकेक्षित बैलेंस शीट',
      'प्रबंध समिति का बोर्ड प्रस्ताव',
      'भूमि स्वामित्व या 10-वर्षीय लीज डीड',
      'डीसीसीबी / वाणिज्यिक बैंक सैद्धांतिक स्वीकृति पत्र',
    ],
  },
  {
    id: 'scheme-pmfme-01',
    code: 'PMFME',
    name: 'PM Formalisation of Micro food processing Enterprises Scheme',
    nameHi: 'पीएम सूक्ष्म खाद्य प्रसंस्करण उद्यम औपचारिकीकरण योजना',
    nodalMinistry: 'Ministry of Food Processing Industries (MoFPI)',
    category: 'PROCESSING',
    maxProjectCostLakhs: 40,
    subsidyPercentage: 35.0,
    maxSubsidyLakhs: 10.0,
    interestSubventionPercent: 0,
    eligibleSocietyTypes: ['PACS', 'FPO', 'MULTI_PURPOSE', 'DAIRY'],
    minimumAuditGrade: 'B',
    allowedCategories: ['FOOD_PROCESSING', 'AGRI_INPUT_RETAIL'],
    mandatoryDocuments: [
      'Micro-Enterprise Business Plan & Project Report',
      'FSSAI Registration or Food Safety License Application',
      'Member Farmer Procurement & Sourcing Plan',
      'Chartered Accountant Net Worth Certificate',
      'Bank Loan Appraisal Document',
    ],
    mandatoryDocumentsHi: [
      'सूक्ष्म उद्यम व्यवसाय योजना एवं परियोजना रिपोर्ट',
      'एफएसएसएआई पंजीकरण या खाद्य सुरक्षा लाइसेंस आवेदन',
      'सदस्य किसान खरीद एवं आपूर्ति योजना',
      'चार्टर्ड अकाउंटेंट नेटवर्थ प्रमाण पत्र',
      'बैंक ऋण मूल्यांकन दस्तावेज',
    ],
  },
  {
    id: 'scheme-yuva-sahakar-01',
    code: 'YUVA_SAHAKAR',
    name: 'Yuva Sahakar — Cooperative Enterprise Support Scheme',
    nameHi: 'युवा सहकार — सहकारी उद्यम समर्थन योजना',
    nodalMinistry: 'National Cooperative Development Corporation (NCDC)',
    category: 'YOUTH_STARTUP',
    maxProjectCostLakhs: 300,
    subsidyPercentage: 0,
    maxSubsidyLakhs: 0,
    interestSubventionPercent: 2.0,
    eligibleSocietyTypes: ['PACS', 'DAIRY', 'FISHERY', 'MULTI_PURPOSE', 'FPO'],
    minimumAuditGrade: 'B',
    allowedCategories: [
      'SOLAR_KUSUM',
      'CSC_DIGITAL_SERVICES',
      'FOOD_PROCESSING',
      'DAIRY_COLD_CHAIN',
      'POST_HARVEST_STORAGE',
    ],
    mandatoryDocuments: [
      'NCDC Innovation & Diversification Project Proposal',
      'Managing Committee Youth / Women Member Roster (Min 25% Youth)',
      'Cooperative Society Registration & Model Bye-Laws',
      'Statutory Audit Report (Last Financial Year)',
      'State Cooperative Registrar / NCDC Endorsement',
    ],
    mandatoryDocumentsHi: [
      'एनसीडीसी नवाचार एवं विविधीकरण परियोजना प्रस्ताव',
      'प्रबंध समिति युवा/महिला सदस्य रोस्टर (न्यूनतम 25% युवा)',
      'सहकारी समिति पंजीकरण एवं आदर्श उप-नियम',
      'वैधानिक लेखापरीक्षा रिपोर्ट (अंतिम वित्तीय वर्ष)',
      'राज्य सहकारी रजिस्ट्रार / एनसीडीसी अनुमोदन',
    ],
  },
  {
    id: 'scheme-pacs-comp-01',
    code: 'PACS_COMPUTERIZATION',
    name: 'Centrally Sponsored Project for Computerization of PACS',
    nameHi: 'पैक्स कंप्यूटरीकरण हेतु केंद्र प्रायोजित परियोजना',
    nodalMinistry: 'Ministry of Cooperation',
    category: 'COMPUTERIZATION',
    maxProjectCostLakhs: 4.0,
    subsidyPercentage: 100.0,
    maxSubsidyLakhs: 4.0,
    interestSubventionPercent: 0,
    eligibleSocietyTypes: ['PACS'],
    minimumAuditGrade: 'C',
    allowedCategories: ['CSC_DIGITAL_SERVICES'],
    mandatoryDocuments: [
      'PACS Unique Identification Number (National Database UID)',
      'Day Book & Member Share Capital Register Audit Verification',
      'Broadband / 4G Internet Connectivity Readiness Certificate',
      'Designated Computer Operator / Trainee NCCT Certification Roster',
      'NABARD State Level Implementation Committee (SLIC) Onboarding Approval',
    ],
    mandatoryDocumentsHi: [
      'पैक्स विशिष्ट पहचान संख्या (राष्ट्रीय डेटाबेस यूआईडी)',
      'दैनिक रोकड़बही एवं सदस्य शेयर पूंजी रजिस्टर ऑडिट सत्यापन',
      'ब्रॉडबैंड / 4जी इंटरनेट कनेक्टिविटी तत्परता प्रमाण पत्र',
      'नामित कंप्यूटर ऑपरेटर / प्रशिक्षु एनसीटीसीटी प्रमाणन रोस्टर',
      'नाबार्ड राज्य स्तरीय कार्यान्वयन समिति (एसएलआईसी) अनुमोदन',
    ],
  },
];

const GRADE_HIERARCHY: Record<AuditGrade, number> = { A: 4, B: 3, C: 2, D: 1 };

export function evaluateSchemesLocal(input: SchemeEvaluationInput): SchemeEvaluationResult[] {
  return LOCAL_SCHEMES.map((scheme) => {
    const reasons: string[] = [];
    let eligible = true;

    if (!scheme.eligibleSocietyTypes.includes(input.societyType)) {
      eligible = false;
      reasons.push(`Society type "${input.societyType}" ineligible. Eligible: ${scheme.eligibleSocietyTypes.join(', ')}.`);
    }

    const minGradeRank = GRADE_HIERARCHY[scheme.minimumAuditGrade as AuditGrade];
    const actualGradeRank = GRADE_HIERARCHY[input.auditGrade] || 0;
    if (actualGradeRank < minGradeRank) {
      eligible = false;
      reasons.push(`Audit Grade "${input.auditGrade}" does not meet minimum regulatory requirement of Grade "${scheme.minimumAuditGrade}".`);
    }

    if (!scheme.allowedCategories.includes(input.projectCategory)) {
      eligible = false;
      reasons.push(`Project category "${input.projectCategory}" not supported under ${scheme.code}.`);
    }

    if (input.proposedProjectCostLakhs <= 0) {
      eligible = false;
      reasons.push('Proposed project cost must be greater than zero.');
    }

    const eligibleCost = Math.min(input.proposedProjectCostLakhs, scheme.maxProjectCostLakhs);
    const rawSubsidy = (eligibleCost * scheme.subsidyPercentage) / 100;
    const eligibleSubsidyLakhs = Math.round(Math.min(rawSubsidy, scheme.maxSubsidyLakhs) * 100) / 100;

    let applicableSubventionPercent = scheme.interestSubventionPercent;
    if (scheme.code === 'YUVA_SAHAKAR' && input.womenMemberPercentage >= 50) {
      applicableSubventionPercent = Math.min(3.0, applicableSubventionPercent + 1.0);
    }

    const baseRate = 9.0;
    const effectiveInterestRate =
      scheme.subsidyPercentage === 100 ? 0.0 : Math.max(0, Math.round((baseRate - applicableSubventionPercent) * 100) / 100);

    const loanPrincipal = Math.max(0, input.proposedProjectCostLakhs - eligibleSubsidyLakhs);
    const subventionEligiblePrincipal = Math.min(loanPrincipal, scheme.maxProjectCostLakhs);
    const estimatedAnnualInterestSavingsLakhs =
      Math.round(subventionEligiblePrincipal * (applicableSubventionPercent / 100) * 100) / 100;

    let matchScore = 0;
    if (scheme.eligibleSocietyTypes.includes(input.societyType)) matchScore += 25;
    if (scheme.allowedCategories.includes(input.projectCategory)) matchScore += 25;
    if (actualGradeRank >= minGradeRank) {
      matchScore += 25;
      if (input.auditGrade === 'A') matchScore += 5;
    }
    if (input.annualTurnoverLakhs > 0 && input.netWorthLakhs > 0) matchScore += 10;
    if (input.womenMemberPercentage >= 20) matchScore += 10;

    if (!eligible) {
      matchScore = Math.min(45, matchScore);
    } else {
      matchScore = Math.min(100, Math.max(70, matchScore));
      reasons.push(
        `Eligible for ₹${eligibleSubsidyLakhs} L subsidy & ${applicableSubventionPercent}% interest subvention under ${scheme.name}.`
      );
    }

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      eligible,
      matchScore,
      reasons,
      eligibleSubsidyLakhs,
      applicableSubventionPercent,
      estimatedAnnualInterestSavingsLakhs,
      effectiveInterestRate,
      documentChecklist: scheme.mandatoryDocuments,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export const SchemeCalculatorModal: React.FC<SchemeCalculatorModalProps> = ({
  isOpen,
  onClose,
  language: initialLanguage = 'EN',
  initialSocietyType = 'PACS',
  initialAuditGrade = 'A',
}) => {
  const [language, setLanguage] = useState<'EN' | 'HI'>(initialLanguage);
  const [societyType, setSocietyType] = useState<CooperativeSocietyType>(initialSocietyType);
  const [auditGrade, setAuditGrade] = useState<AuditGrade>(initialAuditGrade);
  const [projectCategory, setProjectCategory] = useState<SchemeProjectCategory>('POST_HARVEST_STORAGE');
  const [annualTurnoverLakhs, setAnnualTurnoverLakhs] = useState<number>(45.0);
  const [netWorthLakhs, setNetWorthLakhs] = useState<number>(28.5);
  const [proposedProjectCostLakhs, setProposedProjectCostLakhs] = useState<number>(25.0);
  const [womenMemberPercentage, setWomenMemberPercentage] = useState<number>(35);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const evaluationInput: SchemeEvaluationInput = {
    societyType,
    yearsActive: 5,
    auditGrade,
    memberCount: 420,
    womenMemberPercentage,
    annualTurnoverLakhs,
    netWorthLakhs,
    proposedProjectCostLakhs,
    projectCategory,
    societyName: 'Bilkisganj Model PACS',
    districtState: 'Sehore, Madhya Pradesh',
  };

  const results = evaluateSchemesLocal(evaluationInput);

  const handleDocToggle = (docKey: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docKey]: !prev[docKey] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '820px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #cbd5e1',
          maxHeight: '94vh',
        }}
      >
        {/* National Tricolor Top Ribbon */}
        <div style={{ display: 'flex', height: '4px', width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: '#ea580c' }} />
          <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
          <div style={{ flex: 1, backgroundColor: '#16a34a' }} />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff' }}>
                {language === 'HI' ? 'राष्ट्रीय सहकारी योजना पात्रता एवं सब्सिडी सलाहकार' : 'National Scheme Advisory & Subsidy Calculator'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.55 }}>
                {language === 'HI'
                  ? 'एआईएफ, पीएमएफएमई, युवा सहकार एवं पैक्स कंप्यूटरीकरण अनुदान मूल्यांकन'
                  : 'AIF, PMFME, Yuva Sahakar & PACS Computerization Grant Appraisal'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Language Switcher */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid #334155',
              }}
            >
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                style={{
                  minHeight: '44px',
                  minWidth: '48px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: language === 'EN' ? '#0369a1' : 'transparent',
                  color: language === 'EN' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('HI')}
                style={{
                  minHeight: '44px',
                  minWidth: '48px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: language === 'HI' ? '#0369a1' : 'transparent',
                  color: language === 'HI' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                हिंदी
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                minHeight: '44px',
                minWidth: '44px',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Print Scheme Dossier"
            >
              <span>🖨️</span>
              <span>{language === 'HI' ? 'प्रिंट' : 'Print'}</span>
            </button>

            {/* Circular 44px Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                fontSize: '1.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close modal"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Form Inputs Grid */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
              {language === 'HI' ? 'सहकारी समिति प्रोफाइल एवं परियोजना विवरण:' : 'Cooperative Society Profile & Project Parameters:'}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {/* Society Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'समिति का प्रकार' : 'Society Type'}
                </label>
                <select
                  value={societyType}
                  onChange={(e) => setSocietyType(e.target.value as CooperativeSocietyType)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="PACS">PACS (प्राथमिक कृषि साख समिति)</option>
                  <option value="DAIRY">Dairy Cooperative (दुग्ध समिति)</option>
                  <option value="FISHERY">Fishery Cooperative (मत्स्य समिति)</option>
                  <option value="MULTI_PURPOSE">Multi-Purpose Cooperative (बहुउद्देश्यीय)</option>
                  <option value="FPO">Farmer Producer Organization (एफपीओ)</option>
                </select>
              </div>

              {/* Audit Grade */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'वैधानिक ऑडिट ग्रेड' : 'Statutory Audit Grade'}
                </label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {(['A', 'B', 'C', 'D'] as AuditGrade[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setAuditGrade(grade)}
                      style={{
                        flex: 1,
                        minHeight: '44px',
                        borderRadius: '8px',
                        border: auditGrade === grade ? '2px solid #0369a1' : '1px solid #cbd5e1',
                        backgroundColor: auditGrade === grade ? '#e0f2fe' : '#ffffff',
                        color: auditGrade === grade ? '#0369a1' : '#475569',
                        fontWeight: auditGrade === grade ? 800 : 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'परियोजना श्रेणी' : 'Project Category'}
                </label>
                <select
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value as SchemeProjectCategory)}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="POST_HARVEST_STORAGE">Post-Harvest Godown / Storage (गोदाम)</option>
                  <option value="AGRI_INPUT_RETAIL">Agri-Input Retail & Custom Hiring (कृषि इनपुट)</option>
                  <option value="DAIRY_COLD_CHAIN">Dairy Cold Chain / BMC Unit (दुग्ध शीतलन)</option>
                  <option value="CSC_DIGITAL_SERVICES">Common Service Centre / IT (सीएससी/कंप्यूटर)</option>
                  <option value="SOLAR_KUSUM">Solar Kusum Feeder Plant (सौर संयंत्र)</option>
                  <option value="FOOD_PROCESSING">Micro Food Processing Unit (खाद्य प्रसंस्करण)</option>
                </select>
              </div>

              {/* Proposed Project Cost */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'परियोजना लागत (₹ लाख)' : 'Project Cost (₹ Lakhs)'}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={proposedProjectCostLakhs}
                  onChange={(e) => setProposedProjectCostLakhs(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Annual Turnover */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'वार्षिक टर्नओवर (₹ लाख)' : 'Annual Turnover (₹ Lakhs)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={annualTurnoverLakhs}
                  onChange={(e) => setAnnualTurnoverLakhs(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Net Worth */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'समिति नेटवर्थ (₹ लाख)' : 'Net Worth (₹ Lakhs)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={netWorthLakhs}
                  onChange={(e) => setNetWorthLakhs(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Women Member Percentage */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'महिला सदस्य (%)' : 'Women Members (%)'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={womenMemberPercentage}
                    onChange={(e) => setWomenMemberPercentage(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                    style={{
                      width: '80px',
                      minHeight: '44px',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: womenMemberPercentage >= 50 ? '#15803d' : '#64748b' }}>
                    {womenMemberPercentage >= 50
                      ? language === 'HI'
                        ? '✓ युवा सहकार में +1% अतिरिक्त छूट सक्रिय'
                        : '✓ +1% Yuva Sahakar Bonus Active'
                      : language === 'HI'
                      ? '50%+ पर +1% अतिरिक्त ब्याज छूट'
                      : '>=50% unlocks +1% subvention'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheme Evaluation Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
              {language === 'HI' ? 'योजना मूल्यांकन परिणाम (4 राष्ट्रीय योजनाएं):' : 'Scheme Evaluation Results (4 Flagship Schemes):'}
            </div>

            {results.map((result) => {
              const matchedScheme = LOCAL_SCHEMES.find((s) => s.id === result.schemeId);
              if (!matchedScheme) return null;

              return (
                <div
                  key={result.schemeId}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: `2px solid ${result.eligible ? '#16a34a' : '#cbd5e1'}`,
                    padding: '1.15rem',
                    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  {/* Top Bar: Scheme Code, Name & Eligibility Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          {matchedScheme.code}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {language === 'HI' ? matchedScheme.nameHi : matchedScheme.name}
                        </h4>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {matchedScheme.nodalMinistry}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          padding: '0.3rem 0.65rem',
                          borderRadius: '16px',
                          backgroundColor: result.eligible ? '#dcfce7' : '#fee2e2',
                          color: result.eligible ? '#15803d' : '#b91c1c',
                          border: `1px solid ${result.eligible ? '#86efac' : '#fca5a5'}`,
                        }}
                      >
                        {result.eligible
                          ? language === 'HI'
                            ? `✓ पात्र (${result.matchScore}% मेल)`
                            : `✓ ELIGIBLE (${result.matchScore}% Match)`
                          : language === 'HI'
                          ? `⚠️ अपात्र (${result.matchScore}%)`
                          : `⚠️ INELIGIBLE (${result.matchScore}%)`}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.5rem',
                      backgroundColor: '#f8fafc',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{language === 'HI' ? 'पूंजीगत सब्सिडी' : 'Capital Subsidy'}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d' }}>
                        ₹{result.eligibleSubsidyLakhs} L ({matchedScheme.subsidyPercentage}%)
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{language === 'HI' ? 'ब्याज छूट' : 'Interest Subvention'}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>
                        {result.applicableSubventionPercent}% p.a.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{language === 'HI' ? 'शुद्ध प्रभावी ब्याज' : 'Net Effective Rate'}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {result.effectiveInterestRate}% p.a.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{language === 'HI' ? 'वार्षिक ब्याज बचत' : 'Annual Savings'}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d' }}>
                        ₹{result.estimatedAnnualInterestSavingsLakhs} L / yr
                      </div>
                    </div>
                  </div>

                  {/* Reasons / Benefit Explanation */}
                  <div style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.55 }}>
                    {result.reasons.map((r, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{result.eligible ? '•' : '✗'}</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mandatory Document Checklist */}
                  {result.eligible && (
                    <div style={{ marginTop: '0.35rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                        {language === 'HI' ? 'अनिवार्य वैधानिक दस्तावेज चेकलिस्ट:' : 'Mandatory Statutory Document Checklist:'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {(language === 'HI' ? matchedScheme.mandatoryDocumentsHi : matchedScheme.mandatoryDocuments).map(
                          (doc, idx) => {
                            const key = `${matchedScheme.code}-${idx}`;
                            const isChecked = !!checkedDocs[key];

                            return (
                              <label
                                key={key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontSize: '0.8125rem',
                                  color: isChecked ? '#15803d' : '#475569',
                                  cursor: 'pointer',
                                  minHeight: '44px',
                                  padding: '0.2rem 0',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleDocToggle(key)}
                                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <span>{doc}</span>
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
