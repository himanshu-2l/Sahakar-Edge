import React from 'react';

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
          maxWidth: '740px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
        }}
      >
        {/* Tricolor National Identity Ribbon */}
        <div style={{ display: 'flex', height: '4px', width: '100%' }}>
          <div style={{ flex: 1, backgroundColor: '#ea580c' }} />
          <div style={{ flex: 1, backgroundColor: '#ffffff' }} />
          <div style={{ flex: 1, backgroundColor: '#16a34a' }} />
        </div>

        {/* Top Control Bar (Hidden when printed) */}
        <div
          className="no-print"
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.925rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📜</span>
            <div>
              <div style={{ color: '#ffffff' }}>NCCT Official Digital Credential</div>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>
                राष्ट्रीय सहकारी प्रशिक्षण परिषद • वैधानिक ई-प्रमाणपत्र
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#0369a1',
                color: '#ffffff',
                border: 'none',
                minHeight: '44px',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              <span>🖨️</span>
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#334155',
                color: '#ffffff',
                border: 'none',
                minHeight: '44px',
                minWidth: '44px',
                padding: '0.65rem 1.15rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <span>✕</span>
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div
          id="ncct-certificate"
          style={{
            padding: '2rem 1.75rem',
            backgroundColor: '#fffdfa',
            border: '6px double #b45309',
            margin: '0.85rem',
            borderRadius: '8px',
            position: 'relative',
            color: '#1e293b',
            overflowY: 'auto',
          }}
        >
          {/* Government Header Ribbon */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #ca8a04', paddingBottom: '1rem' }}>
            <div style={{ fontSize: '0.8125rem', letterSpacing: '0.14em', color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>
              भारत सरकार • सहकारिता मंत्रालय / Government of India • Ministry of Cooperation
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
              सहकार से समृद्धि • Sahakar Se Samriddhi
            </div>
            <h1
              style={{
                fontSize: '1.35rem',
                color: '#0f172a',
                margin: '0.45rem 0 0.15rem 0',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                lineHeight: 1.35,
              }}
            >
              National Council for Cooperative Training (NCCT)
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 700, marginTop: '0.2rem' }}>
              {data.institute}
            </div>
          </div>

          {/* Certificate Body */}
          <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem 0' }}>
            <div style={{ fontSize: '0.9375rem', color: '#64748b', fontStyle: 'italic' }}>
              प्रमाणित किया जाता है कि / This is to certify that
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                color: '#0f172a',
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
                color: '#334155',
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
                color: '#0369a1',
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
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 800,
                color: '#0369a1',
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
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
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
              borderTop: '1px solid #e2e8f0',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '0.8125rem', color: '#475569', maxWidth: '360px', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: '#0f172a' }}>Credential ID:</strong>{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{data.credentialId}</span>
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>Issued On:</strong> {new Date(data.issuedAt).toLocaleDateString()}
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>Digital Signature (Ed25519):</strong>
              </div>
              <div
                style={{
                  wordBreak: 'break-all',
                  fontSize: '0.8125rem',
                  color: '#15803d',
                  fontFamily: 'monospace',
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
                  border: '2px solid #ca8a04',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#fefce8',
                  boxShadow: '0 2px 6px rgba(202, 138, 4, 0.15)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>🛡️</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 900, color: '#ca8a04', lineHeight: 1.2 }}>
                    ED25519<br />VERIFIED
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, marginTop: '0.45rem', color: '#0f172a' }}>
                Apex Training Authority
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>NCCT New Delhi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
