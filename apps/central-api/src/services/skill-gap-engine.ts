/**
 * Sahakar Edge — Cooperative Skill Taxonomy & Skill-Gap Analysis Engine
 * 
 * Performs deterministic gap partitioning, semantic vector cosine matching,
 * and institutional sector supply vs demand shortage radar analytics.
 */

import type {
  CooperativeSkillCategory,
  CooperativeSkillItem,
  RelatedSkillMatch,
  SkillGapAnalysisResult,
  SectorSkillShortageRow,
  SectorSkillShortageRadar,
} from '@sahakar/types';

/**
 * Domain-curated 8-dimensional unit embeddings for canonical cooperative skills:
 * Dimensions: [Accounting, Credit/KCC, Storage/ColdChain, Legal/Bylaws, ERP/Cloud, Governance, MemberRelations, Audit]
 */
export const NCCT_SKILL_EMBEDDING_MAP: Record<string, number[]> = {
  // Financial Accounting Skills
  'skill-pacs-acc-01': [0.85, 0.20, 0.05, 0.15, 0.35, 0.10, 0.10, 0.25], // PACS Double-Entry Accounting
  'skill-cashbook-01': [0.90, 0.15, 0.00, 0.10, 0.30, 0.05, 0.05, 0.20], // Cash Book Balancing & Vouchers
  'skill-audit-pacs-01': [0.70, 0.30, 0.05, 0.40, 0.20, 0.30, 0.05, 0.60], // Statutory Balance Sheet Audit

  // Credit & KCC Appraisal Skills
  'skill-kcc-appraisal-01': [0.25, 0.85, 0.05, 0.25, 0.20, 0.15, 0.20, 0.15], // KCC Appraisal & Scale of Finance
  'skill-loan-recovery-01': [0.20, 0.80, 0.00, 0.35, 0.15, 0.10, 0.30, 0.10], // Cooperative Crop Loan Recovery
  'skill-dccb-portal-01': [0.30, 0.65, 0.00, 0.10, 0.65, 0.05, 0.10, 0.10], // DCCB Credit Banking Portal

  // Commodity Storage & Logistics
  'skill-cold-chain-01': [0.05, 0.05, 0.90, 0.10, 0.20, 0.05, 0.10, 0.05], // Cold Chain & Warehouse Storage
  'skill-fertilizer-pos-01': [0.35, 0.10, 0.70, 0.15, 0.50, 0.05, 0.25, 0.10], // Fertilizer POS & Inventory

  // Statutory & Legal
  'skill-mscs-compliance-01': [0.20, 0.15, 0.05, 0.85, 0.10, 0.45, 0.10, 0.30], // MSCS Act 2023 Statutory Compliance
  'skill-bye-laws-01': [0.15, 0.10, 0.00, 0.90, 0.05, 0.50, 0.15, 0.20], // Model Bye-Laws & AGM Procedures

  // Cloud ERP Operations
  'skill-erp-cloud-01': [0.40, 0.25, 0.20, 0.10, 0.90, 0.05, 0.10, 0.15], // National PACS Cloud ERP
};

