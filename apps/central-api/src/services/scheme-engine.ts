import type {
  SchemeDefinition,
  SchemeEvaluationInput,
  SchemeEvaluationResult,
  AuditGrade,
} from '@sahakar/types';

export const NATIONAL_SCHEME_CATALOG: SchemeDefinition[] = [
  {
    id: 'scheme-aif-01',
    code: 'AIF',
    name: 'Agriculture Infrastructure Fund (AIF)',
    nodalMinistry: 'Ministry of Agriculture & Farmers Welfare / Ministry of Cooperation',
    category: 'INFRASTRUCTURE',
    maxProjectCostLakhs: 200, // ₹2 Crore cap
    subsidyPercentage: 0,
    maxSubsidyLakhs: 0,
    interestSubventionPercent: 3.0, // 3% per annum for up to 7 years
    eligibleSocietyTypes: ['PACS', 'FPO', 'MULTI_PURPOSE'],
    minimumAuditGrade: 'B',
    mandatoryDocuments: [
      'Detailed Project Report (DPR)',
      'Audited Balance Sheets (Past 3 Years)',
      'Managing Committee Board Resolution',
      'Land Ownership or Long-Term Lease Deed (Min 10 Years)',
      'DCCB / Commercial Bank In-Principle Sanction Letter',
    ],
    description:
      'Provides 3% interest subvention per annum on institutional loans up to ₹2 Crore for post-harvest management and community farming assets.',
    tenureYears: 7,
    moratoriumMonths: 24,
  },
  {
    id: 'scheme-pmfme-01',
    code: 'PMFME',
    name: 'PM Formalisation of Micro food processing Enterprises Scheme',
    nodalMinistry: 'Ministry of Food Processing Industries (MoFPI)',
    category: 'PROCESSING',
    maxProjectCostLakhs: 40,
    subsidyPercentage: 35.0, // 35% credit-linked capital subsidy
    maxSubsidyLakhs: 10.0, // Capped at ₹10 Lakhs
    interestSubventionPercent: 0,
    eligibleSocietyTypes: ['PACS', 'FPO', 'MULTI_PURPOSE', 'DAIRY'],
    minimumAuditGrade: 'B',
    mandatoryDocuments: [
      'Micro-Enterprise Business Plan & Project Report',
      'FSSAI Registration or Food Safety License Application',
      'Member Farmer Procurement & Sourcing Plan',
      'Chartered Accountant Net Worth Certificate',
      'Bank Loan Appraisal Document',
    ],
    description:
      'Provides 35% credit-linked capital subsidy up to ₹10 Lakhs for micro-food processing units, grading, packaging, and sorting lines.',
    tenureYears: 5,
    moratoriumMonths: 6,
  },
  {
    id: 'scheme-yuva-sahakar-01',
    code: 'YUVA_SAHAKAR',
    name: 'Yuva Sahakar — Cooperative Enterprise Support Scheme',
    nodalMinistry: 'National Cooperative Development Corporation (NCDC)',
    category: 'YOUTH_STARTUP',
    maxProjectCostLakhs: 300, // ₹3 Crore cap
    subsidyPercentage: 0,
    maxSubsidyLakhs: 0,
    interestSubventionPercent: 2.0, // 2% base subvention (+1% for women cooperatives)
    eligibleSocietyTypes: ['PACS', 'DAIRY', 'FISHERY', 'MULTI_PURPOSE', 'FPO'],
    minimumAuditGrade: 'B',
    mandatoryDocuments: [
      'NCDC Innovation & Diversification Project Proposal',
      'Managing Committee Youth / Women Member Roster (Min 25% Youth)',
      'Cooperative Society Registration & Model Bye-Laws',
      'Statutory Audit Report (Last Financial Year)',
      'State Cooperative Registrar / NCDC Endorsement',
    ],
    description:
      'Encourages youth-led and diversified cooperative ventures with 2% interest subvention (3% for women-majority societies) on loans up to ₹3 Crore.',
    tenureYears: 5,
    moratoriumMonths: 12,
  },
  {
    id: 'scheme-pacs-comp-01',
    code: 'PACS_COMPUTERIZATION',
    name: 'Centrally Sponsored Project for Computerization of PACS',
    nodalMinistry: 'Ministry of Cooperation',
    category: 'COMPUTERIZATION',
    maxProjectCostLakhs: 4.0, // ₹3.91 to ₹4.0 Lakhs per PACS
    subsidyPercentage: 100.0, // 100% Grant funded
    maxSubsidyLakhs: 4.0,
    interestSubventionPercent: 0,
    eligibleSocietyTypes: ['PACS'],
    minimumAuditGrade: 'C', // All functional PACS eligible
    mandatoryDocuments: [
      'PACS Unique Identification Number (National Database UID)',
      'Day Book & Member Share Capital Register Audit Verification',
      'Broadband / 4G Internet Connectivity Readiness Certificate',
      'Designated Computer Operator / Trainee NCCT Certification Roster',
      'NABARD State Level Implementation Committee (SLIC) Onboarding Approval',
    ],
    description:
      '100% centrally sponsored grant covering enterprise ERP software, biometric hardware, cloud integration, and training for PACS transformation into CSCs.',
    tenureYears: 0,
    moratoriumMonths: 0,
  },
];

const GRADE_HIERARCHY: Record<AuditGrade, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

