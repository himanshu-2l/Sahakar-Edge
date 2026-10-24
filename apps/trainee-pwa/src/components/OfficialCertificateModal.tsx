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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
          borderRadius: '12px',
          maxWidth: '680px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Control Bar (Hidden when printed) */}
        <div
          className="no-print"
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📜</span>
            <span>NCCT Official Digital Credential</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🖨️ Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#334155',
                color: '#ffffff',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div
          id="ncct-certificate"
          style={{
            padding: '2rem',
            backgroundColor: '#fffdfa',
            border: '8px double #b45309',
            margin: '0.75rem',
            borderRadius: '4px',
            position: 'relative',
            color: '#1e293b',
            fontFamily: 'serif',
          }}
        >
          {/* Government Header Ribbon */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #ca8a04', paddingBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.12em', color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>
              Ministry of Cooperation • Government of India
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', marginTop: '0.15rem' }}>
              सहकार से समृद्धि • Sahakar Se Samriddhi
            </div>
            <h1 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0.35rem 0 0 0', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              National Council for Cooperative Training (NCCT)
            </h1>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.2rem' }}>
              {data.institute}
            </div>
          </div>

          {/* Certificate Body */}
          <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem 0' }}>
            <div style={{ fontSize: '0.9rem', color: '#475569', fontStyle: 'italic' }}>
              This is to certify that
            </div>
            <div style={{ fontSize: '1.6rem', color: '#0369a1', fontWeight: 900, margin: '0.5rem 0', fontFamily: 'sans-serif' }}>
              {data.traineeName}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
              has successfully completed all prescribed courses, practical ledger accounting, and statutory examination under the National Cooperative Policy framework for
            </div>
            <div style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: '0.65rem 0 0.4rem 0', fontFamily: 'sans-serif' }}>
              {data.programmeTitle}
            </div>
          </div>

          {/* Verified Skills Grid */}
          <div style={{ margin: '1rem 0', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Verified Assessed Competencies (100% Pass Threshold):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {data.skills.map((sk, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.7rem',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  ✓ {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Verification & Signature Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', maxWidth: '320px' }}>
              <div><strong>Credential ID:</strong> {data.credentialId}</div>
              <div><strong>Issued On:</strong> {new Date(data.issuedAt).toLocaleDateString()}</div>
              <div><strong>Digital Signature (Ed25519):</strong></div>
              <div style={{ wordBreak: 'break-all', fontSize: '0.62rem', color: '#16a34a', marginTop: '0.1rem' }}>
                {data.signatureHex.slice(0, 48)}...
              </div>
            </div>

            <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto', border: '2px solid #ca8a04', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fefce8' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ca8a04', textAlign: 'center' }}>
                  🛡️ ED25519<br />VERIFIED
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, marginTop: '0.35rem', color: '#0f172a' }}>
                Apex Training Authority
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>NCCT New Delhi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
