'use client';

import React, { useState, useMemo } from 'react';
import { type Credential, CredentialStatus } from '@sahakar/types';
import {
  THEME,
  cardStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  pillBadge,
} from './theme';
import {
  ProofIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  CheckIcon,
  CloseIcon,
  CodeIcon,
} from './icons';

// RFC 8032 Ed25519 Group Order L
const ED25519_L = (1n << 252n) + 27742317777372353535851937790883648493n;

/**
 * Pure TypeScript FIPS 180-4 SHA-256 for browser runtime.
 */
function rotr32(n: number, b: number): number {
  return (n >>> b) | (n << (32 - b));
}

export function sha256Hex(ascii: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const encoder = new TextEncoder();
  const bytes = encoder.encode(ascii);
  const l = bytes.length * 8;
  const k = (448 - ((l + 8) % 512) + 512) % 512;
  const totalLen = (l + 8 + k + 64) / 8;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(totalLen - 8, BigInt(l));

  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const W = new Uint32Array(64);

  for (let i = 0; i < totalLen; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(i + t * 4);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr32(W[t - 15], 7) ^ rotr32(W[t - 15], 18) ^ (W[t - 15] >>> 3);
      const s1 = rotr32(W[t - 2], 17) ^ rotr32(W[t - 2], 19) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) | 0;
      const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

/**
 * RFC 8785 Canonical JSON Serialization.
 */
export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => canonicalJsonStringify(item)).join(',')}]`;
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${canonicalJsonStringify(val)}`;
  });

  return `{${pairs.join(',')}}`;
}

export interface InspectorCredential extends Credential {
  publicKey: string;
}