const SCHEME_CATEGORY_MAP: Record<string, string[]> = {
  AIF: ['POST_HARVEST_STORAGE', 'DAIRY_COLD_CHAIN', 'AGRI_INPUT_RETAIL', 'SOLAR_KUSUM'],
  PMFME: ['FOOD_PROCESSING', 'AGRI_INPUT_RETAIL'],
  YUVA_SAHAKAR: [
    'SOLAR_KUSUM',
    'CSC_DIGITAL_SERVICES',
    'FOOD_PROCESSING',
    'DAIRY_COLD_CHAIN',
    'POST_HARVEST_STORAGE',
  ],
  PACS_COMPUTERIZATION: ['CSC_DIGITAL_SERVICES'],
};

export class SchemeAdvisoryEngine {
  private catalog: SchemeDefinition[];

  constructor(catalog: SchemeDefinition[] = NATIONAL_SCHEME_CATALOG) {
    this.catalog = catalog;
  }

  public getCatalog(): SchemeDefinition[] {
    return this.catalog;
  }

  public getSchemeById(id: string): SchemeDefinition | undefined {
    return this.catalog.find((s) => s.id === id || s.code === id);
  }

  public evaluateScheme(
    scheme: SchemeDefinition,
    input: SchemeEvaluationInput
  ): SchemeEvaluationResult {
    const reasons: string[] = [];
    let eligible = true;

    // 1. Society Type Check
    if (!scheme.eligibleSocietyTypes.includes(input.societyType)) {
      eligible = false;
      reasons.push(
        `Society type "${input.societyType}" is not eligible for ${scheme.code}. Eligible types: ${scheme.eligibleSocietyTypes.join(', ')}.`
      );
    }

    // 2. Audit Grade Check
    const minGradeRank = GRADE_HIERARCHY[scheme.minimumAuditGrade];
    const actualGradeRank = GRADE_HIERARCHY[input.auditGrade] || 0;
    if (actualGradeRank < minGradeRank) {
      eligible = false;
      reasons.push(
        `Audit Grade "${input.auditGrade}" does not meet minimum regulatory requirement of Grade "${scheme.minimumAuditGrade}".`
      );
    }

    // 3. Project Category Check
    const allowedCategories = SCHEME_CATEGORY_MAP[scheme.code] || [];
    if (allowedCategories.length > 0 && !allowedCategories.includes(input.projectCategory)) {
      eligible = false;
      reasons.push(
        `Project category "${input.projectCategory}" is not supported under ${scheme.code}. Eligible categories: ${allowedCategories.join(', ')}.`
      );
    }

    // 4. Proposed Cost Sanity
    if (input.proposedProjectCostLakhs <= 0) {
      eligible = false;
      reasons.push('Proposed project cost must be greater than zero.');
    }

    // 5. Subsidy Calculation
    const eligibleCost = Math.min(input.proposedProjectCostLakhs, scheme.maxProjectCostLakhs);
    const rawSubsidy = (eligibleCost * scheme.subsidyPercentage) / 100;
    const eligibleSubsidyLakhs = Math.round(Math.min(rawSubsidy, scheme.maxSubsidyLakhs) * 100) / 100;

    // 6. Interest Subvention Calculation
    let applicableSubventionPercent = scheme.interestSubventionPercent;
    // Yuva Sahakar 1% bonus for women-majority cooperatives
    if (scheme.code === 'YUVA_SAHAKAR' && input.womenMemberPercentage >= 50) {
      applicableSubventionPercent = Math.min(3.0, applicableSubventionPercent + 1.0);
    }

    const baseInterestRate = 9.0; // Standard NABARD/DCCB lending benchmark rate
    const effectiveInterestRate =
      scheme.subsidyPercentage === 100
        ? 0.0
        : Math.max(0, Math.round((baseInterestRate - applicableSubventionPercent) * 100) / 100);

    const loanPrincipal = Math.max(0, input.proposedProjectCostLakhs - eligibleSubsidyLakhs);
    const subventionEligiblePrincipal = Math.min(loanPrincipal, scheme.maxProjectCostLakhs);
    const estimatedAnnualInterestSavingsLakhs =
      Math.round(subventionEligiblePrincipal * (applicableSubventionPercent / 100) * 100) / 100;

    // 7. Deterministic Match Score (0 to 100)
    let matchScore = 0;
    if (scheme.eligibleSocietyTypes.includes(input.societyType)) matchScore += 25;
    if (allowedCategories.includes(input.projectCategory)) matchScore += 25;
    if (actualGradeRank >= minGradeRank) {
      matchScore += 25;
      if (input.auditGrade === 'A') matchScore += 5; // Extra Grade A bonus
    }
    if (input.annualTurnoverLakhs > 0 && input.netWorthLakhs > 0) matchScore += 10;
    if (input.womenMemberPercentage >= 20) matchScore += 10;

    if (!eligible) {
      matchScore = Math.min(45, matchScore);
    } else {
      matchScore = Math.min(100, Math.max(70, matchScore));
      reasons.push(
        `Fully compliant with ${scheme.name} guidelines. Project eligible for ₹${eligibleSubsidyLakhs} L subsidy and ${applicableSubventionPercent}% interest subvention.`
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
  }

  public evaluateAllSchemes(input: SchemeEvaluationInput): SchemeEvaluationResult[] {
    return this.catalog
      .map((scheme) => this.evaluateScheme(scheme, input))
      .sort((a, b) => b.matchScore - a.matchScore);
  }
}

export const schemeAdvisoryEngine = new SchemeAdvisoryEngine();
