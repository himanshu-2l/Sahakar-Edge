import React, { useState, useMemo } from 'react';
import type {
  PacsDayBookEntry,
  PacsDayEndClosingState,
  PacsAccountCategory,
  PacsTransactionType,
} from '@sahakar/types';

export interface PacsOperationsLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLanguage?: 'EN' | 'HI';
  language?: 'EN' | 'HI';
  traineeId?: string;
  onBalanced?: (closingState: PacsDayEndClosingState) => void;
}

interface DefaultTransaction {
  id: string;
  voucherNumber: string;
  accountHead: string;
  accountHeadHi: string;
  category: PacsAccountCategory;
  amount: number;
  expectedType: PacsTransactionType;
  narration: string;
  narrationHi: string;
}

const DEFAULT_TRANSACTIONS: DefaultTransaction[] = [
  {
    id: 'tx-01-fert-sale',
    voucherNumber: 'CRV-2026-081',
    accountHead: 'Fertilizer Sales Account',
    accountHeadHi: 'उर्वरक नकद बिक्री खाता',
    category: 'INVENTORY',
    amount: 18400,
    expectedType: 'DEBIT',
    narration: 'Cash sale of 40 bags of Urea and 10 bags of DAP to member farmers',
    narrationHi: 'सदस्य किसानों को 40 बोरी यूरिया एवं 10 बोरी डीएपी की नकद बिक्री',
  },
  {
    id: 'tx-02-kcc-disburse',
    voucherNumber: 'CPV-2026-104',
    accountHead: 'Short-Term Crop Loan Asset Account',
    accountHeadHi: 'अल्पकालीन फसली ऋण (केसीसी) खाता',
    category: 'LOAN_ASSET',
    amount: 25000,
    expectedType: 'CREDIT',
    narration: 'Disbursement of Kharif KCC crop loan in cash to Smt. Sunita Devi (Member #M-1042)',
    narrationHi: 'श्रीमती सुनीता देवी (सदस्य #M-1042) को खरीफ केसीसी फसली ऋण नकद वितरण',
  },
  {
    id: 'tx-03-sb-deposit',
    voucherNumber: 'CRV-2026-082',
    accountHead: 'Member Savings Deposit Account',
    accountHeadHi: 'सदस्य बचत जमा खाता',
    category: 'SAVINGS_DEPOSIT',
    amount: 8500,
    expectedType: 'DEBIT',
    narration: 'Cash deposit into member savings account by Shri Ramesh Kumar (Member #M-0891)',
    narrationHi: 'श्री रमेश कुमार (सदस्य #M-0891) द्वारा सदस्य बचत खाते में नकद जमा',
  },
  {
    id: 'tx-04-office-exp',
    voucherNumber: 'CPV-2026-105',
    accountHead: 'Office Contingency & Utility Expense',
    accountHeadHi: 'कार्यालय आकस्मिक एवं बिजली व्यय',
    category: 'OPERATING_EXPENSE',
    amount: 3900,
    expectedType: 'CREDIT',
    narration: 'Electricity bill payment and biometric POS roll stationery expenses',
    narrationHi: 'कार्यालय बिजली बिल भुगतान एवं बायोमेट्रिक पीओएस पेपर रोल स्टेशनरी व्यय',
  },
  {
    id: 'tx-05-share-sub',
    voucherNumber: 'CRV-2026-083',
    accountHead: 'Ordinary Member Share Capital Account',
    accountHeadHi: 'साधारण सदस्य हिस्सा पूंजी खाता',
    category: 'SHARE_CAPITAL',
    amount: 1000,
    expectedType: 'DEBIT',
    narration: 'Admission of new "A" class member Shri Anand Verma (10 shares @ ₹100)',
    narrationHi: 'नए "अ" वर्ग सदस्य श्री आनंद वर्मा का प्रवेश (10 शेयर @ ₹100)',
  },
];

