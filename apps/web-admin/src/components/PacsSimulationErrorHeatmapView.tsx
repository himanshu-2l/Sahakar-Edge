'use client';

import React, { useState } from 'react';
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
  HeatmapIcon,
  AlertTriangleIcon,
  CheckIcon,
  RefreshIcon,
  CloseIcon,
} from './icons';

interface HeatmapCell {
  voucherCode: string;
  voucherName: string;
  expectedType: 'RECEIPT' | 'PAYMENT';
  amount: number;
  errorType: string;
  errorLabel: string;
  percentage: number;
  affectedCount: number; // out of 3,840 attempts
  consequence: string;
  misconception: string;
  pedagogicalDirective: string;
}

const VOUCHERS = [
  { code: 'CRV-081', name: 'Fertilizer Cash Sale', type: 'RECEIPT' as const, amount: 18400 },
  { code: 'CPV-104', name: 'KCC Crop Loan Disbursement', type: 'PAYMENT' as const, amount: 25000 },
  { code: 'CRV-082', name: 'Member Savings Deposit', type: 'RECEIPT' as const, amount: 8500 },
  { code: 'CPV-105', name: 'Office Utility & Contingency', type: 'PAYMENT' as const, amount: 3900 },
  { code: 'CRV-083', name: 'Ordinary Share Capital Admission', type: 'RECEIPT' as const, amount: 1000 },
];

const ERROR_COLUMNS = [
  { key: 'DEBIT_CREDIT', label: 'Debit/Credit Inversion' },
  { key: 'CLASSIFICATION', label: 'Account Classification' },
  { key: 'ARITHMETIC', label: 'Arithmetic Variance' },
  { key: 'CHRONOLOGY', label: 'Chronology Sequence' },
  { key: 'NARRATION_KYC', label: 'Narration / KYC Defect' },
];

