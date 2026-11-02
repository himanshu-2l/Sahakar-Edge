/**
 * Sahakar Edge — Predictive Dropout-Risk Analytics Engine
 * 
 * Computes transparent 4-factor retention heuristics, assigns risk tiers,
 * and generates actionable statutory directives for institutional directors.
 */

import type {
  DropoutRiskTier,
  DropoutRiskFactors,
  DropoutRiskAssessment,
  DropoutRiskTriageSummary,
} from '@sahakar/types';

export interface CohortRiskTriageSummary {
  programmeId: string;
  totalAssessed: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  highRiskPercentage: number;
  flaggedRoster: DropoutRiskAssessment[];
}

export class DropoutRiskEngine {
  /**
   * Evaluates individual trainee dropout risk using the 4-factor heuristic.
   */
  public evaluateDropoutRisk(params: {
    traineeId: string;
    traineeName: string;
    programmeId: string;
    programmeTitle?: string;
    completionRate: number; // 0.00 to 1.00
    attendanceRate: number; // 0.00 to 1.00
    daysSinceLastActivity: number;
    failedAssessmentsCount: number;
  }): DropoutRiskAssessment {
    const {
      traineeId,
      traineeName,
      programmeId,
      programmeTitle,
      completionRate,
      attendanceRate,
      daysSinceLastActivity,
      failedAssessmentsCount,
    } = params;

    let score = 0;

    // Factor 1: Lesson completion < 25% (+40 points)
    const lowLessonCompletion = completionRate < 0.25;
    if (lowLessonCompletion) {
      score += 40;
    }

    // Factor 2: Attendance < 50% (+30 points)
    const lowAttendance = attendanceRate < 0.50;
    if (lowAttendance) {
      score += 30;
    }

    // Factor 3: Dormancy > 14 days without activity (+20 points)
    const staleEngagement = daysSinceLastActivity > 14;
    if (staleEngagement) {
      score += 20;
    }

    // Factor 4: Assessment failures: +10 pts per failure (capped at 30 points)
    const failuresCount = Math.max(0, failedAssessmentsCount);
    const assessmentFailures = Math.min(failuresCount, 3) * 10;
    score += assessmentFailures;

    // Score bounded strictly between 0 and 100
    const riskScore = Math.max(0, Math.min(100, score));

    // Risk Tier Assignment
    let riskTier: DropoutRiskTier = 'LOW';
    let recommendedIntervention = '';

    if (riskScore >= 60) {
      riskTier = 'HIGH';
      recommendedIntervention =
        'Critical disengagement risk: Institute Course Director must initiate mandatory faculty academic review, mentor outreach, and PACS chairperson alert.';
    } else if (riskScore >= 30) {
      riskTier = 'MEDIUM';
      recommendedIntervention =
        'Moderate pacing lag: Issue automated SMS/PWA reminder, assign peer study group, and schedule remedial lab exercise.';
    } else {
      riskTier = 'LOW';
      recommendedIntervention =
        'Satisfactory trajectory: Learner is progressing within standard NCCT training parameters.';
    }

    return {
      traineeId,
      traineeName,
      programmeId,
      programmeTitle,
      riskScore,
      riskTier,
      riskFactors: {
        lowLessonCompletion,
        lowAttendance,
        staleEngagement,
        assessmentFailures,
      },
      recommendedIntervention,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compiles cohort-wide risk triage radar across all approved nominees in a programme.
   */
  public triageCohortRisk(
    programmeId: string,
    trainees: Array<{
      traineeId: string;
      traineeName: string;
      completionRate: number;
      attendanceRate: number;
      daysSinceLastActivity: number;
      failedAssessmentsCount: number;
    }>
  ): CohortRiskTriageSummary {
    const assessments = trainees.map((t) =>
      this.evaluateDropoutRisk({
        traineeId: t.traineeId,
        traineeName: t.traineeName,
        programmeId,
        completionRate: t.completionRate,
        attendanceRate: t.attendanceRate,
        daysSinceLastActivity: t.daysSinceLastActivity,
        failedAssessmentsCount: t.failedAssessmentsCount,
      })
    );

    const highRisk = assessments.filter((a) => a.riskTier === 'HIGH');
    const mediumRisk = assessments.filter((a) => a.riskTier === 'MEDIUM');
    const lowRisk = assessments.filter((a) => a.riskTier === 'LOW');

    const total = assessments.length;
    const highRiskPercentage = total > 0 ? Math.round((highRisk.length / total) * 10000) / 100 : 0.0;

    // Flagged roster: sorted by risk score descending
    const flaggedRoster = [...highRisk, ...mediumRisk].sort((a, b) => b.riskScore - a.riskScore);

    return {
      programmeId,
      totalAssessed: total,
      highRiskCount: highRisk.length,
      mediumRiskCount: mediumRisk.length,
      lowRiskCount: lowRisk.length,
      highRiskPercentage,
      flaggedRoster,
    };
  }
}

export const dropoutRiskEngine = new DropoutRiskEngine();
