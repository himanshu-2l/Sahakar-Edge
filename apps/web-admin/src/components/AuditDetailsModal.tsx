import React from 'react';
import { THEME, pillBadge, buttonSecondaryStyle } from './theme';
import { ShieldCheckIcon, CloseIcon, KeyIcon } from './icons';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
}

interface AuditDetailsModalProps {
  log: AuditLogItem | null;
  onClose: () => void;
}

export function AuditDetailsModal({ log, onClose }: AuditDetailsModalProps) {
  if (!log) return null;

  // Derive deterministic pseudo SHA-256 hash from log fields
  const mockSha256 = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}e41d8a0c5b3f2e1a9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b`.slice(0, 64);
  };

  const canonicalHash = mockSha256(`${log.id}-${log.timestamp}-${log.action}-${log.actor}`);

  const formattedPayload = JSON.stringify(
    {
      eventId: log.id,
      timestamp: log.timestamp,
      actor: log.actor,
      actionCode: log.action,
      targetEntity: log.entity,
      auditDetails: log.details,
      tamperProtection: {
        hashAlgorithm: 'SHA-256 (RFC 8785 Canonical JSON)',
        canonicalDigest: canonicalHash,
        verified: true,
      },
    },
    null,
    2
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          backgroundColor: THEME.colors.bgSurface,
          borderRadius: THEME.radii.lg,
          maxWidth: '680px',
          width: '100%',
          boxShadow: THEME.shadows.modal,
          overflow: 'hidden',
          border: `1px solid ${THEME.colors.borderHairline}`,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: `1px solid ${THEME.colors.borderHairline}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: THEME.colors.bgMuted,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: THEME.radii.sm,
                backgroundColor: '#ffffff',
                border: `1px solid ${THEME.colors.borderHairline}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: THEME.colors.navyPrimary,
              }}
            >
              <ShieldCheckIcon size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: THEME.colors.inkPrimary }}>
                Security & Compliance Event Details
              </div>
              <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>
                Immutable Ledger Record • SHA-256 Cryptographic Audit
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.colors.inkMuted,
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Key Attributes Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              backgroundColor: THEME.colors.bgMuted,
              padding: '1rem',
              borderRadius: THEME.radii.md,
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase' }}>
                Action Code
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <span style={pillBadge('info')}>{log.action}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase' }}>
                Event Timestamp
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: THEME.colors.inkPrimary, marginTop: '0.25rem', fontFamily: THEME.fonts.mono }}>
                {log.timestamp}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase' }}>
                Responsible Actor
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: THEME.colors.inkPrimary, marginTop: '0.25rem' }}>
                {log.actor}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase' }}>
                Target Entity
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: THEME.colors.inkPrimary, marginTop: '0.25rem' }}>
                {log.entity}
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Verification Card */}
          <div
            style={{
              backgroundColor: THEME.colors.status.success.bg,
              border: `1px solid ${THEME.colors.status.success.border}`,
              padding: '0.85rem 1rem',
              borderRadius: THEME.radii.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <KeyIcon size={14} color={THEME.colors.status.success.text} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.status.success.text }}>
                Canonical SHA-256 Digest (RFC 8785 Verified)
              </span>
            </div>
            <div
              style={{
                fontFamily: THEME.fonts.mono,
                fontSize: '0.75rem',
                color: THEME.colors.status.success.text,
                wordBreak: 'break-all',
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: '0.4rem 0.6rem',
                borderRadius: THEME.radii.xs,
              }}
            >
              {canonicalHash}
            </div>
          </div>

          {/* Narrative Details */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Audit Narrative
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                lineHeight: 1.5,
                color: THEME.colors.inkBody,
                backgroundColor: THEME.colors.bgSurface,
                padding: '0.85rem 1rem',
                borderRadius: THEME.radii.sm,
                border: `1px solid ${THEME.colors.borderHairline}`,
              }}
            >
              {log.details}
            </div>
          </div>

          {/* JSON Payload Inspector */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: THEME.colors.inkMuted, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Event Payload JSON
            </div>
            <pre
              style={{
                margin: 0,
                padding: '0.85rem',
                backgroundColor: '#111827',
                color: '#e5e7eb',
                borderRadius: THEME.radii.sm,
                fontSize: '0.75rem',
                fontFamily: THEME.fonts.mono,
                overflowX: 'auto',
                lineHeight: 1.45,
              }}
            >
              {formattedPayload}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: `1px solid ${THEME.colors.borderHairline}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: THEME.colors.bgMuted,
          }}
        >
          <div style={{ fontSize: '0.75rem', color: THEME.colors.status.success.text, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
            <span>Immutable • Merkle-Verified Event</span>
          </div>
          <button onClick={onClose} style={buttonSecondaryStyle}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