const CROP_PRESETS: Record<string, { nameEn: string; nameHi: string; defaultScale: number }> = {
  PADDY: { nameEn: 'Paddy (Kharif Rice)', nameHi: 'धान (खरीफ चावल)', defaultScale: 42000 },
  WHEAT: { nameEn: 'Wheat (Rabi)', nameHi: 'गेहूं (रबी)', defaultScale: 38000 },
  SOYBEAN: { nameEn: 'Soybean', nameHi: 'सोयाबीन', defaultScale: 35000 },
  MUSTARD: { nameEn: 'Mustard (Rabi Oilseed)', nameHi: 'सरसों (रबी तिलहन)', defaultScale: 30000 },
  COTTON: { nameEn: 'Cotton (Commercial)', nameHi: 'कपास (व्यावसायिक)', defaultScale: 50000 },
  SUGARCANE: { nameEn: 'Sugarcane', nameHi: 'गन्ना (वार्षिक)', defaultScale: 65000 },
};

const FERTILIZER_PRESETS = {
  UREA: { nameEn: 'Urea (45 kg)', nameHi: 'यूरिया (45 किग्रा)', opening: 500, inward: 400, posSold: 650, actual: 249 },
  DAP: { nameEn: 'DAP (50 kg)', nameHi: 'डीएपी (50 किग्रा)', opening: 300, inward: 200, posSold: 380, actual: 119 },
  MOP: { nameEn: 'MOP (50 kg)', nameHi: 'एमओपी (50 किग्रा)', opening: 150, inward: 100, posSold: 180, actual: 70 },
  NPK: { nameEn: 'NPK 12:32:16 (50 kg)', nameHi: 'एनपीके 12:32:16 (50 किग्रा)', opening: 200, inward: 150, posSold: 220, actual: 130 },
};

