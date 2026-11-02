'use client';

import React, { useState } from 'react';
import type { GrievanceTicket } from '@sahakar/types';
import { apiClient } from '../services/api-client';
import { THEME, cardStyle, buttonPrimaryStyle, buttonSecondaryStyle, pillBadge } from './theme';
import { ScaleIcon, CheckIcon, CloseIcon, ShieldCheckIcon } from './icons';

interface GrievanceResolutionModalProps {
  ticket: GrievanceTicket;
  onClose: () => void;
  onResolved: (updatedTicket: GrievanceTicket) => void;
}

export function GrievanceResolutionModal({ ticket, onClose, onResolved }: GrievanceResolutionModalProps) {
  const [findingType, setFindingType] = useState<
    | 'SUBSTANTIATED_FINANCIAL_DISCREPANCY'
    | 'SUBSTANTIATED_SYSTEMIC_FAILURE'
    | 'MUTUAL_CONCILIATION_AGREED'
    | 'UNSUBSTANTIATED_DISMISSED'
  >('SUBSTANTIATED_FINANCIAL_DISCREPANCY');

  const [findingsNarrative, setFindingsNarrative] = useState(
    `Upon forensic inquiry and examination of ledger logs, the complaint regarding "${ticket.title}" is substantiated. Rectification is ordered pursuant to Section 85A of the MSCS Act 2023.`
  );

  const [remedialActionType, setRemedialActionType] = useState<
    'FINANCIAL_RESTITUTION' | 'REGISTRY_RECTIFICATION' | 'SYSTEMIC_OVERHAUL' | 'DISMISSAL'
  >('FINANCIAL_RESTITUTION');

  const [remedialAmount, setRemedialAmount] = useState<number>(4200);

  const [bindingDirectives, setBindingDirectives] = useState(
    '1. The respondent society shall credit the due subvention amount to the complainant passbook within 7 calendar days.\n2. The society secretary shall submit a compliance affidavit to the District Registrar within 14 days.'
  );

  const [officerName, setOfficerName] = useState('Shri Rajesh Verma');
  const [officerDesignation, setOfficerDesignation] = useState('Central Co-operative Ombudsman & Central Registrar');
  const [officerSealVerified, setOfficerSealVerified] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingsNarrative.trim() || findingsNarrative.length < 20) {
      setErrorMsg('Findings narrative must contain at least 20 characters of statutory rationale.');
      return;
    }
    if (!officerSealVerified) {
      setErrorMsg('You must certify and affix the sovereign administrative seal before issuing this order.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const fullSummary =
      `[STATUTORY RESOLUTION ORDER — MSCS ACT 2023 SEC 85A]\n` +
      `Case: ${ticket.ticketNumber} | Tier ${ticket.currentTier} | Finding: ${findingType}\n` +
      `Summary: ${findingsNarrative}\n` +
      `Directives: ${bindingDirectives} ${remedialActionType === 'FINANCIAL_RESTITUTION' ? `(Restitution ₹${remedialAmount})` : ''}\n` +
      `Adjudicated by: ${officerName}, ${officerDesignation} on ${new Date().toISOString()}`;

    try {
      const res = await apiClient.resolveGrievance(ticket.id, fullSummary);
      if (res.success && res.ticket) {
        onResolved(res.ticket);
      } else {
        setErrorMsg('Failed to resolve grievance on Central API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while issuing resolution order.');
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
        aria-labelledby="grievance-resolution-modal-title"
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
          border: `1px solid ${THEME.colors.borderHairline}`,
        }}
      >
        {/* Header */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ScaleIcon size={18} color={THEME.colors.navyPrimary} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Statutory Dispute Resolution Order (Sec 85A)
              </span>
            </div>
            <h3
              id="grievance-resolution-modal-title"
              style={{ fontSize: '1.15rem', fontWeight: 800, color: THEME.colors.inkPrimary, margin: '0.2rem 0 0 0' }}
            >
              Adjudicate Grievance #{ticket.ticketNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: THEME.colors.inkMuted,
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{ padding: '0.65rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: THEME.radii.sm, fontSize: '0.82rem' }}>
              {errorMsg}
            </div>
          )}

          {/* Ticket Context Pillbox */}
          <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm, padding: '0.85rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div><span style={{ color: THEME.colors.inkMuted }}>Complainant:</span> <strong>{ticket.complainantName}</strong> ({ticket.complainantRole})</div>
            <div><span style={{ color: THEME.colors.inkMuted }}>Society:</span> <strong>{ticket.societyName}</strong></div>
            <div><span style={{ color: THEME.colors.inkMuted }}>Category:</span> {ticket.category}</div>
            <div><span style={{ color: THEME.colors.inkMuted }}>Adjudication Tier:</span> Tier {ticket.currentTier} Authority</div>
          </div>

          {/* Section 1: Finding Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
              Statutory Finding Classification
            </label>
            <select
              value={findingType}
              onChange={(e) => setFindingType(e.target.value as any)}
              style={{ width: '100%', minHeight: '44px', padding: '0.6rem', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm, fontSize: '0.85rem' }}
            >
              <option value="SUBSTANTIATED_FINANCIAL_DISCREPANCY">Substantiated Financial Discrepancy (Restitution Mandated)</option>
              <option value="SUBSTANTIATED_SYSTEMIC_FAILURE">Substantiated Systemic / Hardware / Process Failure</option>
              <option value="MUTUAL_CONCILIATION_AGREED">Mutual Conciliation & Mediated Settlement Reached</option>
              <option value="UNSUBSTANTIATED_DISMISSED">Unsubstantiated Dispute (Dismissed Without Fault)</option>
            </select>
          </div>

          {/* Section 2: Findings Narrative */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
              Statutory Findings Summary & Rationale
            </label>
            <textarea
              rows={3}
              value={findingsNarrative}
              onChange={(e) => setFindingsNarrative(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm, fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Section 3: Remedial Action & Binding Directives */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
                Remedial Action Type
              </label>
              <select
                value={remedialActionType}
                onChange={(e) => setRemedialActionType(e.target.value as any)}
                style={{ width: '100%', minHeight: '44px', padding: '0.6rem', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm, fontSize: '0.85rem' }}
              >
                <option value="FINANCIAL_RESTITUTION">Financial Restitution Credit</option>
                <option value="REGISTRY_RECTIFICATION">Voter List / Register Rectification</option>
                <option value="SYSTEMIC_OVERHAUL">Hardware Terminal Replacement</option>
                <option value="DISMISSAL">Formal Dismissal</option>
              </select>
            </div>
            {remedialActionType === 'FINANCIAL_RESTITUTION' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
                  Restitution Amount (₹)
                </label>
                <input
                  type="number"
                  value={remedialAmount}
                  onChange={(e) => setRemedialAmount(Number(e.target.value))}
                  style={{ width: '100%', minHeight: '44px', padding: '0.6rem', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm, fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
              Binding Administrative Directives & Sanctions
            </label>
            <textarea
              rows={3}
              value={bindingDirectives}
              onChange={(e) => setBindingDirectives(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm, fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

          {/* Section 4: Officer Sign-off & Digital Seal */}
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: THEME.radii.sm, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheckIcon size={16} color="#1e3a5f" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase' }}>
                Officer Sign-Off & Sovereign Electronic Seal
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Inquiring Officer</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  style={{ width: '100%', minHeight: '44px', padding: '0.45rem', fontSize: '0.8rem', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: THEME.colors.inkMuted }}>Designation / Authority</label>
                <input
                  type="text"
                  value={officerDesignation}
                  onChange={(e) => setOfficerDesignation(e.target.value)}
                  style={{ width: '100%', minHeight: '44px', padding: '0.45rem', fontSize: '0.8rem', border: `1px solid ${THEME.colors.borderHairline}`, borderRadius: THEME.radii.sm }}
                />
              </div>
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: '#1e3a5f',
                cursor: 'pointer',
                fontWeight: 600,
                minHeight: '44px',
              }}
            >
              <input
                type="checkbox"
                checked={officerSealVerified}
                onChange={(e) => setOfficerSealVerified(e.target.checked)}
              />
              <span>Affix Sovereign Digital Ombudsman Seal (MSCS-SEAL-SEC85A-BINDING)</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonSecondaryStyle,
                minHeight: '44px',
              }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...buttonPrimaryStyle,
                minHeight: '44px',
              }}
              disabled={submitting}
            >
              {submitting ? 'Transmitting Order...' : 'Issue Binding Resolution Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