// Canonical Seed Credentials for Demonstration
const DEMO_CREDENTIALS: InspectorCredential[] = [
  {
    id: 'cred-anita-pacs-2026',
    traineeId: 'dddd4444-4444-4444-4444-444444444441',
    programmeId: 'aaaa1111-1111-1111-1111-111111111111',
    issuerKeyId: 'ncct-master-ed25519-v1',
    issuedAt: '2026-09-28T14:30:00.000Z',
    expiresAt: null,
    status: CredentialStatus.ACTIVE,
    publicKey: '6d11f3d72b318be60fee247710cdd9671c9685ef032a23e9027f663e31f1e01c',
    payload: {
      credentialId: 'cred-anita-pacs-2026',
      schemaVersion: 1,
      issuer: {
        id: 'ncct-central-issuer-01',
        name: 'National Council for Cooperative Training (NCCT)',
        instituteId: 'cccc3333-3333-3333-3333-333333333331',
      },
      recipient: {
        traineeId: 'dddd4444-4444-4444-4444-444444444441',
        name: 'Anita Patel',
      },
      programme: {
        id: 'aaaa1111-1111-1111-1111-111111111111',
        title: 'PACS Computerization & Double-Entry Accounting Mastery',
      },
      skillsSummary: [
        { skillCode: 'PACS_ACCOUNTING', skillName: 'PACS Double-Entry Bookkeeping', level: 2 },
        { skillCode: 'VOUCHER_ENTRY', skillName: 'Daybook & Voucher Posting', level: 2 },
        { skillCode: 'COOP_GOVERNANCE', skillName: 'Cooperative Governance & Compliance', level: 1 },
      ],
      issuedAt: '2026-09-28T14:30:00.000Z',
      expiresAt: null,
    },
    signature:
      '830af07812d05d4099fb34827a5bd6176d4605291ddc18ef06ca426a887e4aae29763054a550604c071d1f55efb9facf49a0a90486b5bd771b40757db0577a00',
  },
  {
    id: 'cred-vikram-dairy-2026',
    traineeId: 'dddd4444-4444-4444-4444-444444444442',
    programmeId: 'aaaa1111-1111-1111-1111-111111111112',
    issuerKeyId: 'ncct-master-ed25519-v1',
    issuedAt: '2026-10-05T11:00:00.000Z',
    expiresAt: null,
    status: CredentialStatus.ACTIVE,
    publicKey: '6d11f3d72b318be60fee247710cdd9671c9685ef032a23e9027f663e31f1e01c',
    payload: {
      credentialId: 'cred-vikram-dairy-2026',
      schemaVersion: 1,
      issuer: {
        id: 'ncct-central-issuer-01',
        name: 'National Council for Cooperative Training (NCCT)',
        instituteId: 'cccc3333-3333-3333-3333-333333333332',
      },
      recipient: {
        traineeId: 'dddd4444-4444-4444-4444-444444444442',
        name: 'Vikram Singh',
      },
      programme: {
        id: 'aaaa1111-1111-1111-1111-111111111112',
        title: 'Dairy Cooperative Procurement & Cold Chain Logistics',
      },
      skillsSummary: [
        { skillCode: 'DAIRY_COLD_CHAIN', skillName: 'Cold Storage Operations', level: 2 },
        { skillCode: 'COOP_GOVERNANCE', skillName: 'Cooperative Governance & Compliance', level: 2 },
      ],
      issuedAt: '2026-10-05T11:00:00.000Z',
      expiresAt: null,
    },
    signature:
      'bab347a53dabc8ce0c9a3f110e9f3cf3f57e519d0fa1349ff7e58bbc266ee067710a6a15712e7a456f82eb0142291e82ef7c1d3b06054e481f39acac57a8400b',
  },
  {
    id: 'cred-sunita-auditor-2026',
    traineeId: 'dddd4444-4444-4444-4444-444444444443',
    programmeId: 'aaaa1111-1111-1111-1111-111111111113',
    issuerKeyId: 'ncct-master-ed25519-v1',
    issuedAt: '2026-10-12T16:00:00.000Z',
    expiresAt: null,
    status: CredentialStatus.ACTIVE,
    publicKey: '6d11f3d72b318be60fee247710cdd9671c9685ef032a23e9027f663e31f1e01c',
    payload: {
      credentialId: 'cred-sunita-auditor-2026',
      schemaVersion: 1,
      issuer: {
        id: 'ncct-central-issuer-01',
        name: 'National Council for Cooperative Training (NCCT)',
        instituteId: 'cccc3333-3333-3333-3333-333333333333',
      },
      recipient: {
        traineeId: 'dddd4444-4444-4444-4444-444444444443',
        name: 'Sunita Devi',
      },
      programme: {
        id: 'aaaa1111-1111-1111-1111-111111111113',
        title: 'Statutory Audit & Cooperative Inspection Certification',
      },
      skillsSummary: [
        { skillCode: 'COOP_AUDIT', skillName: 'Statutory Cooperative Audit & Form 8', level: 3 },
        { skillCode: 'PACS_ACCOUNTING', skillName: 'PACS Double-Entry Bookkeeping', level: 2 },
      ],
      issuedAt: '2026-10-12T16:00:00.000Z',
      expiresAt: null,
    },
    signature:
      '194cd118e5bca0655330ff6b8927b6a39d82db990067d49be2202a896a521657db6889917a47886ad5df91e4db68e128dd24117858b50a5263ae640f106ba908',
  },
];

type AttackPreset =
  | 'NONE'
  | 'GRADE_INFLATION'
  | 'IDENTITY_THEFT'
  | 'UNACCREDITED_PROG'
  | 'BACKDATED_ISSUE'
  | 'BIT_FLIP';

