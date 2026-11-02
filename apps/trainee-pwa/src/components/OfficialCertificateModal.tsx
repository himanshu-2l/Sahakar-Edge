import React from 'react';
import { THEME } from '../theme';
import { AshokChakraIcon, NcctEmblemIcon, PrinterIcon, CloseIcon } from './icons';

export interface CertificateData {
  credentialId: string;
  traineeName: string;
  programmeTitle: string;
  institute: string;
  issuedAt: string;
  issuer: string;
  signatureHex: string;
  skills: string[];
}

interface Props {
  data: CertificateData;
  onClose: () => void;
}

export const OfficialCertificateModal: React.FC<Props> = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 24, 84, 0.85)',
        backdropFilter: 'blur(4px)',
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
          borderRadius: '4px',
          border: '1px solid #cbd5e1',
          maxWidth: '740px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: THEME.shadows.modal,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
        }}
      >
        {/* Tricolor National Identity Ribbon */}
        <div style={{ display: 'flex', height: '4px', width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: THEME.colors.saffronFlag }} />
          <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
          <div style={{ flex: 1, backgroundColor: THEME.colors.greenFlag }} />
        </div>

        {/* Top Control Bar (Hidden when printed) */}
        <div
          className="no-print"
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: THEME.colors.navyDeep,
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.925rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AshokChakraIcon size={26} color="#ffffff" />
            <div>
              <div style={{ color: '#ffffff', letterSpacing: '0.02em' }}>NCCT Official Digital Credential</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                राष्ट्रीय सहकारी प्रशिक्षण परिषद • वैधानिक ई-प्रमाणपत्र
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: THEME.colors.navyPrimary,
                color: '#ffffff',
                border: '1px solid #053d88',
                minHeight: '44px',
                padding: '0.65rem 1.15rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              <PrinterIcon size={18} color="#ffffff" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close certificate modal"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                minHeight: '44px',
                minWidth: '44px',
                width: '44px',
                height: '44px',
                padding: '0.65rem',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloseIcon size={18} color="#ffffff" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas with Double-Bezel Frame */}
        <div
          id="ncct-certificate"
          style={{
            padding: '2rem 1.75rem',
            backgroundColor: '#ffffff',
            border: '2px solid #081854',
            outline: '4px double #feb505',
            outlineOffset: '4px',
            margin: '1.25rem',
            borderRadius: '4px',
            position: 'relative',
            color: '#1e293b',
            overflowY: 'auto',
          }}
        >
          {/* Government Header Ribbon */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #feb505', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <AshokChakraIcon size={40} color="#081854" />
            </div>
            <div style={{ fontSize: '0.8125rem', letterSpacing: '0.14em', color: THEME.colors.navySovereign, fontWeight: 800, textTransform: 'uppercase' }}>
              भारत सरकार • सहकारिता मंत्रालय / Government of India • Ministry of Cooperation
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: THEME.colors.emeraldCoop, marginTop: '0.25rem' }}>
              सहकार से समृद्धि • Sahakar Se Samriddhi
            </div>
            <h1
              style={{
                fontSize: '1.35rem',
                color: THEME.colors.navyDeep,
                margin: '0.45rem 0 0.15rem 0',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                lineHeight: 1.35,
              }}
            >
              National Council for Cooperative Training (NCCT)
            </h1>
            <div style={{ fontSize: '0.875rem', color: THEME.colors.inkMuted, fontWeight: 700, marginTop: '0.2rem' }}>
              {data.institute}
            </div>
          </div>

          {/* Certificate Body */}
          <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem 0' }}>
            <div style={{ fontSize: '0.9375rem', color: THEME.colors.inkMuted, fontStyle: 'italic' }}>
              प्रमाणित किया जाता है कि / This is to certify that
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                color: THEME.colors.navyDeep,
                fontWeight: 900,
                margin: '0.65rem 0',
                letterSpacing: '0.01em',
              }}
            >
              {data.traineeName}
            </div>
            <div
              style={{
                fontSize: '0.925rem',
                color: THEME.colors.inkBody,
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              has successfully completed all prescribed courses, practical ledger accounting, and statutory examination under the National Cooperative Policy framework for
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                color: THEME.colors.navyPrimary,
                fontWeight: 800,
                margin: '0.75rem 0 0.4rem 0',
                lineHeight: 1.4,
              }}
            >
              {data.programmeTitle}
            </div>
          </div>

          {/* Verified Skills Grid */}
          <div
            style={{
              margin: '1.25rem 0',
              padding: '1rem 1.15rem',
              backgroundColor: THEME.colors.bgCanvas,
              borderRadius: '4px',
              border: `1px solid ${THEME.colors.borderHairline}`,
            }}
          >
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                color: THEME.colors.navyPrimary,
                textTransform: 'uppercase',
                marginBottom: '0.55rem',
                letterSpacing: '0.04em',
              }}
            >
              सत्यापित योग्यताएं (100% उत्तीर्णांक) / Verified Assessed Competencies:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.skills.map((sk, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.8125rem',
                    backgroundColor: '#eff6ff',
                    color: THEME.colors.navyPrimary,
                    border: '1px solid #bfdbfe',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    lineHeight: 1.4,
                  }}
                >
                  ✓ {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Verification & Signature Section */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: '1.5rem',
              paddingTop: '1.15rem',
              borderTop: `1px solid ${THEME.colors.borderHairline}`,
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: THEME.colors.inkMuted, maxWidth: '360px', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: THEME.colors.navyDeep }}>Credential ID:</strong>{' '}
                <span style={{ fontFamily: THEME.fonts.mono, fontWeight: 700 }}>{data.credentialId}</span>
              </div>
              <div>
                <strong style={{ color: THEME.colors.navyDeep }}>Issued On:</strong> {new Date(data.issuedAt).toLocaleDateString()}
              </div>
              <div>
                <strong style={{ color: THEME.colors.navyDeep }}>Digital Signature (Ed25519):</strong>
              </div>
              <div
                style={{
                  wordBreak: 'break-all',
                  fontSize: '0.8125rem',
                  color: '#15803d',
                  fontFamily: THEME.fonts.mono,
                  backgroundColor: '#f0fdf4',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #bbf7d0',
                  marginTop: '0.2rem',
                }}
              >
                {data.signatureHex.slice(0, 56)}...
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <div
                style={{
                  width: '92px',
                  height: '92px',
                  margin: '0 auto',
                  border: '2px solid #feb505',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fefce8',
                  boxShadow: '0 2px 6px rgba(254, 181, 5, 0.25)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <NcctEmblemIcon size={44} color="#081854" accentColor="#feb505" greenColor="#1ab452" />
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#854d0e', lineHeight: 1.2, marginTop: '2px' }}>
                    ED25519<br />VERIFIED
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, marginTop: '0.45rem', color: THEME.colors.navyDeep }}>
                Apex Training Authority
              </div>
              <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted }}>NCCT New Delhi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