// Matrix distribution across 3,840 student attempts
const HEATMAP_DATA: Record<string, Record<string, HeatmapCell>> = {
  'CRV-081': {
    DEBIT_CREDIT: {
      voucherCode: 'CRV-081',
      voucherName: 'Fertilizer Cash Sale (₹18,400)',
      expectedType: 'RECEIPT',
      amount: 18400,
      errorType: 'DEBIT_CREDIT',
      errorLabel: 'Debit/Credit Inversion',
      percentage: 14.2,
      affectedCount: 545,
      consequence: 'Erroneously debits cashbook as an outflow instead of a receipt, understating vault cash by ₹36,800.',
      misconception: 'Student equates physical surrender of fertilizer bags with a cash expenditure.',
      pedagogicalDirective: 'Prescribe Module 2 Lab 2: Fertilizer Inventory Ledger vs Cashbook Receipt Balancing.',
    },
    CLASSIFICATION: {
      voucherCode: 'CRV-081',
      voucherName: 'Fertilizer Cash Sale (₹18,400)',
      expectedType: 'RECEIPT',
      amount: 18400,
      errorType: 'CLASSIFICATION',
      errorLabel: 'Account Classification',
      percentage: 8.6,
      affectedCount: 330,
      consequence: 'Misclassifies trade sales as share capital contribution.',
      misconception: 'Fails to differentiate trading receipt from equity capital.',
      pedagogicalDirective: 'Review Trading Account vs Capital Account chart of accounts.',
    },
    ARITHMETIC: {
      voucherCode: 'CRV-081',
      voucherName: 'Fertilizer Cash Sale (₹18,400)',
      expectedType: 'RECEIPT',
      amount: 18400,
      errorType: 'ARITHMETIC',
      errorLabel: 'Arithmetic Variance',
      percentage: 6.2,
      affectedCount: 238,
      consequence: 'Transcription transposition error (e.g. ₹14,800 instead of ₹18,400).',
      misconception: 'Manual tally calculation error without running checksum.',
      pedagogicalDirective: 'Reinforce double-entry digit transposition check (Rule of 9).',
    },
    CHRONOLOGY: {
      voucherCode: 'CRV-081',
      voucherName: 'Fertilizer Cash Sale (₹18,400)',
      expectedType: 'RECEIPT',
      amount: 18400,
      errorType: 'CHRONOLOGY',
      errorLabel: 'Chronology Sequence',
      percentage: 4.1,
      affectedCount: 157,
      consequence: 'Posted after day-end closing cutoff.',
      misconception: 'Disregards sequential timestamping of daily transactions.',
      pedagogicalDirective: 'Mandate strict time-sequence voucher logging.',
    },
    NARRATION_KYC: {
      voucherCode: 'CRV-081',
      voucherName: 'Fertilizer Cash Sale (₹18,400)',
      expectedType: 'RECEIPT',
      amount: 18400,
      errorType: 'NARRATION_KYC',
      errorLabel: 'Narration / KYC Defect',
      percentage: 3.5,
      affectedCount: 134,
      consequence: 'Missing fertilizer lot number or farmer member ID.',
      misconception: 'Considers narration secondary rather than statutory.',
      pedagogicalDirective: 'Mandate complete statutory voucher narration practice.',
    },
  },
  'CPV-104': {
    DEBIT_CREDIT: {
      voucherCode: 'CPV-104',
      voucherName: 'KCC Crop Loan Disbursement (₹25,000)',
      expectedType: 'PAYMENT',
      amount: 25000,
      errorType: 'DEBIT_CREDIT',
      errorLabel: 'Debit/Credit Inversion',
      percentage: 42.6, // TOP COGNITIVE STUMBLING BLOCK
      affectedCount: 1636,
      consequence: 'Debiting cashbook for a loan disbursement creates an immediate -₹50,000 false cash variance.',
      misconception: 'Cognitive bias: Student recalls that "loan asset has debit balance" and erroneously debits cash.',
      pedagogicalDirective: 'CRITICAL DIRECTIVE: Deploy 30-min opposing T-Account Drill (Vault Cash Credit ⇄ Loan Asset Debit).',
    },
    CLASSIFICATION: {
      voucherCode: 'CPV-104',
      voucherName: 'KCC Crop Loan Disbursement (₹25,000)',
      expectedType: 'PAYMENT',
      amount: 25000,
      errorType: 'CLASSIFICATION',
      errorLabel: 'Account Classification',
      percentage: 12.4,
      affectedCount: 476,
      consequence: 'Posts agricultural credit loan under operating expenses.',
      misconception: 'Confuses asset creation with operational expenditure.',
      pedagogicalDirective: 'Review Balance Sheet asset classification under Banking Regulation Act.',
    },
    ARITHMETIC: {
      voucherCode: 'CPV-104',
      voucherName: 'KCC Crop Loan Disbursement (₹25,000)',
      expectedType: 'PAYMENT',
      amount: 25000,
      errorType: 'ARITHMETIC',
      errorLabel: 'Arithmetic Variance',
      percentage: 28.5,
      affectedCount: 1094,
      consequence: 'Net closing cash variance exceeds physical vault count of ₹44,000.',
      misconception: 'Compounded tally arithmetic errors following inversion.',
      pedagogicalDirective: 'Drill Day-End Closing Formula: Opening + Receipts - Disbursements = Closing.',
    },
    CHRONOLOGY: {
      voucherCode: 'CPV-104',
      voucherName: 'KCC Crop Loan Disbursement (₹25,000)',
      expectedType: 'PAYMENT',
      amount: 25000,
      errorType: 'CHRONOLOGY',
      errorLabel: 'Chronology Sequence',
      percentage: 5.2,
      affectedCount: 200,
      consequence: 'Disbursement logged before loan committee sanction approval.',
      misconception: 'Procedural order violation in loan release workflow.',
      pedagogicalDirective: 'Mandate loan sanction resolution verification step.',
    },
    NARRATION_KYC: {
      voucherCode: 'CPV-104',
      voucherName: 'KCC Crop Loan Disbursement (₹25,000)',
      expectedType: 'PAYMENT',
      amount: 25000,
      errorType: 'NARRATION_KYC',
      errorLabel: 'Narration / KYC Defect',
      percentage: 9.8,
      affectedCount: 376,
      consequence: 'Omission of KCC passbook serial and land survey number.',
      misconception: 'Lacks diligence in agrarian KYC documentation.',
      pedagogicalDirective: 'Audit drill on NABARD KCC documentation standards.',
    },
  },
  'CRV-082': {
    DEBIT_CREDIT: {
      voucherCode: 'CRV-082',
      voucherName: 'Member Savings Deposit (₹8,500)',
      expectedType: 'RECEIPT',
      amount: 8500,
      errorType: 'DEBIT_CREDIT',
      errorLabel: 'Debit/Credit Inversion',
      percentage: 22.8,
      affectedCount: 875,
      consequence: 'Crediting deposit receipt treats incoming money as an outflow, creating ₹17,000 discrepancy.',
      misconception: 'Confuses the society liability perspective with the member passbook perspective.',
      pedagogicalDirective: 'Clarify Cashbook vs General Ledger perspective in PACS accounting.',
    },
    CLASSIFICATION: {
      voucherCode: 'CRV-082',
      voucherName: 'Member Savings Deposit (₹8,500)',
      expectedType: 'RECEIPT',
      amount: 8500,
      errorType: 'CLASSIFICATION',
      errorLabel: 'Account Classification',
      percentage: 6.4,
      affectedCount: 246,
      consequence: 'Classifies deposit as operating revenue rather than liability.',
      misconception: 'Fails to recognize member deposits as repayable liabilities.',
      pedagogicalDirective: 'Review PACS balance sheet liability structure.',
    },
    ARITHMETIC: {
      voucherCode: 'CRV-082',
      voucherName: 'Member Savings Deposit (₹8,500)',
      expectedType: 'RECEIPT',
      amount: 8500,
      errorType: 'ARITHMETIC',
      errorLabel: 'Arithmetic Variance',
      percentage: 14.1,
      affectedCount: 541,
      consequence: 'Tally error on cumulative savings receipts.',
      misconception: 'Addition error on subtotal columns.',
      pedagogicalDirective: 'Run automated sub-total verification checks.',
    },
    CHRONOLOGY: {
      voucherCode: 'CRV-082',
      voucherName: 'Member Savings Deposit (₹8,500)',
      expectedType: 'RECEIPT',
      amount: 8500,
      errorType: 'CHRONOLOGY',
      errorLabel: 'Chronology Sequence',
      percentage: 3.2,
      affectedCount: 123,
      consequence: 'Out of sequence deposit entry.',
      misconception: 'Batch processing without chronological sorting.',
      pedagogicalDirective: 'Enforce chronological daybook posting.',
    },
    NARRATION_KYC: {
      voucherCode: 'CRV-082',
      voucherName: 'Member Savings Deposit (₹8,500)',
      expectedType: 'RECEIPT',
      amount: 8500,
      errorType: 'NARRATION_KYC',
      errorLabel: 'Narration / KYC Defect',
      percentage: 4.0,
      affectedCount: 154,
      consequence: 'Missing savings account number or depositor signature.',
      misconception: 'Incomplete deposit counter slip verification.',
      pedagogicalDirective: 'Mandatory counter slip validation practice.',
    },
  },
  'CPV-105': {
    DEBIT_CREDIT: {
      voucherCode: 'CPV-105',
      voucherName: 'Office Utility & Contingency (₹3,900)',
      expectedType: 'PAYMENT',
      amount: 3900,
      errorType: 'DEBIT_CREDIT',
      errorLabel: 'Debit/Credit Inversion',
      percentage: 16.4,
      affectedCount: 630,
      consequence: 'Debiting cashbook for utility expense creates ₹7,800 variance.',
      misconception: 'Student treats electricity bill voucher as cash inflow.',
      pedagogicalDirective: 'Practice cash disbursement voucher recognition.',
    },
    CLASSIFICATION: {
      voucherCode: 'CPV-105',
      voucherName: 'Office Utility & Contingency (₹3,900)',
      expectedType: 'PAYMENT',
      amount: 3900,
      errorType: 'CLASSIFICATION',
      errorLabel: 'Account Classification',
      percentage: 31.4, // HIGH MISCLASSIFICATION STUMBLING BLOCK
      affectedCount: 1205,
      consequence: 'Capitalizes operational bills under fixed asset or trading inventory accounts.',
      misconception: 'Confuses physical goods (biometric POS rolls) with trading inventory.',
      pedagogicalDirective: 'Clarify Operating Expenses vs Capital Assets distinction.',
    },
    ARITHMETIC: {
      voucherCode: 'CPV-105',
      voucherName: 'Office Utility & Contingency (₹3,900)',
      expectedType: 'PAYMENT',
      amount: 3900,
      errorType: 'ARITHMETIC',
      errorLabel: 'Arithmetic Variance',
      percentage: 11.8,
      affectedCount: 453,
      consequence: 'Variance in closing expense register.',
      misconception: 'Minor rounding or subtraction errors.',
      pedagogicalDirective: 'Run expense register reconciliation exercises.',
    },
    CHRONOLOGY: {
      voucherCode: 'CPV-105',
      voucherName: 'Office Utility & Contingency (₹3,900)',
      expectedType: 'PAYMENT',
      amount: 3900,
      errorType: 'CHRONOLOGY',
      errorLabel: 'Chronology Sequence',
      percentage: 2.9,
      affectedCount: 111,
      consequence: 'Payment recorded prior to invoice date.',
      misconception: 'Fails to verify bill invoice date before disbursement.',
      pedagogicalDirective: 'Enforce voucher invoice date verification.',
    },
    NARRATION_KYC: {
      voucherCode: 'CPV-105',
      voucherName: 'Office Utility & Contingency (₹3,900)',
      expectedType: 'PAYMENT',
      amount: 3900,
      errorType: 'NARRATION_KYC',
      errorLabel: 'Narration / KYC Defect',
      percentage: 2.1,
      affectedCount: 81,
      consequence: 'Missing vendor GSTIN or electricity consumer ID.',
      misconception: 'Omits utility bill reference numbers in voucher.',
      pedagogicalDirective: 'Statutory compliance check on vendor payments.',
    },
  },
  'CRV-083': {
    DEBIT_CREDIT: {
      voucherCode: 'CRV-083',
      voucherName: 'Ordinary Share Capital Admission (₹1,000)',
      expectedType: 'RECEIPT',
      amount: 1000,
      errorType: 'DEBIT_CREDIT',
      errorLabel: 'Debit/Credit Inversion',
      percentage: 8.2,
      affectedCount: 315,
      consequence: 'Inverts member equity admission receipt.',
      misconception: 'Confuses share refund with share subscription.',
      pedagogicalDirective: 'Review member admission equity receipt flow.',
    },
    CLASSIFICATION: {
      voucherCode: 'CRV-083',
      voucherName: 'Ordinary Share Capital Admission (₹1,000)',
      expectedType: 'RECEIPT',
      amount: 1000,
      errorType: 'CLASSIFICATION',
      errorLabel: 'Account Classification',
      percentage: 18.5,
      affectedCount: 710,
      consequence: 'Credits share capital as miscellaneous non-credit fee revenue.',
      misconception: 'Fails to distinguish member capital from admission fee.',
      pedagogicalDirective: 'Model Bye-Laws training: Share Capital vs Admission Fee.',
    },
    ARITHMETIC: {
      voucherCode: 'CRV-083',
      voucherName: 'Ordinary Share Capital Admission (₹1,000)',
      expectedType: 'RECEIPT',
      amount: 1000,
      errorType: 'ARITHMETIC',
      errorLabel: 'Arithmetic Variance',
      percentage: 4.9,
      affectedCount: 188,
      consequence: 'Share count does not match total amount.',
      misconception: 'Unit share calculation mismatch (e.g. 10 shares @ ₹100).',
      pedagogicalDirective: 'Verify share ledger count reconciliation.',
    },
    CHRONOLOGY: {
      voucherCode: 'CRV-083',
      voucherName: 'Ordinary Share Capital Admission (₹1,000)',
      expectedType: 'RECEIPT',
      amount: 1000,
      errorType: 'CHRONOLOGY',
      errorLabel: 'Chronology Sequence',
      percentage: 1.8,
      affectedCount: 69,
      consequence: 'Share certificate issued prior to board resolution.',
      misconception: 'Procedural sequencing in member admission.',
      pedagogicalDirective: 'Review managing committee member admission cycle.',
    },
    NARRATION_KYC: {
      voucherCode: 'CRV-083',
      voucherName: 'Ordinary Share Capital Admission (₹1,000)',
      expectedType: 'RECEIPT',
      amount: 1000,
      errorType: 'NARRATION_KYC',
      errorLabel: 'Narration / KYC Defect',
      percentage: 7.4,
      affectedCount: 284,
      consequence: 'Missing member Aadhaar/UID or nominee details.',
      misconception: 'Omits mandatory statutory nominee registration.',
      pedagogicalDirective: 'Section 19 MSCS Act nominee registration compliance.',
    },
  },
};