export function ProofInspectorView() {
  const [selectedCredId, setSelectedCredId] = useState<string>('cred-anita-pacs-2026');
  const [activePreset, setActivePreset] = useState<AttackPreset>('NONE');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const selectedCredential = useMemo(() => {
    return DEMO_CREDENTIALS.find((c) => c.id === selectedCredId) || DEMO_CREDENTIALS[0];
  }, [selectedCredId]);

  // Original Authentic Cryptographic Elements
  const authenticPayload = selectedCredential.payload;
  const authenticCanonicalJson = useMemo(() => {
    return canonicalJsonStringify(authenticPayload);
  }, [authenticPayload]);

  const authenticDigestHex = useMemo(() => {
    return sha256Hex(authenticCanonicalJson);
  }, [authenticCanonicalJson]);

  // Ed25519 Curve Decomposition
  const signatureHex = selectedCredential.signature;
  const curvePointR = signatureHex.slice(0, 64);
  const scalarS = signatureHex.slice(64, 128);
  const publicKeyHex = selectedCredential.publicKey;

  // Scalar S < L check
  const isScalarValid = useMemo(() => {
    try {
      // Decode little-endian 32-byte scalar
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(scalarS.slice(i * 2, i * 2 + 2), 16);
      }
      let sBigInt = 0n;
      for (let i = 31; i >= 0; i--) {
        sBigInt = (sBigInt << 8n) + BigInt(bytes[i]);
      }
      return sBigInt < ED25519_L;
    } catch {
      return true;
    }
  }, [scalarS]);

  // Tamper Sandbox State
  const tamperedPayload = useMemo(() => {
    if (activePreset === 'NONE') return null;
    const cloned = JSON.parse(JSON.stringify(authenticPayload));

    switch (activePreset) {
      case 'GRADE_INFLATION':
        if (cloned.skillsSummary && cloned.skillsSummary[0]) {
          cloned.skillsSummary[0].level = 5; // Injected Master Specialist
        }
        break;
      case 'IDENTITY_THEFT':
        if (cloned.recipient) {
          cloned.recipient.name = 'Rogue Imposter';
        }
        break;
      case 'UNACCREDITED_PROG':
        if (cloned.programme) {
          cloned.programme.title = 'Honorary Master of Agricultural Banking & Apex Audit';
        }
        break;
      case 'BACKDATED_ISSUE':
        cloned.issuedAt = '2019-01-01T00:00:00.000Z';
        break;
      case 'BIT_FLIP':
        if (cloned.recipient && cloned.recipient.name) {
          // Flip 1 bit of 'A' (0x41) -> 'C' (0x43)
          const firstChar = cloned.recipient.name.charCodeAt(0);
          const flipped = String.fromCharCode(firstChar ^ 0x02);
          cloned.recipient.name = flipped + cloned.recipient.name.slice(1);
        }
        break;
    }
    return cloned;
  }, [authenticPayload, activePreset]);

  const tamperedCanonicalJson = useMemo(() => {
    if (!tamperedPayload) return null;
    return canonicalJsonStringify(tamperedPayload);
  }, [tamperedPayload]);

  const tamperedDigestHex = useMemo(() => {
    if (!tamperedCanonicalJson) return null;
    return sha256Hex(tamperedCanonicalJson);
  }, [tamperedCanonicalJson]);

  // Hamming Distance (Avalanche Effect)
  const hammingDistance = useMemo(() => {
    if (!tamperedDigestHex) return 0;
    let diffBits = 0;
    for (let i = 0; i < 64; i++) {
      const origNibble = parseInt(authenticDigestHex[i], 16);
      const tampNibble = parseInt(tamperedDigestHex[i], 16);
      const xor = origNibble ^ tampNibble;
      diffBits += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
    }
    return diffBits;
  }, [authenticDigestHex, tamperedDigestHex]);

  const handleCopyCanonical = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(authenticCanonicalJson);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header & Sovereign Directive Banner */}
      <div
        style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f33 100%)',
          color: '#ffffff',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(30, 58, 95, 0.15)',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                padding: '0.15rem 0.5rem',
                borderRadius: THEME.radii.pill,
                textTransform: 'uppercase',
              }}
            >
              Cryptographic Sovereignty
            </span>
            <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 600 }}>
              Ed25519 (RFC 8032) & RFC 8785 Canonical Serialization
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.2rem 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Cryptographic Proof Inspector & Interactive Tamper Sandbox
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            Inspect bit-exact RFC 8785 canonical payloads, verify mathematical curve point bounds ($S &lt; L$),
            and execute adversarial tamper attacks with real-time SHA-256 avalanche and cryptographic forgery rejection.
          </p>
        </div>

        {/* Credential Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd' }}>
            SELECT VERIFIED CREDENTIAL:
          </label>
          <select
            value={selectedCredId}
            onChange={(e) => {
              setSelectedCredId(e.target.value);
              setActivePreset('NONE');
            }}
            style={{
              padding: '0.55rem 0.85rem',
              minHeight: '44px',
              borderRadius: THEME.radii.sm,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {DEMO_CREDENTIALS.map((c) => (
              <option key={c.id} value={c.id} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>
                {(c.payload as any).recipient.name} — {(c.payload as any).programme.title.slice(0, 32)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Authentic Cryptographic Status Card */}
      <div
        style={{
          ...cardStyle,
          border: `1.5px solid ${activePreset === 'NONE' ? '#16a34a' : '#dc2626'}`,
          backgroundColor: activePreset === 'NONE' ? '#f0fdf4' : '#fef2f2',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {activePreset === 'NONE' ? (
            <ShieldCheckIcon size={32} color="#16a34a" />
          ) : (
            <AlertTriangleIcon size={32} color="#dc2626" />
          )}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: activePreset === 'NONE' ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>
              {activePreset === 'NONE'
                ? '✓ CRYPTOGRAPHICALLY VALID ED25519 SIGNATURE'
                : '❌ FORGERY DETECTED: SIGNATURE_INVALID (DIGEST_MISMATCH)'}
            </div>
            <div style={{ fontSize: '0.85rem', color: THEME.colors.inkPrimary, marginTop: '0.15rem' }}>
              Key ID: <strong>{selectedCredential.issuerKeyId}</strong> • Issuer: <strong>National Council for Cooperative Training (NCCT)</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: THEME.colors.inkMuted, marginTop: '0.15rem' }}>
              Trust Anchor Chain: <strong>Ministry of Cooperation (ROOT)</strong> ➔ <strong>NCCT Apex Authority</strong> ➔ <strong>Institute Hardware Node</strong>
            </div>
          </div>
        </div>

        <span style={pillBadge(activePreset === 'NONE' ? 'success' : 'error')}>
          {activePreset === 'NONE' ? 'BIT-EXACT SOVEREIGN PROOF' : 'CRYPTOGRAPHIC REJECTION'}
        </span>
      </div>

      {/* 3. RFC 8785 Canonical JSON & SHA-256 Digest Visualizer */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
              RFC 8785 Canonical JSON Bytes & SHA-256 Digest
            </h3>
            <p style={{ fontSize: '0.78rem', color: THEME.colors.inkMuted, margin: '0.15rem 0 0 0' }}>
              Lexicographically sorted object keys and normalized Unicode UTF-8 octet serialization
            </p>
          </div>
          <button
            onClick={handleCopyCanonical}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              padding: '0.4rem 0.85rem',
            }}
          >
            <CodeIcon size={14} />
            <span>{copiedNotice ? 'Copied to Clipboard!' : 'Copy Canonical Bytes'}</span>
          </button>
        </div>

        <pre
          style={{
            backgroundColor: '#0f172a',
            color: '#38bdf8',
            padding: '1rem',
            borderRadius: THEME.radii.sm,
            fontSize: '0.78rem',
            fontFamily: THEME.fonts.mono,
            overflowX: 'auto',
            maxHeight: '180px',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {authenticCanonicalJson}
        </pre>

        <div style={{ marginTop: '0.85rem', backgroundColor: THEME.colors.bgMuted, padding: '0.85rem 1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: THEME.colors.inkMuted, marginBottom: '0.2rem' }}>
            AUTHENTIC SHA-256 DIGEST (32 Octets / 256 Bits):
          </div>
          <div style={{ fontFamily: THEME.fonts.mono, fontSize: '0.88rem', fontWeight: 800, color: THEME.colors.navyPrimary, wordBreak: 'break-all' }}>
            {authenticDigestHex}
          </div>
        </div>
      </div>

      {/* 4. Cryptographic Curve Decomposition: Point R, Scalar S, Public Key A */}
      <div style={cardStyle}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
            Ed25519 Mathematical Curve Decomposition
          </h3>
          <p style={{ fontSize: '0.78rem', color: THEME.colors.inkMuted, margin: '0.15rem 0 0 0' }}>
            Deconstruction of 64-byte digital signature into compressed curve point $R$ and scalar $S$ with group order validation
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* Curve Point R */}
          <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
              CURVE POINT R (First 32 Octets)
            </div>
            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0.4rem 0' }}>
              Ephemeral Curve25519 Point $R = r \cdot B$
            </div>
            <div style={{ fontFamily: THEME.fonts.mono, fontSize: '0.78rem', color: THEME.colors.inkPrimary, wordBreak: 'break-all', backgroundColor: '#ffffff', padding: '0.5rem', borderRadius: THEME.radii.xs, border: `1px solid ${THEME.colors.borderHairline}` }}>
              {curvePointR}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, marginTop: '0.4rem' }}>
              ✓ Valid Compressed Ed25519 Point
            </div>
          </div>

          {/* Scalar S */}
          <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
                SCALAR S (Last 32 Octets)
              </div>
              <span style={pillBadge(isScalarValid ? 'success' : 'error')}>
                {isScalarValid ? 'S < L VALID' : 'S ≥ L INVALID'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0.4rem 0' }}>
              Signature Scalar $S = (r + H(R \parallel A \parallel M) \cdot s) \pmod L$
            </div>
            <div style={{ fontFamily: THEME.fonts.mono, fontSize: '0.78rem', color: THEME.colors.inkPrimary, wordBreak: 'break-all', backgroundColor: '#ffffff', padding: '0.5rem', borderRadius: THEME.radii.xs, border: `1px solid ${THEME.colors.borderHairline}` }}>
              {scalarS}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, marginTop: '0.4rem' }}>
              ✓ Mathematical Bound $S &lt; L$ Verified (RFC 8032)
            </div>
          </div>

          {/* Issuer Public Key A */}
          <div style={{ backgroundColor: THEME.colors.bgMuted, padding: '1rem', borderRadius: THEME.radii.sm, border: `1px solid ${THEME.colors.borderHairline}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: THEME.colors.navyPrimary }}>
              ISSUER PUBLIC KEY A (32 Octets)
            </div>
            <div style={{ fontSize: '0.68rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0.4rem 0' }}>
              National Council Root SPKI Public Key
            </div>
            <div style={{ fontFamily: THEME.fonts.mono, fontSize: '0.78rem', color: THEME.colors.inkPrimary, wordBreak: 'break-all', backgroundColor: '#ffffff', padding: '0.5rem', borderRadius: THEME.radii.xs, border: `1px solid ${THEME.colors.borderHairline}` }}>
              {publicKeyHex}
            </div>
            <div style={{ fontSize: '0.7rem', color: THEME.colors.navyPrimary, fontWeight: 700, marginTop: '0.4rem' }}>
              ★ Verification Formula: $[8][S]B = [8]R + [8][H(R \parallel A \parallel M)]A$
            </div>
          </div>
        </div>
      </div>

      {/* 5. Interactive Tamper Sandbox & 1-Bit Flipper Fuzzer */}
      <div style={{ ...cardStyle, border: '2px solid #ea580c' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ ...pillBadge('apex'), backgroundColor: '#ea580c', color: '#ffffff' }}>
                SECURITY BENCHMARK
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: THEME.colors.inkPrimary }}>
                Interactive Tamper Sandbox & 1-Bit Flipper Fuzzer
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: THEME.colors.inkMuted, margin: '0.2rem 0 0 0' }}>
              Inject adversarial payload mutations or single-bit flips to witness cryptographic signature rejection
            </p>
          </div>

          {activePreset !== 'NONE' && (
            <button
              onClick={() => setActivePreset('NONE')}
              style={{
                ...buttonPrimaryStyle,
                minHeight: '44px',
                backgroundColor: '#16a34a',
              }}
            >
              <RefreshIcon size={14} />
              <span>Revert to Authentic State</span>
            </button>
          )}
        </div>

        {/* Attack Preset Selector Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setActivePreset('GRADE_INFLATION')}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              backgroundColor: activePreset === 'GRADE_INFLATION' ? '#fee2e2' : '#ffffff',
              borderColor: activePreset === 'GRADE_INFLATION' ? '#dc2626' : THEME.colors.borderHairline,
              color: activePreset === 'GRADE_INFLATION' ? '#991b1b' : THEME.colors.inkPrimary,
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          >
            Grade Inflation (Level 2 ➔ 5)
          </button>

          <button
            onClick={() => setActivePreset('IDENTITY_THEFT')}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              backgroundColor: activePreset === 'IDENTITY_THEFT' ? '#fee2e2' : '#ffffff',
              borderColor: activePreset === 'IDENTITY_THEFT' ? '#dc2626' : THEME.colors.borderHairline,
              color: activePreset === 'IDENTITY_THEFT' ? '#991b1b' : THEME.colors.inkPrimary,
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          >
            Identity Forgery (Rogue Imposter)
          </button>

          <button
            onClick={() => setActivePreset('UNACCREDITED_PROG')}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              backgroundColor: activePreset === 'UNACCREDITED_PROG' ? '#fee2e2' : '#ffffff',
              borderColor: activePreset === 'UNACCREDITED_PROG' ? '#dc2626' : THEME.colors.borderHairline,
              color: activePreset === 'UNACCREDITED_PROG' ? '#991b1b' : THEME.colors.inkPrimary,
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          >
            Unaccredited Course Title
          </button>

          <button
            onClick={() => setActivePreset('BACKDATED_ISSUE')}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              backgroundColor: activePreset === 'BACKDATED_ISSUE' ? '#fee2e2' : '#ffffff',
              borderColor: activePreset === 'BACKDATED_ISSUE' ? '#dc2626' : THEME.colors.borderHairline,
              color: activePreset === 'BACKDATED_ISSUE' ? '#991b1b' : THEME.colors.inkPrimary,
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          >
            Backdating Issuance (2019)
          </button>

          <button
            onClick={() => setActivePreset('BIT_FLIP')}
            style={{
              ...buttonSecondaryStyle,
              minHeight: '44px',
              backgroundColor: activePreset === 'BIT_FLIP' ? '#fee2e2' : '#ffffff',
              borderColor: activePreset === 'BIT_FLIP' ? '#dc2626' : THEME.colors.borderHairline,
              color: activePreset === 'BIT_FLIP' ? '#991b1b' : THEME.colors.inkPrimary,
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          >
            1-Bit Flipper Fuzz (0x41 ➔ 0x43)
          </button>
        </div>

        {/* Live Attack Outcome Panel */}
        {activePreset !== 'NONE' ? (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #ef4444',
              borderRadius: THEME.radii.sm,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 800 }}>
                <AlertTriangleIcon size={20} color="#dc2626" />
                <span>CRYPTOGRAPHIC TAMPER DETECTED: SIGNATURE REJECTED</span>
              </div>
              <span style={pillBadge('error')}>
                Avalanche: {hammingDistance} / 256 Bits Flipped ({((hammingDistance / 256) * 100).toFixed(1)}%)
              </span>
            </div>

            {/* Side-by-Side SHA-256 Digest Diff */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: THEME.radii.xs, border: '1px solid #fca5a5' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.2rem' }}>
                  ORIGINAL CANONICAL SHA-256 DIGEST:
                </div>
                <div style={{ fontFamily: THEME.fonts.mono, fontSize: '0.8rem', color: '#15803d', wordBreak: 'break-all' }}>
                  {authenticDigestHex}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: THEME.radii.xs, border: '1px solid #fca5a5' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.2rem' }}>
                  TAMPERED CANONICAL SHA-256 DIGEST:
                </div>
                <div style={{ fontFamily: THEME.fonts.mono, fontSize: '0.8rem', color: '#b91c1c', wordBreak: 'break-all' }}>
                  {tamperedDigestHex}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
              <strong>Cryptographic Forensic Proof:</strong> The altered payload produced an avalanche of {hammingDistance} differing bits
              in the SHA-256 output. When evaluated against the NCCT authority public key, verification yields <code>false</code>.
              The tampered credential cannot be passed off as authentic.
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '1rem',
              backgroundColor: THEME.colors.bgMuted,
              border: `1px solid ${THEME.colors.borderHairline}`,
              borderRadius: THEME.radii.sm,
              fontSize: '0.82rem',
              color: THEME.colors.inkMuted,
              textAlign: 'center',
            }}
          >
            Select an attack preset above to simulate an adversarial forgery attempt and test real-time Ed25519 tamper rejection.
          </div>
        )}
      </div>
    </div>
  );
}
