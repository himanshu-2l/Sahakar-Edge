'use client';

import React, { useState } from 'react';
import type { GrievanceTicket } from '@sahakar/types';
import { apiClient } from '../services/api-client';
import { THEME, buttonPrimaryStyle, buttonSecondaryStyle } from './theme';
import { AlertTriangleIcon, CloseIcon } from './icons';

interface GrievanceEscalateModalProps {
  ticket: GrievanceTicket;
  onClose: () => void;
  onEscalated: (updatedTicket: GrievanceTicket) => void;
}

export function GrievanceEscalateModal({ ticket, onClose, onEscalated }: GrievanceEscalateModalProps) {
  const nextTier = Math.min(4, ticket.currentTier + 1);
  const nextTierLabel =
    nextTier === 2
      ? 'Tier 2: District Level (DCCB / DRCS) — 7-Day SLA'
      : nextTier === 3
      ? 'Tier 3: State Conciliation Board (RCS) — 15-Day SLA'
      : 'Tier 4: Central Ombudsman (CRCS / Ministerial) — 30-Day SLA';

  const [reason, setReason] = useState(
    ticket.currentTier === 1
      ? 'Respondent society failed to furnish voucher reconciliation within 48h SLA window.'
      : 'Dispute involves multi-district cooperative jurisdiction requiring statutory conciliation.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.escalateGrievance(ticket.id, reason);
      if (res.success && res.ticket) {
        onEscalated(res.ticket);
      } else {
        setErrorMsg('Escalation failed on Central API.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error executing escalation.');
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
        aria-labelledby="grievance-escalate-modal-title"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: THEME.radii.md,
          width: '100%',
          maxWidth: '540px',
          boxShadow: THEME.shadows.modal,
          overflow: 'hidden',
          border: `1px solid ${THEME.colors.borderHairline}`,
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${THEME.colors.borderHairline}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fef2f2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangleIcon size={20} color="#dc2626" />
            <h3
              id="grievance-escalate-modal-title"
              style={{ fontSize: '1.05rem', fontWeight: 800, color: '#991b1b', margin: 0 }}
            >
              Statutory Escalation: #{ticket.ticketNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
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

        <form onSubmit={handleEscalate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.65rem 1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                fontSize: '0.82rem',
                borderRadius: THEME.radii.sm,
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ fontSize: '0.85rem', color: THEME.colors.inkBody }}>
            Current Status: <strong>Tier {ticket.currentTier}</strong> → Target Escalation:{' '}
            <strong style={{ color: '#dc2626' }}>{nextTierLabel}</strong>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: THEME.colors.inkPrimary, marginBottom: '0.35rem' }}>
              Statutory Justification for Escalation
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: `1px solid ${THEME.colors.borderHairline}`,
                borderRadius: THEME.radii.sm,
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

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
                backgroundColor: '#dc2626',
                minHeight: '44px',
              }}
              disabled={submitting}
            >
              {submitting ? 'Escalating...' : `Confirm Escalation to Tier ${nextTier}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