export class SkillGapEngine {
  /**
   * Computes mathematical cosine similarity between two numeric vectors:
   * cos(u, v) = (u . v) / (||u|| * ||v||)
   */
  public calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0.0;

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0.0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.round(similarity * 10000) / 10000;
  }

  /**
   * Evaluates deterministic skill gaps and finds related semantic matches (cosine >= 0.40).
   */
  public evaluateSkillGap(params: {
    jobId: string;
    jobTitle: string;
    requiredSkills: CooperativeSkillItem[];
    acquiredSkills: CooperativeSkillItem[];
    embeddingDictionary?: Record<string, number[]>;
  }): SkillGapAnalysisResult {
    const { jobId, jobTitle, requiredSkills, acquiredSkills } = params;
    const embeddings = params.embeddingDictionary || NCCT_SKILL_EMBEDDING_MAP;

    const acquiredIdSet = new Set(acquiredSkills.map((s) => s.id));
    const acquired = requiredSkills.filter((req) => acquiredIdSet.has(req.id));
    const gap = requiredSkills.filter((req) => !acquiredIdSet.has(req.id));

    const relatedMatches: RelatedSkillMatch[] = [];
    let partialCreditCount = 0;

    for (const gapSkill of gap) {
      const gapVec = embeddings[gapSkill.id];
      if (!gapVec) continue;

      let bestMatchSkill: CooperativeSkillItem | null = null;
      let highestSimilarity = -1;

      for (const acqSkill of acquiredSkills) {
        const acqVec = embeddings[acqSkill.id];
        if (!acqVec) continue;

        const sim = this.calculateCosineSimilarity(gapVec, acqVec);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
          bestMatchSkill = acqSkill;
        }
      }

      // Semantic partial-credit threshold: >= 0.40
      if (bestMatchSkill && highestSimilarity >= 0.40) {
        relatedMatches.push({
          gapSkillId: gapSkill.id,
          gapSkillName: gapSkill.name,
          relatedAcquiredSkillId: bestMatchSkill.id,
          relatedAcquiredSkillName: bestMatchSkill.name,
          similarityScore: highestSimilarity,
        });
        partialCreditCount += 0.5; // Award 50% partial credit for adjacent competency
      }
    }

    const totalReq = requiredSkills.length;
    const effectiveScore = acquired.length + partialCreditCount;
    const matchPercentage =
      totalReq > 0 ? Math.min(100.0, Math.round((effectiveScore / totalReq) * 10000) / 100) : 100.0;

    const suggestedRemediationSequence = gap.map((gapSkill, index) => {
      const hasAdjacent = relatedMatches.some((rm) => rm.gapSkillId === gapSkill.id);
      return {
        rank: index + 1,
        skillId: gapSkill.id,
        skillName: gapSkill.name,
        remediationReason: hasAdjacent
          ? 'Candidate possesses adjacent foundational competency; short bridge course recommended.'
          : 'Core prerequisite skill missing from trainee profile; full module training required.',
      };
    });

    return {
      jobId,
      jobTitle,
      acquiredSkills: acquired,
      gapSkills: gap,
      relatedSkills: relatedMatches,
      matchPercentage,
      suggestedRemediationSequence,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Compiles sector-wide supply vs demand shortage radar:
   * shortage = demand - supply
   */
  public computeSectorShortageRadar(params: {
    skillsCatalog: CooperativeSkillItem[];
    jobs: Array<{ id: string; requiredSkillIds: string[] }>;
    certifiedTrainees: Array<{ traineeId: string; certifiedSkillIds: string[] }>;
  }): SectorSkillShortageRow[] {
    const { skillsCatalog, jobs, certifiedTrainees } = params;

    const demandMap = new Map<string, number>();
    for (const job of jobs) {
      for (const skillId of job.requiredSkillIds) {
        demandMap.set(skillId, (demandMap.get(skillId) || 0) + 1);
      }
    }

    const supplyMap = new Map<string, number>();
    for (const trainee of certifiedTrainees) {
      for (const skillId of trainee.certifiedSkillIds) {
        supplyMap.set(skillId, (supplyMap.get(skillId) || 0) + 1);
      }
    }

    const rows: SectorSkillShortageRow[] = skillsCatalog.map((skill) => {
      const demand = demandMap.get(skill.id) || 0;
      const supply = supplyMap.get(skill.id) || 0;
      const netShortage = demand - supply;

      return {
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        jobDemandCount: demand,
        traineeSupplyCount: supply,
        netShortage,
      };
    });

    // Sort by descending shortage (highest deficit first)
    return rows.sort((a, b) => b.netShortage - a.netShortage);
  }
}

export const skillGapEngine = new SkillGapEngine();