export function PacsSimulationErrorHeatmapView() {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell>(
    HEATMAP_DATA['CPV-104']['DEBIT_CREDIT']
  );
  const [drillDispatchedNotice, setDrillDispatchedNotice] = useState<string | null>(null);

  const getCellColor = (pct: number) => {
    if (pct >= 40.0) return { bg: '#fee2e2', text: '#991b1b', border: '#f87171' };
    if (pct >= 25.0) return { bg: '#ffedd5', text: '#9a3412', border: '#fb923c' };
    if (pct >= 10.0) return { bg: '#fef3c7', text: '#92400e', border: '#fde047' };
    return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
  };

  const handleDispatchDrill = () => {
    setDrillDispatchedNotice(
      `Remedial Drill successfully scheduled for ${selectedCell.affectedCount} affected trainees on Trainee PWA: "${selectedCell.pedagogicalDirective}"`
    );
    setTimeout(() => setDrillDispatchedNotice(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Total Student Lab Runs</div>
          <div style={bentoValueStyle}>3,840 Attempts</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>20 NCCT Training Centers</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>1st-Attempt Tally Rate</div>
          <div style={{ ...bentoValueStyle, color: '#0284c7' }}>48.2%</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>1,851 Passed Without Error</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Average Tally Attempts</div>
          <div style={{ ...bentoValueStyle, color: '#d97706' }}>2.4 Runs</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Before Daybook Balances (₹44,000)</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Top Failure Node</div>
          <div style={{ ...bentoValueStyle, color: '#dc2626' }}>CPV-104 (42.6%)</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>KCC Loan Debit/Credit Inversion</div>
        </div>

        <div style={cardStyle}>
          <div style={bentoHeaderStyle}>Curriculum Diagnostic Status</div>
          <div style={{ ...bentoValueStyle, color: '#16a34a' }}>ACTIVE</div>
          <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Cognitive Remediation Ready</div>
        </div>
      </div>

      {/* 2. Heatmap Intensity Legend & Instructions */}
      <div
        style={{
          ...cardStyle,
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
            5x5 Voucher vs Error-Type Diagnostic Matrix
          </h3>
          <p style={{ fontSize: '0.78rem', color: THEME.colors.inkMuted, margin: '0.15rem 0 0 0' }}>
            Click on any heatmap cell to isolate the student cognitive failure mode, accounting impact, and remediation drill
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted }}>ERROR INTENSITY:</span>
          <span style={{ ...pillBadge('success'), backgroundColor: '#f0fdf4', color: '#166534' }}>&lt; 10% Low</span>
          <span style={{ ...pillBadge('warning'), backgroundColor: '#fef3c7', color: '#92400e' }}>10–25% Moderate</span>
          <span style={{ ...pillBadge('warning'), backgroundColor: '#ffedd5', color: '#9a3412' }}>25–40% High</span>
          <span style={{ ...pillBadge('error'), backgroundColor: '#fee2e2', color: '#991b1b' }}>&gt; 40% Critical</span>
        </div>
      </div>

      {/* Dismissible Notice Alert */}
      {drillDispatchedNotice && (
        <div
          style={{
            backgroundColor: THEME.colors.status.success.bg,
            border: `1px solid ${THEME.colors.status.success.border}`,
            color: THEME.colors.status.success.text,
            padding: '0.85rem 1.25rem',
            borderRadius: THEME.radii.sm,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <CheckIcon size={16} color={THEME.colors.status.success.text} />
            <span>{drillDispatchedNotice}</span>
          </div>
          <button
            onClick={() => setDrillDispatchedNotice(null)}
            aria-label="Dismiss alert"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: THEME.colors.status.success.text,
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* 3. 5x5 Diagnostic Matrix Table */}
      <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ ...tableHeaderStyle, textAlign: 'left', minWidth: '220px' }}>
                Canonical Voucher Code & Description
              </th>
              {ERROR_COLUMNS.map((col) => (
                <th key={col.key} style={{ ...tableHeaderStyle, textAlign: 'center' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VOUCHERS.map((v) => (
              <tr key={v.code} style={{ borderBottom: `1px solid ${THEME.colors.borderHairline}` }}>
                {/* Voucher Meta */}
                <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: THEME.colors.navyPrimary }}>{v.code}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: THEME.colors.inkPrimary }}>{v.name}</div>
                  <div style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
                    ₹{v.amount.toLocaleString('en-IN')} • {v.type === 'RECEIPT' ? 'Receipt (Dr Cash)' : 'Payment (Cr Cash)'}
                  </div>
                </td>

                {/* 5 Error Cells */}
                {ERROR_COLUMNS.map((col) => {
                  const cell = HEATMAP_DATA[v.code][col.key];
                  const colors = getCellColor(cell.percentage);
                  const isSelected =
                    selectedCell.voucherCode === cell.voucherCode && selectedCell.errorType === cell.errorType;

                  return (
                    <td
                      key={col.key}
                      onClick={() => setSelectedCell(cell)}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#1e3a5f' : colors.bg,
                        color: isSelected ? '#ffffff' : colors.text,
                        border: isSelected ? '2px solid #0f172a' : `1px solid ${colors.border}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontFamily: THEME.fonts.mono, fontWeight: 900, fontSize: '1rem' }}>
                        {cell.percentage.toFixed(1)}%
                      </div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: isSelected ? '#93c5fd' : colors.text,
                          marginTop: '0.2rem',
                          fontWeight: 600,
                        }}
                      >
                        {cell.affectedCount} students
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Selected Cell Diagnosis Drawer / Inspector Panel */}
      <div
        style={{
          ...cardStyle,
          border: '1.5px solid #0284c7',
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={pillBadge('apex')}>SELECTED CELL DIAGNOSIS</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                {selectedCell.voucherCode}: {selectedCell.voucherName} ➔ {selectedCell.errorLabel}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: THEME.colors.inkMuted, marginTop: '0.25rem' }}>
              Observed Failure Frequency: <strong style={{ color: '#dc2626' }}>{selectedCell.percentage.toFixed(1)}%</strong> ({selectedCell.affectedCount} of 3,840 student attempts)
            </div>
          </div>

          <button
            onClick={handleDispatchDrill}
            style={{
              ...buttonPrimaryStyle,
              minHeight: '44px',
              backgroundColor: '#0284c7',
            }}
          >
            <span>⚡ Push Automated Remedial Drill to Trainee PWA</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Accounting Impact */}
          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
              Accounting Consequence on Daily Cashbook
            </div>
            <div style={{ fontSize: '0.85rem', color: THEME.colors.inkBody, marginTop: '0.35rem', lineHeight: '1.4' }}>
              {selectedCell.consequence}
            </div>
          </div>

          {/* Cognitive Root Cause */}
          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase' }}>
              Cognitive Misconception & Mental Model Defect
            </div>
            <div style={{ fontSize: '0.85rem', color: THEME.colors.inkBody, marginTop: '0.35rem', lineHeight: '1.4' }}>
              {selectedCell.misconception}
            </div>
          </div>

          {/* Remedial NCCT Action */}
          <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
              NCCT Remedial Curriculum Directive
            </div>
            <div style={{ fontSize: '0.85rem', color: THEME.colors.inkBody, marginTop: '0.35rem', lineHeight: '1.4' }}>
              {selectedCell.pedagogicalDirective}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