export const PacsOperationsLabModal: React.FC<PacsOperationsLabModalProps> = ({
  isOpen,
  onClose,
  initialLanguage = 'EN',
  language: langProp,
  traineeId = 'trainee-m2-demo',
  onBalanced,
}) => {
  const [language, setLanguage] = useState<'EN' | 'HI'>(langProp || initialLanguage);
  const [activeTab, setActiveTab] = useState<'DAY_END' | 'KCC_APPRAISAL' | 'FERTILIZER_INVENTORY'>('DAY_END');

  // TAB 1: Day-End Balancing Simulator State
  const [openingCash] = useState<number>(45000);
  const [physicalCash] = useState<number>(44000);
  const [postings, setPostings] = useState<Record<string, { type: PacsTransactionType; accountHead: string }>>(() => {
    const initial: Record<string, { type: PacsTransactionType; accountHead: string }> = {};
    DEFAULT_TRANSACTIONS.forEach((tx) => {
      initial[tx.id] = { type: 'DEBIT', accountHead: tx.accountHead };
    });
    return initial;
  });
  const [certificateAwarded, setCertificateAwarded] = useState<boolean>(false);

  // Compute live Day-End Cashbook Totals
  const { totalReceipts, totalDisbursements, calculatedClosingCash, variance, isBalanced } = useMemo(() => {
    let receipts = 0;
    let disbursements = 0;

    DEFAULT_TRANSACTIONS.forEach((tx) => {
      const posting = postings[tx.id] || { type: 'DEBIT', accountHead: tx.accountHead };
      if (posting.type === 'DEBIT') {
        receipts += tx.amount;
      } else {
        disbursements += tx.amount;
      }
    });

    const calculatedClosing = openingCash + receipts - disbursements;
    const diff = physicalCash - calculatedClosing;

    return {
      totalReceipts: receipts,
      totalDisbursements: disbursements,
      calculatedClosingCash: calculatedClosing,
      variance: diff,
      isBalanced: diff === 0,
    };
  }, [openingCash, physicalCash, postings]);

  // TAB 2: KCC Loan Appraisal State
  const [farmerName, setFarmerName] = useState<string>('Smt. Sunita Devi');
  const [memberId, setMemberId] = useState<string>('M-1042');
  const [selectedCrop, setSelectedCrop] = useState<string>('PADDY');
  const [acreage, setAcreage] = useState<number>(2.5);
  const [scaleOfFinance, setScaleOfFinance] = useState<number>(CROP_PRESETS.PADDY.defaultScale);
  const [loanSanctioned, setLoanSanctioned] = useState<boolean>(false);
  const [sanctionOrderNumber, setSanctionOrderNumber] = useState<string>('');

  const kccCalculations = useMemo(() => {
    const baseCultivationCost = acreage * scaleOfFinance;
    const postHarvestAllowance10Pct = Math.round(baseCultivationCost * 0.1);
    const farmMaintenance20Pct = Math.round(baseCultivationCost * 0.2);
    const totalSanctionLimit = baseCultivationCost + postHarvestAllowance10Pct + farmMaintenance20Pct;
    const grossInterestRate = 7.0;
    const promptRepaymentIncentive = 3.0;
    const effectiveInterestRate = 4.0;
    const annualGrossInterest = Math.round(totalSanctionLimit * 0.07);
    const annualEffectiveInterest = Math.round(totalSanctionLimit * 0.04);
    const annualFarmerSavings = annualGrossInterest - annualEffectiveInterest;

    return {
      baseCultivationCost,
      postHarvestAllowance10Pct,
      farmMaintenance20Pct,
      totalSanctionLimit,
      grossInterestRate,
      promptRepaymentIncentive,
      effectiveInterestRate,
      annualGrossInterest,
      annualEffectiveInterest,
      annualFarmerSavings,
    };
  }, [acreage, scaleOfFinance]);

  // TAB 3: Fertilizer Inventory & POS Stock State
  const [selectedFertilizer, setSelectedFertilizer] = useState<'UREA' | 'DAP' | 'MOP' | 'NPK'>('UREA');
  const [openingBags, setOpeningBags] = useState<number>(FERTILIZER_PRESETS.UREA.opening);
  const [inwardReceiptBags, setInwardReceiptBags] = useState<number>(FERTILIZER_PRESETS.UREA.inward);
  const [posSoldBags, setPosSoldBags] = useState<number>(FERTILIZER_PRESETS.UREA.posSold);
  const [actualPhysicalBags, setActualPhysicalBags] = useState<number>(FERTILIZER_PRESETS.UREA.actual);

  const inventoryCalculations = useMemo(() => {
    const expectedClosingBags = openingBags + inwardReceiptBags - posSoldBags;
    const shrinkageBags = expectedClosingBags - actualPhysicalBags;
    const totalHandled = openingBags + inwardReceiptBags;
    const permissibleShrinkageBags = Math.max(1, Math.ceil(totalHandled * 0.0025)); // 0.25%
    const shrinkagePermissible = shrinkageBags >= 0 && shrinkageBags <= permissibleShrinkageBags;
    const isReconciled = shrinkagePermissible || shrinkageBags === 0;

    return {
      expectedClosingBags,
      shrinkageBags,
      totalHandled,
      permissibleShrinkageBags,
      shrinkagePermissible,
      reconciliationStatus: isReconciled ? ('BALANCED' as const) : ('DISCREPANCY_FLAGGED' as const),
    };
  }, [openingBags, inwardReceiptBags, posSoldBags, actualPhysicalBags]);

  if (!isOpen) return null;

  const handleTogglePostingType = (txId: string, newType: PacsTransactionType) => {
    setPostings((prev) => ({
      ...prev,
      [txId]: {
        ...prev[txId],
        type: newType,
      },
    }));
  };

  const handleAutoSolveDayEnd = () => {
    const solved: Record<string, { type: PacsTransactionType; accountHead: string }> = {};
    DEFAULT_TRANSACTIONS.forEach((tx) => {
      solved[tx.id] = { type: tx.expectedType, accountHead: tx.accountHead };
    });
    setPostings(solved);
  };

  const handleResetDayEnd = () => {
    const resetState: Record<string, { type: PacsTransactionType; accountHead: string }> = {};
    DEFAULT_TRANSACTIONS.forEach((tx) => {
      resetState[tx.id] = { type: 'DEBIT', accountHead: tx.accountHead };
    });
    setPostings(resetState);
    setCertificateAwarded(false);
  };

  const handleClaimCertificate = () => {
    setCertificateAwarded(true);
    if (onBalanced) {
      const closingState: PacsDayEndClosingState = {
        openingCashVault: openingCash,
        entries: DEFAULT_TRANSACTIONS.map((tx) => ({
          id: tx.id,
          accountHead: postings[tx.id]?.accountHead || tx.accountHead,
          category: tx.category,
          type: postings[tx.id]?.type || 'DEBIT',
          amount: tx.amount,
          narration: tx.narration,
          voucherNumber: tx.voucherNumber,
        })),
        totalReceipts,
        totalDisbursements,
        calculatedClosingCash,
        physicalCashCount: physicalCash,
        variance,
        isBalanced,
        closingCertificateId: `CERT-DAYEND-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        closedAt: new Date().toISOString(),
      };
      onBalanced(closingState);
    }
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
          maxWidth: '780px',
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
            <span style={{ fontSize: '1.4rem' }}>🏛️</span>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff' }}>
                {language === 'HI' ? 'पैक्स परिचालन एवं रोकड़बही प्रयोगशाला' : 'PACS Operations & Ledger Balancing Lab'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.55 }}>
                {language === 'HI'
                  ? 'एनसीसीटी मॉडल पैक्स • रोकड़बही मिलान, केसीसी ऋण एवं स्टॉक सत्यापन'
                  : 'NCCT Model PACS • Day-End Balancing, KCC Loan Appraisal & Inventory'}
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

        {/* Navigation Tabs (minHeight >= 44px) */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.25rem 0.5rem',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('DAY_END')}
            style={{
              minHeight: '44px',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'DAY_END' ? '3px solid #0369a1' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'DAY_END' ? '#0369a1' : '#64748b',
              fontWeight: activeTab === 'DAY_END' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>📒</span>
            <span>{language === 'HI' ? 'रोकड़बही मिलान (Day-End)' : 'Day-End Cashbook'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('KCC_APPRAISAL')}
            style={{
              minHeight: '44px',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'KCC_APPRAISAL' ? '3px solid #0369a1' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'KCC_APPRAISAL' ? '#0369a1' : '#64748b',
              fontWeight: activeTab === 'KCC_APPRAISAL' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🌾</span>
            <span>{language === 'HI' ? 'केसीसी ऋण मूल्यांकन' : 'KCC Loan Appraisal'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FERTILIZER_INVENTORY')}
            style={{
              minHeight: '44px',
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom: activeTab === 'FERTILIZER_INVENTORY' ? '3px solid #0369a1' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'FERTILIZER_INVENTORY' ? '#0369a1' : '#64748b',
              fontWeight: activeTab === 'FERTILIZER_INVENTORY' ? 800 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>📦</span>
            <span>{language === 'HI' ? 'उर्वरक स्टॉक एवं पीओएस' : 'Fertilizer POS Stock'}</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* TAB 1: DAY-END CASHBOOK BALANCING SIMULATOR */}
          {activeTab === 'DAY_END' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Summary KPIs Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.75rem',
                  backgroundColor: '#f1f5f9',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    {language === 'HI' ? 'प्रारंभिक तिजोरी नकदी' : 'Opening Vault Cash'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    ₹{openingCash.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>
                    {language === 'HI' ? 'कुल प्राप्तियां (आवक)' : 'Total Receipts (Debit)'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                    +₹{totalReceipts.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase' }}>
                    {language === 'HI' ? 'कुल भुगतान (जावक)' : 'Total Disbursed (Credit)'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b91c1c' }}>
                    -₹{totalDisbursements.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase' }}>
                    {language === 'HI' ? 'गणना अनुसार अंतिम शेष' : 'Calculated Closing'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0369a1' }}>
                    ₹{calculatedClosingCash.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                    {language === 'HI' ? 'भौतिक नकदी गणना' : 'Physical Cash Count'}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    ₹{physicalCash.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Real-time Balancing Status Indicator */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isBalanced ? '#dcfce7' : '#fee2e2',
                  border: `2px solid ${isBalanced ? '#16a34a' : '#ef4444'}`,
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{isBalanced ? '✅' : '⚠️'}</span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isBalanced ? '#15803d' : '#b91c1c' }}>
                      {isBalanced
                        ? language === 'HI'
                          ? 'रोकड़बही पूर्णतः संतुलित (अंतर: ₹0.00)'
                          : 'DAY-END LEDGER BALANCED (Variance: ₹0.00)'
                        : language === 'HI'
                        ? `रोकड़बही में असंतुलन (अंतर: ₹${variance.toLocaleString('en-IN')})`
                        : `CASH IMBALANCE DETECTED (Variance: ₹${variance.toLocaleString('en-IN')})`}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: isBalanced ? '#166534' : '#991b1b', lineHeight: 1.55 }}>
                      {isBalanced
                        ? language === 'HI'
                          ? 'सभी 5 प्रविष्टियों का नामे/जमा मिलान तिजोरी नकदी से हो चुका है।'
                          : 'All 5 transactions correctly tallied with physical cash vault.'
                        : language === 'HI'
                        ? 'सुझाव: ऋण वितरण एवं कार्यालय व्यय जावक (Credit) हैं, जबकि खाद बिक्री एवं जमा आवक (Debit) हैं।'
                        : 'Hint: Loan disbursements and expenses are Cash Outflows (Credit); sales and deposits are Cash Inflows (Debit).'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleAutoSolveDayEnd}
                    style={{
                      minHeight: '44px',
                      padding: '0.45rem 0.85rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    {language === 'HI' ? 'स्वतः मिलान (Auto-Tally)' : 'Auto-Tally Demo'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDayEnd}
                    style={{
                      minHeight: '44px',
                      padding: '0.45rem 0.85rem',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    {language === 'HI' ? 'पुनरारंभ (Reset)' : 'Reset'}
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                  {language === 'HI' ? 'दैनिक रोजनामचा प्रविष्टियां (5 वाउचर)' : 'Daily Voucher Journal (5 Entries)'}
                </div>

                {DEFAULT_TRANSACTIONS.map((tx, idx) => {
                  const currentPosting = postings[tx.id] || { type: 'DEBIT', accountHead: tx.accountHead };
                  const isDebit = currentPosting.type === 'DEBIT';

                  return (
                    <div
                      key={tx.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                            #{idx + 1} {tx.voucherNumber}
                          </span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                            {language === 'HI' ? tx.accountHeadHi : tx.accountHead}
                          </span>
                        </div>

                        <div style={{ fontSize: '1rem', fontWeight: 800, color: isDebit ? '#15803d' : '#b91c1c' }}>
                          {isDebit ? '+ ' : '- '}₹{tx.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.55 }}>
                        {language === 'HI' ? tx.narrationHi : tx.narration}
                      </div>

                      {/* Interactive Toggle Button Group (minHeight >= 44px) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
                          {language === 'HI' ? 'खाता प्रकार चयन:' : 'Cashbook Side:'}
                        </span>

                        <div
                          style={{
                            display: 'flex',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '8px',
                            padding: '3px',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleTogglePostingType(tx.id, 'DEBIT')}
                            style={{
                              minHeight: '44px',
                              minWidth: '100px',
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.8125rem',
                              fontWeight: isDebit ? 800 : 600,
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: isDebit ? '#15803d' : 'transparent',
                              color: isDebit ? '#ffffff' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <span>📥</span>
                            <span>{language === 'HI' ? 'नामे (आवक)' : 'DEBIT (In)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePostingType(tx.id, 'CREDIT')}
                            style={{
                              minHeight: '44px',
                              minWidth: '100px',
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.8125rem',
                              fontWeight: !isDebit ? 800 : 600,
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: !isDebit ? '#b91c1c' : 'transparent',
                              color: !isDebit ? '#ffffff' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <span>📤</span>
                            <span>{language === 'HI' ? 'जमा (जावक)' : 'CREDIT (Out)'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Celebratory Certificate Award when Balanced */}
              {isBalanced && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '2px solid #16a34a',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>🏆</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                    {language === 'HI'
                      ? 'बधाई! दैनिक रोकड़बही पूर्णतः संतुलित एवं सत्यापित'
                      : 'Statutory Day-End Cashbook Balanced & Certified!'}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0, maxWidth: '540px', lineHeight: 1.55 }}>
                    {language === 'HI'
                      ? 'आपने पैक्स रोकड़बही के सभी 5 वाउचरों का सही मिलान तिजोरी नकदी (₹44,000) से सफलता पूर्वक कर लिया है।'
                      : 'You have flawlessly reconciled all 5 double-entry vouchers with vault cash (₹44,000) under NCCT statutory accounting rules.'}
                  </p>

                  <button
                    type="button"
                    onClick={handleClaimCertificate}
                    disabled={certificateAwarded}
                    style={{
                      minHeight: '44px',
                      padding: '0.65rem 1.5rem',
                      backgroundColor: certificateAwarded ? '#15803d' : '#0369a1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      cursor: certificateAwarded ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>📜</span>
                    <span>
                      {certificateAwarded
                        ? language === 'HI'
                          ? '✓ समापन प्रमाण पत्र दर्ज हो चुका'
                          : '✓ Day-End Certificate Recorded'
                        : language === 'HI'
                        ? 'दैनिक समापन प्रमाण पत्र जारी करें'
                        : 'Issue Day-End Closing Certificate'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KCC CROP LOAN APPRAISAL TAB */}
          {activeTab === 'KCC_APPRAISAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '10px',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.8125rem',
                  color: '#1e40af',
                  lineHeight: 1.55,
                }}
              >
                <strong>{language === 'HI' ? 'नाबार्ड केसीसी मूल्यांकन मानक:' : 'NABARD KCC Appraisal Standard:'}</strong>{' '}
                {language === 'HI'
                  ? 'स्वीकृति सीमा = (एकड़ × वित्त का पैमाना) + 10% कटाई उपरांत खर्च + 20% कृषि उपकरण रखरखाव = आधार लागत का 130%।'
                  : 'Sanction Limit = (Acreage × Scale of Finance) + 10% Post-Harvest + 20% Farm Maintenance = 130% of Base Cost.'}
              </div>

              {/* Input Form Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'किसान आवेदक का नाम' : 'Farmer Applicant Name'}
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'पैक्स सदस्य क्रमांक' : 'PACS Member ID'}
                  </label>
                  <input
                    type="text"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'फसल चयन' : 'Crop Selection'}
                  </label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => {
                      const newCrop = e.target.value;
                      setSelectedCrop(newCrop);
                      if (CROP_PRESETS[newCrop]) {
                        setScaleOfFinance(CROP_PRESETS[newCrop].defaultScale);
                      }
                    }}
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
                    {Object.entries(CROP_PRESETS).map(([key, crop]) => (
                      <option key={key} value={key}>
                        {language === 'HI' ? crop.nameHi : crop.nameEn} (₹{crop.defaultScale.toLocaleString('en-IN')}/acre)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'कृषि भूमि (एकड़)' : 'Cultivated Land (Acres)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={acreage}
                    onChange={(e) => setAcreage(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
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
              </div>

              {/* Appraisal Breakdown Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {language === 'HI' ? 'फसली ऋण गणना विवरण (NABARD DLTC Rubric)' : 'Appraisal Breakdown (NABARD DLTC Rubric)'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' }}>
                  <span>{language === 'HI' ? 'आधार खेती लागत (एकड़ × पैमाना):' : 'Base Cultivation Cost (Acreage × Scale):'}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    ₹{kccCalculations.baseCultivationCost.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' }}>
                  <span>{language === 'HI' ? '+ 10% कटाई उपरांत एवं घरेलू खर्च:' : '+ 10% Post-Harvest & Household Allowance:'}</span>
                  <span style={{ fontWeight: 700, color: '#0369a1' }}>
                    +₹{kccCalculations.postHarvestAllowance10Pct.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' }}>
                  <span>{language === 'HI' ? '+ 20% कृषि उपकरण रखरखाव एवं बीमा:' : '+ 20% Farm Assets Maintenance & Insurance:'}</span>
                  <span style={{ fontWeight: 700, color: '#0369a1' }}>
                    +₹{kccCalculations.farmMaintenance20Pct.toLocaleString('en-IN')}
                  </span>
                </div>

                <div
                  style={{
                    borderTop: '2px dashed #e2e8f0',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {language === 'HI' ? 'कुल स्वीकृत ऋण सीमा (Sanction Limit):' : 'Total Sanction Limit (130%):'}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                    ₹{kccCalculations.totalSanctionLimit.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Subvention and Effective Rate Info */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.5rem',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{language === 'HI' ? 'आधार ब्याज दर' : 'Base Interest'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>7.00% p.a.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: '#15803d' }}>{language === 'HI' ? 'ब्याज अनुदान (PRI)' : 'GoI PRI Incentive'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#15803d' }}>-3.00% p.a.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: '#0369a1' }}>{language === 'HI' ? 'किसान हेतु शुद्ध दर' : 'Net Effective Rate'}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0369a1' }}>4.00% p.a.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: '#15803d' }}>{language === 'HI' ? 'वार्षिक ब्याज बचत' : 'Farmer Annual Savings'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#15803d' }}>
                      ₹{kccCalculations.annualFarmerSavings.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Sanction Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    setLoanSanctioned(true);
                    setSanctionOrderNumber(`SO-KCC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                  }}
                  style={{
                    minHeight: '44px',
                    backgroundColor: '#0369a1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>📝</span>
                  <span>{language === 'HI' ? 'केसीसी ऋण सीमा स्वीकृत करें' : 'Sanction KCC Credit Limit'}</span>
                </button>

                {loanSanctioned && (
                  <div
                    style={{
                      padding: '0.85rem',
                      backgroundColor: '#dcfce7',
                      borderRadius: '8px',
                      border: '1px solid #86efac',
                      color: '#166534',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>✓</span>
                    <span>
                      {language === 'HI'
                        ? `स्वीकृति आदेश संख्या ${sanctionOrderNumber} सफलतापूर्वक जारी। शुद्ध ब्याज दर 4.00%।`
                        : `Sanction Order #${sanctionOrderNumber} generated successfully. Effective interest rate: 4.00%.`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FERTILIZER INVENTORY & POS STOCK RECONCILIATION */}
          {activeTab === 'FERTILIZER_INVENTORY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  color: '#334155',
                  lineHeight: 1.55,
                }}
              >
                <strong>{language === 'HI' ? 'उर्वरक नियंत्रण आदेश (FCO) नियम:' : 'Fertilizer Control Order (FCO) Rule:'}</strong>{' '}
                {language === 'HI'
                  ? 'अंतिम बही स्टॉक = प्रारंभिक + आवक - पीओएस बिक्री। अनुमेय घटत/छीजन 0.25% है। अधिक अंतर पाए जाने पर भौतिक स्टॉक विसंगति ध्वज (Discrepancy) लगेगा।'
                  : 'Book Closing Stock = Opening + Inward - POS Sales. Permissible handling shrinkage is 0.25%. Discrepancy beyond this requires statutory inspection.'}
              </div>

              {/* Fertilizer Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                  {language === 'HI' ? 'उर्वरक ग्रेड चयन' : 'Select Fertilizer Grade'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['UREA', 'DAP', 'MOP', 'NPK'] as const).map((fert) => {
                    const preset = FERTILIZER_PRESETS[fert];
                    const isSelected = selectedFertilizer === fert;

                    return (
                      <button
                        key={fert}
                        type="button"
                        onClick={() => {
                          setSelectedFertilizer(fert);
                          setOpeningBags(preset.opening);
                          setInwardReceiptBags(preset.inward);
                          setPosSoldBags(preset.posSold);
                          setActualPhysicalBags(preset.actual);
                        }}
                        style={{
                          minHeight: '44px',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0369a1' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                          color: isSelected ? '#0369a1' : '#475569',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        {language === 'HI' ? preset.nameHi : preset.nameEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Input Form */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'प्रारंभिक स्टॉक (बोरी)' : 'Opening Bags'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={openingBags}
                    onChange={(e) => setOpeningBags(Math.max(0, parseInt(e.target.value, 10) || 0))}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'आवक चालान रसीद (बोरी)' : 'Inward Receipts (Bags)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inwardReceiptBags}
                    onChange={(e) => setInwardReceiptBags(Math.max(0, parseInt(e.target.value, 10) || 0))}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'पीओएस बिक्री पर्ची (बोरी)' : 'POS Slips Sold (Bags)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={posSoldBags}
                    onChange={(e) => setPosSoldBags(Math.max(0, parseInt(e.target.value, 10) || 0))}
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                    {language === 'HI' ? 'वास्तविक गोदाम गणना (बोरी)' : 'Actual Physical Bags'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={actualPhysicalBags}
                    onChange={(e) => setActualPhysicalBags(Math.max(0, parseInt(e.target.value, 10) || 0))}
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
              </div>

              {/* Inventory Calculations Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' }}>
                  <span>{language === 'HI' ? 'बही अनुसार अपेक्षित अंतिम स्टॉक:' : 'Expected Book Closing Stock:'}</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{inventoryCalculations.expectedClosingBags} bags</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' }}>
                  <span>{language === 'HI' ? 'वास्तविक गोदाम स्टॉक गणना:' : 'Actual Physical Godown Stock:'}</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{actualPhysicalBags} bags</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#475569' }}>
                  <span>{language === 'HI' ? 'अंतर / घटत (Shortage/Shrinkage):' : 'Difference / Shrinkage:'}</span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: inventoryCalculations.shrinkageBags <= inventoryCalculations.permissibleShrinkageBags ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {inventoryCalculations.shrinkageBags} bags
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748b' }}>
                  <span>{language === 'HI' ? 'वैधानिक अनुमेय घटत (0.25% सीमा):' : 'Permissible Shrinkage (0.25% Cap):'}</span>
                  <span style={{ fontWeight: 700 }}>≤ {inventoryCalculations.permissibleShrinkageBags} bags</span>
                </div>

                {/* Status Badge */}
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    borderRadius: '10px',
                    backgroundColor: inventoryCalculations.reconciliationStatus === 'BALANCED' ? '#dcfce7' : '#fee2e2',
                    border: `2px solid ${inventoryCalculations.reconciliationStatus === 'BALANCED' ? '#16a34a' : '#ef4444'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>
                    {inventoryCalculations.reconciliationStatus === 'BALANCED' ? '✅' : '🚨'}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: inventoryCalculations.reconciliationStatus === 'BALANCED' ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {inventoryCalculations.reconciliationStatus === 'BALANCED'
                        ? language === 'HI'
                          ? 'स्टॉक एवं पीओएस मिलान सत्यापित (संतुलित)'
                          : 'STOCK & POS RECONCILED (Statutory Balanced)'
                        : language === 'HI'
                        ? 'स्टॉक विसंगति ध्वज (Discrepancy Flagged)'
                        : 'STOCK DISCREPANCY DETECTED'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: inventoryCalculations.reconciliationStatus === 'BALANCED' ? '#166534' : '#991b1b',
                        lineHeight: 1.55,
                      }}
                    >
                      {inventoryCalculations.reconciliationStatus === 'BALANCED'
                        ? language === 'HI'
                          ? 'गोदाम स्टॉक अनुमेय घटत सीमा (0.25%) के भीतर है। पीओएस डेटा प्रमाणित।'
                          : 'Physical count matches POS sales within statutory 0.25% handling shrinkage tolerance.'
                        : language === 'HI'
                        ? `गोदाम स्टॉक में ${inventoryCalculations.shrinkageBags} बोरी की कमी अनुमेय सीमा (${inventoryCalculations.permissibleShrinkageBags} बोरी) से अधिक है। आंतरिक जांच आवश्यक।`
                        : `Stock shortage of ${inventoryCalculations.shrinkageBags} bags exceeds the permissible 0.25% shrinkage limit (${inventoryCalculations.permissibleShrinkageBags} bags). Audit review required.`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
