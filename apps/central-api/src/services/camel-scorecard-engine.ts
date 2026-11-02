import type {
  PacsFinancialMetrics,
  CamelDimensionScores,
  DiagnosticAlert,
  PacsHealthScorecard,
  AuditGrade,
} from '@sahakar/types';

export class CamelScorecardEngine {
  /**
   * Evaluates a cooperative's financial and governance metrics across all 5 CAMEL dimensions,
   * determining regulatory ratios, audit grades, and statutory remedial directives.
   */
  public evaluateScorecard(metrics: PacsFinancialMetrics): PacsHealthScorecard {
    const alerts: DiagnosticAlert[] = [];

    // =========================================================================
    // 1. CAPITAL ADEQUACY (0 - 20 Points)
    // Formula: Own Funds (Share Capital + Reserves) / Total Advances * 100
    // =========================================================================
    const ownFunds = metrics.shareCapitalLakhs + metrics.reservesAndSurplusLakhs;
    const capitalAdequacyRatio =
      metrics.totalAdvancesLakhs > 0
        ? Math.round((ownFunds / metrics.totalAdvancesLakhs) * 10000) / 100
        : 100.0;

    let capitalScore = 0;
    if (capitalAdequacyRatio >= 15.0) {
      capitalScore = 20.0;
    } else if (capitalAdequacyRatio >= 12.0) {
      capitalScore = 16.0 + ((capitalAdequacyRatio - 12.0) / 3.0) * 4.0;
    } else if (capitalAdequacyRatio >= 9.0) {
      capitalScore = 12.0 + ((capitalAdequacyRatio - 9.0) / 3.0) * 4.0;
    } else if (capitalAdequacyRatio >= 6.0) {
      capitalScore = 6.0 + ((capitalAdequacyRatio - 6.0) / 3.0) * 6.0;
    } else {
      capitalScore = Math.max(0, (capitalAdequacyRatio / 6.0) * 6.0);
    }
    capitalScore = Math.round(capitalScore * 10) / 10;

    if (capitalAdequacyRatio < 9.0) {
      alerts.push({
        severity: capitalAdequacyRatio < 6.0 ? 'CRITICAL' : 'WARNING',
        title: `Capital Adequacy Ratio Below Benchmark (${capitalAdequacyRatio.toFixed(1)}% < 9.0%)`,
        description:
          'Own funds are insufficient relative to risk-weighted credit disbursements, increasing insolvency vulnerability.',
        statutoryDirective:
          'Section 45 MSCS Act: Launch compulsory member equity mobilization campaign and allocate min 25% of net surplus to the Statutory Reserve Fund.',
      });
    }

    // =========================================================================
    // 2. ASSET QUALITY (0 - 25 Points)
    // Formula: Gross NPA / Total Advances * 100
    // =========================================================================
    const grossNpaPercentage =
      metrics.totalAdvancesLakhs > 0
        ? Math.round((metrics.grossNpaLakhs / metrics.totalAdvancesLakhs) * 10000) / 100
        : 0.0;

    let assetQualityScore = 0;
    if (grossNpaPercentage <= 2.0) {
      assetQualityScore = 25.0;
    } else if (grossNpaPercentage <= 5.0) {
      assetQualityScore = 25.0 - ((grossNpaPercentage - 2.0) / 3.0) * 5.0;
    } else if (grossNpaPercentage <= 10.0) {
      assetQualityScore = 20.0 - ((grossNpaPercentage - 5.0) / 5.0) * 8.0;
    } else if (grossNpaPercentage <= 20.0) {
      assetQualityScore = 12.0 - ((grossNpaPercentage - 10.0) / 10.0) * 8.0;
    } else {
      assetQualityScore = Math.max(0, 4.0 - ((grossNpaPercentage - 20.0) / 10.0) * 4.0);
    }
    assetQualityScore = Math.round(assetQualityScore * 10) / 10;

    if (grossNpaPercentage > 7.0) {
      alerts.push({
        severity: grossNpaPercentage > 15.0 ? 'CRITICAL' : 'WARNING',
        title: `Elevated Gross NPA Level (${grossNpaPercentage.toFixed(1)}% > 7.0%)`,
        description:
          'Non-performing agricultural advances threaten liquidity and exceed the NABARD safe prudential ceiling.',
        statutoryDirective:
          'Issue Form 8 Recovery Notices under Cooperative Societies Act, organize joint recovery camps with DCCB, and restructure drought-affected loans.',
      });
    }

    // =========================================================================
    // 3. MANAGEMENT & GOVERNANCE (0 - 20 Points)
    // Formula: governanceChecklistPassed (out of 10) * 2.0
    // =========================================================================
    const managementScore = Math.min(
      20.0,
      Math.max(0, Math.round(metrics.governanceChecklistPassed * 2.0 * 10) / 10)
    );

    if (metrics.governanceChecklistPassed < 7) {
      alerts.push({
        severity: metrics.governanceChecklistPassed < 5 ? 'CRITICAL' : 'WARNING',
        title: `Governance Compliance Deficiencies (${metrics.governanceChecklistPassed}/10 Completed)`,
        description:
          'Statutory non-compliance identified in AGM schedule, member voter lists, or dual-custody cash audit.',
        statutoryDirective:
          'Convene Managing Committee within 14 days, complete pending annual audit, and mandate NCCT governance training for office-bearers.',
      });
    }

    // =========================================================================
    // 4. EARNINGS & PROFITABILITY (0 - 20 Points)
    // Formula: Net Profit Ratio (max 12 pts) + Non-Credit Diversification (max 8 pts)
    // =========================================================================
    const netProfitRatio =
      metrics.totalRevenueLakhs > 0
        ? (metrics.netProfitLakhs / metrics.totalRevenueLakhs) * 100
        : 0.0;
    const nonCreditRevenuePercentage =
      metrics.totalRevenueLakhs > 0
        ? Math.round((metrics.nonCreditRevenueLakhs / metrics.totalRevenueLakhs) * 10000) / 100
        : 0.0;

    let profitPoints = 0;
    if (metrics.netProfitLakhs > 0) {
      profitPoints = netProfitRatio >= 10.0 ? 12.0 : (netProfitRatio / 10.0) * 12.0;
    }

    let diversificationPoints = 0;
    if (nonCreditRevenuePercentage >= 25.0) {
      diversificationPoints = 8.0;
    } else {
      diversificationPoints = (nonCreditRevenuePercentage / 25.0) * 8.0;
    }

    const earningsScore =
      Math.round(Math.min(20.0, Math.max(0, profitPoints + diversificationPoints)) * 10) / 10;

    if (metrics.netProfitLakhs <= 0) {
      alerts.push({
        severity: 'CRITICAL',
        title: `Operating Net Loss Reported (-₹${Math.abs(metrics.netProfitLakhs).toFixed(2)} Lakhs)`,
        description:
          'Operational expenditures and interest payable exceed total revenue realization for the current period.',
        statutoryDirective:
          'Freeze non-essential overheads and activate high-margin non-credit commercial services (Fertilizer distribution, Custom Hiring, CSC digital counters).',
      });
    }

    // =========================================================================
    // 5. LIQUIDITY (0 - 15 Points)
    // Formula: Liquid Assets / Total Deposits * 100
    // =========================================================================
    const liquidityRatio =
      metrics.totalDepositsLakhs > 0
        ? Math.round((metrics.liquidAssetsLakhs / metrics.totalDepositsLakhs) * 10000) / 100
        : 100.0;

    let liquidityScore = 0;
    if (liquidityRatio >= 25.0) {
      liquidityScore = 15.0;
    } else if (liquidityRatio >= 15.0) {
      liquidityScore = 7.5 + ((liquidityRatio - 15.0) / 10.0) * 7.5;
    } else if (liquidityRatio >= 10.0) {
      liquidityScore = 3.0 + ((liquidityRatio - 10.0) / 5.0) * 4.5;
    } else {
      liquidityScore = Math.max(0, (liquidityRatio / 10.0) * 3.0);
    }
    liquidityScore = Math.round(liquidityScore * 10) / 10;

    if (liquidityRatio < 15.0) {
      alerts.push({
        severity: liquidityRatio < 10.0 ? 'CRITICAL' : 'WARNING',
        title: `Liquidity Strain (${liquidityRatio.toFixed(1)}% < 15.0%)`,
        description:
          'Liquid vault cash and DCCB balances are inadequate to comfortably honor member savings deposit withdrawal demands.',
        statutoryDirective:
          'Maintain minimum 20% liquid cash reserves at District Central Cooperative Bank and curtail long-term illiquid commitments.',
      });
    }

    // =========================================================================
    // COMPOSITE HEALTH SCORE, AUDIT GRADE & STATUS
    // =========================================================================
    const camelScores: CamelDimensionScores = {
      capitalScore,
      assetQualityScore,
      managementScore,
      earningsScore,
      liquidityScore,
    };

    const compositeHealthScore =
      Math.round(
        (capitalScore + assetQualityScore + managementScore + earningsScore + liquidityScore) * 10
      ) / 10;

    let auditGrade: AuditGrade = 'D';
    let status: 'THRIVING' | 'STABLE' | 'VULNERABLE' | 'CRITICAL' = 'CRITICAL';

    if (compositeHealthScore >= 85.0) {
      auditGrade = 'A';
      status = 'THRIVING';
    } else if (compositeHealthScore >= 70.0) {
      auditGrade = 'B';
      status = 'STABLE';
    } else if (compositeHealthScore >= 50.0) {
      auditGrade = 'C';
      status = 'VULNERABLE';
    } else {
      auditGrade = 'D';
      status = 'CRITICAL';
    }

    if (alerts.length === 0) {
      alerts.push({
        severity: 'INFO',
        title: 'Prudential Compliance Maintained',
        description:
          'Cooperative society operates comfortably within all NABARD & RBI regulatory benchmarks.',
        statutoryDirective:
          'Eligible for unconditional apex refinancing, NABARD infrastructure grants, and multi-service expansion.',
      });
    }

    return {
      metrics,
      capitalAdequacyRatio,
      grossNpaPercentage,
      liquidityRatio,
      nonCreditRevenuePercentage,
      camelScores,
      compositeHealthScore,
      auditGrade,
      status,
      diagnosticAlerts: alerts,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const camelScorecardEngine = new CamelScorecardEngine();
