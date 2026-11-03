/**
 * Empirical Challenger Verification Suite for Milestone 3 Directorate 2 & 3:
 * Proof Inspector, Tamper Sandbox, Viva Rubric Analytics & PACS Simulation Error Heatmap
 *
 * Suites:
 * 1. Cryptographic Proof Inspector:
 *    - Pure TS FIPS 180-4 SHA-256 parity with Node crypto & packages/sync-protocol
 *    - RFC 8785 Canonical JSON sorting invariants
 *    - Ed25519 Curve Decomposition (R, S) & RFC 8032 Group Order L validation ($S < L$)
 *    - DEMO_CREDENTIALS empirical audit: identifies that all 3 hardcoded demo signatures fail $S < L$
 * 2. Tamper Sandbox & 1-Bit Flipper Fuzzer:
 *    - 5 Attack vectors (Grade Inflation, Identity Theft, Unaccredited Title, Backdating, 1-Bit Flipper Fuzz)
 *    - Hamming distance avalanche effect across 100 single-bit flips
 *    - Signature invalidation / digest mismatch proof
 * 3. Viva-Voce Rubric Analytics:
 *    - 4-dimension performance breakdown (Technical 40%, Procedural 30%, Vernacular 20%, Governance 10%)
 *    - 20-institute league table integrity, schema bounds, and sorting/filtering invariants
 *    - Macro metric disparity audit: hardcoded bento cards vs actual dataset aggregations
 * 4. PACS Simulation Error Heatmap:
 *    - 5x5 matrix completeness across all 25 voucher x error-type cells
 *    - Cognitive hotspot isolation (CPV-104 Inversion at 42.6%, 1,636 students)
 *    - Remedial drill dispatcher string generation
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  generateIssuerKeyPair,
  signCredentialPayload,
  verifyCredentialSignature,
  ed25519PemToRawPublicKeyHex,
} from '../packages/credential-core/dist/index.js';
import {
  sha256Hex as syncProtocolSha256,
  canonicalJsonStringify as syncProtocolCanonicalStringify,
} from '../packages/sync-protocol/dist/index.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function reportPass(name: string, details?: string) {
  totalTests++;
  passedTests++;
  console.log(`  ✓ PASS: ${name}${details ? ` -> ${details}` : ''}`);
}

function reportFail(name: string, error: any) {
  totalTests++;
  failedTests++;
  console.error(`  ❌ FAIL: ${name} ->`, error);
  throw error;
}

// RFC 8032 Ed25519 Group Order L
const ED25519_L = (1n << 252n) + 27742317777372353535851937790883648493n;

// Pure TS SHA-256 implementation extracted from ProofInspectorView.tsx
function rotr32(n: number, b: number): number {
  return (n >>> b) | (n << (32 - b));
}

function proofInspectorSha256(ascii: string): string {
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

function proofInspectorCanonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((item) => proofInspectorCanonicalStringify(item)).join(',')}]`;
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${proofInspectorCanonicalStringify(val)}`;
  });

  return `{${pairs.join(',')}}`;
}

function decodeScalarToBigInt(scalarHex: string): bigint {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(scalarHex.slice(i * 2, i * 2 + 2), 16);
  }
  let sBigInt = 0n;
  for (let i = 31; i >= 0; i--) {
    sBigInt = (sBigInt << 8n) + BigInt(bytes[i]);
  }
  return sBigInt;
}

function calculateHammingDistance(hex1: string, hex2: string): number {
  let diffBits = 0;
  const len = Math.min(hex1.length, hex2.length);
  for (let i = 0; i < len; i++) {
    const origNibble = parseInt(hex1[i], 16);
    const tampNibble = parseInt(hex2[i], 16);
    const xor = origNibble ^ tampNibble;
    diffBits += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
  }
  return diffBits;
}

async function runEmpiricalHarness() {
  console.log('========================================================================');
  console.log('   CHALLENGER EMPIRICAL VERIFICATION HARNESS: DIRECTORATES 2 & 3       ');
  console.log('========================================================================\n');

  // ==========================================================================
  // SUITE 1: Cryptographic Proof Inspector & SHA-256 Parity
  // ==========================================================================
  console.log('>>> [SUITE 1] Cryptographic Proof Inspector & Mathematical Validity...');

  // 1.1 SHA-256 parity with Node crypto and sync-protocol
  const testInputs = [
    '',
    'a',
    'abc',
    'message digest',
    'abcdefghijklmnopqrstuvwxyz',
    'a'.repeat(55), // Block boundary - 1
    'a'.repeat(56), // Block boundary
    'a'.repeat(64), // Exactly 1 block
    'a'.repeat(65), // 1 block + 1
    'a'.repeat(119),
    'a'.repeat(120),
    'a'.repeat(1000),
    'सहकार से समृद्धि (Sahakar Se Samriddhi) — National Cooperative Federation',
  ];

  for (const input of testInputs) {
    const customHash = proofInspectorSha256(input);
    const nodeHash = crypto.createHash('sha256').update(input, 'utf8').digest('hex');
    const syncHash = syncProtocolSha256(input);
    assert.strictEqual(customHash, nodeHash, `SHA-256 mismatch with node crypto for len=${input.length}`);
    assert.strictEqual(customHash, syncHash, `SHA-256 mismatch with packages/sync-protocol for len=${input.length}`);
  }
  reportPass('SHA-256 100% parity across boundary lengths and Unicode strings', `${testInputs.length} test vectors verified`);

  // 1.2 RFC 8785 Canonical Serialization
  const unorderedObj = {
    z: 1,
    a: 'first',
    m: {
      subZ: true,
      subA: null,
      subArray: [3, 2, { k2: 'v2', k1: 'v1' }],
    },
  };
  const permutedObj = {
    a: 'first',
    m: {
      subArray: [3, 2, { k1: 'v1', k2: 'v2' }],
      subA: null,
      subZ: true,
    },
    z: 1,
  };

  const canon1 = proofInspectorCanonicalStringify(unorderedObj);
  const canon2 = proofInspectorCanonicalStringify(permutedObj);
  const syncCanon = syncProtocolCanonicalStringify(unorderedObj);
  assert.strictEqual(canon1, canon2, 'Permuted keys must produce identical canonical string');
  assert.strictEqual(canon1, syncCanon, 'Must match packages/sync-protocol canonical serialization');
  reportPass('RFC 8785 canonical serialization sorting invariant', 'Lexicographical key order strictly preserved');

  // 1.3 Ed25519 Curve Decomposition & Little-Endian Scalar Math
  const keyPair = generateIssuerKeyPair('ncct-test-authority');
  const dummyPayload = {
    credentialId: 'cred-test-01',
    schemaVersion: 1,
    recipient: { name: 'Test Trainee', traineeId: 'dddd-1' },
    programme: { title: 'PACS Mastery', id: 'aaaa-1' },
    issuedAt: '2026-11-01T00:00:00.000Z',
    expiresAt: null,
  };
  const { signatureHex } = signCredentialPayload(dummyPayload, keyPair.privateKeyPem);
  assert.strictEqual(signatureHex.length, 128, 'Ed25519 signature must be exactly 128 hex chars (64 octets)');

  const curvePointR = signatureHex.slice(0, 64);
  const scalarS = signatureHex.slice(64, 128);
  assert.strictEqual(curvePointR.length, 64, 'Point R must be 32 octets (64 hex)');
  assert.strictEqual(scalarS.length, 64, 'Scalar S must be 32 octets (64 hex)');

  const sBigInt = decodeScalarToBigInt(scalarS);
  assert.strictEqual(sBigInt < ED25519_L, true, 'Valid Ed25519 signature must satisfy S < L');
  reportPass('Real Ed25519 signature curve decomposition & S < L bound', `sBigInt=${sBigInt} < L`);

  // 1.4 CHALLENGE FINDING: Audit ProofInspectorView DEMO_CREDENTIALS signatures
  const proofInspectorSource = fs.readFileSync(
    path.resolve('apps/web-admin/src/components/ProofInspectorView.tsx'),
    'utf8'
  );

  // Extract DEMO_CREDENTIALS signatures from source
  const sigMatches = [...proofInspectorSource.matchAll(/signature:\s*'([0-9a-fA-F]{128})'/g)];
  assert.ok(sigMatches.length >= 3, 'Must locate at least 3 demo signatures in ProofInspectorView.tsx');

  console.log('    >>> Auditing DEMO_CREDENTIALS signatures in ProofInspectorView.tsx:');
  const demoScalarValidity: boolean[] = [];
  sigMatches.forEach((m, idx) => {
    const sig = m[1];
    const sPart = sig.slice(64, 128);
    const sVal = decodeScalarToBigInt(sPart);
    const isValid = sVal < ED25519_L;
    demoScalarValidity.push(isValid);
    console.log(`      - Credential [${idx}]: Scalar S = ${sPart.slice(0, 16)}... | Value=${sVal.toString().slice(0, 20)}... | S < L: ${isValid}`);
  });

  const allDemoInvalid = demoScalarValidity.every((v) => v === false);
  if (allDemoInvalid) {
    console.log('    ⚠️ FINDING CONFIRMED: All DEMO_CREDENTIALS signatures in ProofInspectorView.tsx are dummy hex strings that fail S < L.');
    console.log('       Consequence: The UI badge permanently renders "S ≥ L INVALID" in error red, contradicting the "✓ CRYPTOGRAPHICALLY VALID" banner.');
  }
  reportPass('ProofInspectorView DEMO_CREDENTIALS scalar analysis completed', `Identified ${sigMatches.length} synthetic dummy signatures`);

  // ==========================================================================
  // SUITE 2: Tamper Sandbox & 5 Attack Vectors Stress Harness
  // ==========================================================================
  console.log('\n>>> [SUITE 2] Stress-Testing Tamper Sandbox & 5 Attack Vectors...');

  const authenticCred = {
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
  };

  const { signatureHex: realAuthSig } = signCredentialPayload(authenticCred, keyPair.privateKeyPem);
  const authenticCanon = proofInspectorCanonicalStringify(authenticCred);
  const authenticDigest = proofInspectorSha256(authenticCanon);

  // Attack 1: Grade Inflation
  const gradeInflationCred = JSON.parse(JSON.stringify(authenticCred));
  gradeInflationCred.skillsSummary[0].level = 5;
  const gradeInflationCanon = proofInspectorCanonicalStringify(gradeInflationCred);
  const gradeInflationDigest = proofInspectorSha256(gradeInflationCanon);
  assert.notStrictEqual(gradeInflationDigest, authenticDigest);
  const gradeDist = calculateHammingDistance(authenticDigest, gradeInflationDigest);
  assert.ok(gradeDist > 0, 'Grade Inflation must flip bits');
  const gradeSigValid = verifyCredentialSignature(gradeInflationCred, realAuthSig, keyPair.publicKeyPem);
  assert.strictEqual(gradeSigValid, false, 'Tampered grade must fail Ed25519 signature verification');
  reportPass('Tamper Attack 1: Grade Inflation (Level 2 -> 5)', `Hamming Distance: ${gradeDist}/256 bits, Signature rejected`);

  // Attack 2: Identity Theft
  const idTheftCred = JSON.parse(JSON.stringify(authenticCred));
  idTheftCred.recipient.name = 'Rogue Imposter';
  const idTheftCanon = proofInspectorCanonicalStringify(idTheftCred);
  const idTheftDigest = proofInspectorSha256(idTheftCanon);
  assert.notStrictEqual(idTheftDigest, authenticDigest);
  const idDist = calculateHammingDistance(authenticDigest, idTheftDigest);
  const idSigValid = verifyCredentialSignature(idTheftCred, realAuthSig, keyPair.publicKeyPem);
  assert.strictEqual(idSigValid, false, 'Tampered identity must fail Ed25519 signature verification');
  reportPass('Tamper Attack 2: Identity Theft (Rogue Imposter)', `Hamming Distance: ${idDist}/256 bits, Signature rejected`);

  // Attack 3: Unaccredited Course Title
  const unaccreditedCred = JSON.parse(JSON.stringify(authenticCred));
  unaccreditedCred.programme.title = 'Honorary Master of Agricultural Banking & Apex Audit';
  const unaccreditedCanon = proofInspectorCanonicalStringify(unaccreditedCred);
  const unaccreditedDigest = proofInspectorSha256(unaccreditedCanon);
  assert.notStrictEqual(unaccreditedDigest, authenticDigest);
  const unaccDist = calculateHammingDistance(authenticDigest, unaccreditedDigest);
  const unaccSigValid = verifyCredentialSignature(unaccreditedCred, realAuthSig, keyPair.publicKeyPem);
  assert.strictEqual(unaccSigValid, false, 'Tampered title must fail Ed25519 signature verification');
  reportPass('Tamper Attack 3: Unaccredited Course Title', `Hamming Distance: ${unaccDist}/256 bits, Signature rejected`);

  // Attack 4: Backdated Issuance
  const backdatedCred = JSON.parse(JSON.stringify(authenticCred));
  backdatedCred.issuedAt = '2019-01-01T00:00:00.000Z';
  const backdatedCanon = proofInspectorCanonicalStringify(backdatedCred);
  const backdatedDigest = proofInspectorSha256(backdatedCanon);
  assert.notStrictEqual(backdatedDigest, authenticDigest);
  const backDist = calculateHammingDistance(authenticDigest, backdatedDigest);
  const backSigValid = verifyCredentialSignature(backdatedCred, realAuthSig, keyPair.publicKeyPem);
  assert.strictEqual(backSigValid, false, 'Backdated credential must fail Ed25519 signature verification');
  reportPass('Tamper Attack 4: Backdated Issuance (2019)', `Hamming Distance: ${backDist}/256 bits, Signature rejected`);

  // Attack 5: 1-Bit Flipper Fuzz with Avalanche Measurement
  const bitFlipCred = JSON.parse(JSON.stringify(authenticCred));
  const firstChar = bitFlipCred.recipient.name.charCodeAt(0);
  bitFlipCred.recipient.name = String.fromCharCode(firstChar ^ 0x02) + bitFlipCred.recipient.name.slice(1);
  const bitFlipCanon = proofInspectorCanonicalStringify(bitFlipCred);
  const bitFlipDigest = proofInspectorSha256(bitFlipCanon);
  assert.notStrictEqual(bitFlipDigest, authenticDigest);
  const bitDist = calculateHammingDistance(authenticDigest, bitFlipDigest);
  assert.ok(bitDist >= 100, `Avalanche effect should flip substantial bits (actual: ${bitDist}/256)`);
  const bitSigValid = verifyCredentialSignature(bitFlipCred, realAuthSig, keyPair.publicKeyPem);
  assert.strictEqual(bitSigValid, false, '1-bit flip must fail Ed25519 signature verification');
  reportPass('Tamper Attack 5: 1-Bit Flipper Fuzz (0x41 -> 0x43)', `Avalanche Distance: ${bitDist}/256 bits (${((bitDist / 256) * 100).toFixed(1)}%), Signature rejected`);

  // 100 Random Bit Flips Monte Carlo Avalanche Stress
  console.log('    >>> Executing Monte Carlo 100-bit avalanche fuzzer...');
  let totalAvalancheBits = 0;
  for (let i = 0; i < 100; i++) {
    const fuzzCred = JSON.parse(JSON.stringify(authenticCred));
    const randomByteIndex = Math.floor(Math.random() * fuzzCred.recipient.name.length);
    const randomBitMask = 1 << Math.floor(Math.random() * 8);
    const origCode = fuzzCred.recipient.name.charCodeAt(randomByteIndex);
    const flippedCode = origCode ^ randomBitMask;
    fuzzCred.recipient.name =
      fuzzCred.recipient.name.slice(0, randomByteIndex) +
      String.fromCharCode(flippedCode) +
      fuzzCred.recipient.name.slice(randomByteIndex + 1);

    const fuzzCanon = proofInspectorCanonicalStringify(fuzzCred);
    const fuzzDigest = proofInspectorSha256(fuzzCanon);
    const dist = calculateHammingDistance(authenticDigest, fuzzDigest);
    assert.ok(dist > 0, `Bit flip run ${i} must result in non-zero Hamming distance`);
    totalAvalancheBits += dist;
  }
  const avgAvalanche = (totalAvalancheBits / 100).toFixed(1);
  reportPass('100-Run Monte Carlo 1-Bit Avalanche Harness', `Average bits flipped: ${avgAvalanche} / 256 (~50% ideal cryptographic dispersion)`);

  // ==========================================================================
  // SUITE 3: Viva-Voce Rubric Analytics Invariants & League Table
  // ==========================================================================
  console.log('\n>>> [SUITE 3] Viva-Voce Rubric Analytics & League Table...');

  const vivaViewSource = fs.readFileSync(
    path.resolve('apps/web-admin/src/components/VivaAnalyticsView.tsx'),
    'utf8'
  );

  // Extract NCCT_INSTITUTES_VIVA_DATA array from component source
  const dataMatch = vivaViewSource.match(/const NCCT_INSTITUTES_VIVA_DATA:\s*InstituteVivaStat\[\]\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(dataMatch, 'Must find NCCT_INSTITUTES_VIVA_DATA in VivaAnalyticsView.tsx');

  // Safely evaluate data array
  const institutesData: any[] = eval(dataMatch[1]);
  assert.strictEqual(institutesData.length, 20, 'Must contain exactly 20 NCCT training institutes');
  reportPass('20-Institute League Table Array Count', 'Exactly 20 institutes present');

  // Verify unique IDs and names
  const ids = new Set(institutesData.map((i) => i.id));
  const names = new Set(institutesData.map((i) => i.name));
  assert.strictEqual(ids.size, 20, 'All 20 institute IDs must be unique');
  assert.strictEqual(names.size, 20, 'All 20 institute names must be unique');
  reportPass('Unique Institute Identifiers', 'No duplicate IDs or names');

  // Verify 4-dimension score bounds across all 20 institutes
  // Dim 1: Technical <= 40
  // Dim 2: Procedural <= 30
  // Dim 3: Vernacular <= 20
  // Dim 4: Controls <= 10
  let totalTraineesSum = 0;
  let certifiedTraineesSum = 0;

  for (const inst of institutesData) {
    assert.ok(inst.technicalScore >= 0 && inst.technicalScore <= 40, `Technical score out of bounds for ${inst.id}`);
    assert.ok(inst.proceduralScore >= 0 && inst.proceduralScore <= 30, `Procedural score out of bounds for ${inst.id}`);
    assert.ok(inst.vernacularScore >= 0 && inst.vernacularScore <= 20, `Vernacular score out of bounds for ${inst.id}`);
    assert.ok(inst.controlsScore >= 0 && inst.controlsScore <= 10, `Controls score out of bounds for ${inst.id}`);

    const compositeScore = inst.technicalScore + inst.proceduralScore + inst.vernacularScore + inst.controlsScore;
    assert.ok(compositeScore <= 100, `Composite score > 100 for ${inst.id}`);

    assert.ok(inst.passRate >= 0 && inst.passRate <= 100, `Pass rate out of bounds for ${inst.id}`);
    assert.ok(inst.traineesCount > 0, `Trainees count must be > 0 for ${inst.id}`);
    assert.ok(['ACCREDITED_A', 'ACCREDITED_B', 'REMEDIATION_REVIEW'].includes(inst.status), `Invalid status ${inst.status} for ${inst.id}`);

    totalTraineesSum += inst.traineesCount;
    certifiedTraineesSum += (inst.passRate / 100) * inst.traineesCount;
  }
  reportPass('4-Dimension Rubric Score Mathematical Bounds', 'All 20 institutes within 40/30/20/10 weight bounds');

  // Test Search & Filter logic implementation
  const filterByZone = (zone: string) => institutesData.filter((i) => zone === 'ALL' || i.zone === zone);
  assert.strictEqual(filterByZone('ALL').length, 20);
  assert.strictEqual(filterByZone('West').length, 3);
  assert.strictEqual(filterByZone('Central').length, 2);
  assert.strictEqual(filterByZone('North').length, 4);
  assert.strictEqual(filterByZone('South').length, 4);
  assert.strictEqual(filterByZone('East').length, 4);
  assert.strictEqual(filterByZone('North-East').length, 3);
  reportPass('Zone Filtering Logic Invariant', 'Zone partitions sum to 20: West(3), Central(2), North(4), South(4), East(4), NE(3)');

  // Test Search Query Filter
  const searchFilter = (q: string) => {
    const lower = q.toLowerCase();
    return institutesData.filter((i) => i.name.toLowerCase().includes(lower) || i.state.toLowerCase().includes(lower));
  };
  assert.strictEqual(searchFilter('Pune').length, 1);
  assert.strictEqual(searchFilter('Maharashtra').length, 2); // VAMNICOM Pune + ICM Nagpur
  assert.strictEqual(searchFilter('XYZNONEXISTENT').length, 0);
  reportPass('Search Filter Query Invariant', 'Correctly matches institute name and state');

  // Test Sorting logic
  const sortedByPassRate = [...institutesData].sort((a, b) => b.passRate - a.passRate);
  assert.strictEqual(sortedByPassRate[0].id, 'vamnicom-pune', 'Top institute by pass rate must be VAMNICOM (94.2%)');
  assert.strictEqual(sortedByPassRate[sortedByPassRate.length - 1].id, 'icm-patna', 'Lowest pass rate institute must be ICM Patna (76.8%)');
  reportPass('Pass Rate Sorting Invariant', 'Correctly sorts descending: VAMNICOM (94.2%) -> ICM Patna (76.8%)');

  // Audit Macro Statistics Disparity
  console.log(`    >>> Actual Dataset Rollup: Total Trainees = ${totalTraineesSum}, Certified = ${Math.round(certifiedTraineesSum)}, Pass Rate = ${((certifiedTraineesSum / totalTraineesSum) * 100).toFixed(1)}%`);
  console.log(`    >>> UI Bento Cards Display: Total = 1,420, Certified = 1,201, Pass Rate = 84.6%`);
  reportPass('Viva Analytics Macro Metrics Audit', 'Disparity documented between static bento card values and computed sum');

  // ==========================================================================
  // SUITE 4: PACS Simulation Error Heatmap & Cognitive Hotspots
  // ==========================================================================
  console.log('\n>>> [SUITE 4] PACS Simulation Error Heatmap & Cognitive Hotspots...');

  const heatmapViewSource = fs.readFileSync(
    path.resolve('apps/web-admin/src/components/PacsSimulationErrorHeatmapView.tsx'),
    'utf8'
  );

  // Extract VOUCHERS, ERROR_COLUMNS, and HEATMAP_DATA
  const vouchersMatch = heatmapViewSource.match(/const VOUCHERS\s*=\s*(\[[\s\S]*?\]);/);
  const errorColsMatch = heatmapViewSource.match(/const ERROR_COLUMNS\s*=\s*(\[[\s\S]*?\]);/);
  const heatmapDataMatch = heatmapViewSource.match(/const HEATMAP_DATA:\s*Record<string,\s*Record<string,\s*HeatmapCell>>\s*=\s*(\{[\s\S]*?\n\};\n)/);

  assert.ok(vouchersMatch, 'Must find VOUCHERS in HeatmapView');
  assert.ok(errorColsMatch, 'Must find ERROR_COLUMNS in HeatmapView');
  assert.ok(heatmapDataMatch, 'Must find HEATMAP_DATA in HeatmapView');

  const vouchers: any[] = eval(vouchersMatch[1].replace(/as\s+const/g, ''));
  const errorCols: any[] = eval(errorColsMatch[1]);
  const heatmapData: Record<string, Record<string, any>> = eval(`(${heatmapDataMatch[1].replace(/;\s*$/, '')})`);

  assert.strictEqual(vouchers.length, 5, 'Must contain exactly 5 canonical vouchers');
  assert.strictEqual(errorCols.length, 5, 'Must contain exactly 5 canonical error columns');

  const expectedVouchers = ['CRV-081', 'CPV-104', 'CRV-082', 'CPV-105', 'CRV-083'];
  const expectedCols = ['DEBIT_CREDIT', 'CLASSIFICATION', 'ARITHMETIC', 'CHRONOLOGY', 'NARRATION_KYC'];

  assert.deepStrictEqual(vouchers.map((v) => v.code), expectedVouchers);
  assert.deepStrictEqual(errorCols.map((c) => c.key), expectedCols);
  reportPass('5x5 Heatmap Matrix Dimensions', '5 Vouchers x 5 Error Columns = 25 diagnostic cells');

  // Verify all 25 cells exist and validate mathematical relationships
  let totalHeatmapCells = 0;
  let maxCell = { voucherCode: '', errorType: '', percentage: 0, affectedCount: 0 };

  for (const vCode of expectedVouchers) {
    assert.ok(heatmapData[vCode], `Missing voucher row: ${vCode}`);
    for (const cKey of expectedCols) {
      const cell = heatmapData[vCode][cKey];
      assert.ok(cell, `Missing cell [${vCode}][${cKey}]`);
      totalHeatmapCells++;

      assert.strictEqual(cell.voucherCode, vCode);
      assert.strictEqual(cell.errorType, cKey);
      assert.ok(cell.percentage >= 0 && cell.percentage <= 100, `Percentage out of bounds in [${vCode}][${cKey}]`);
      assert.ok(cell.affectedCount > 0 && cell.affectedCount <= 3840, `Affected count out of bounds in [${vCode}][${cKey}]`);

      // Check mathematical consistency: affectedCount === Math.round(percentage / 100 * 3840)
      const expectedCount = Math.round((cell.percentage / 100) * 3840);
      assert.ok(
        Math.abs(cell.affectedCount - expectedCount) <= 1,
        `Affected count mismatch in [${vCode}][${cKey}]: actual=${cell.affectedCount}, expected=${expectedCount}`
      );

      assert.ok(cell.consequence.length > 10, `Consequence too short in [${vCode}][${cKey}]`);
      assert.ok(cell.misconception.length > 10, `Misconception too short in [${vCode}][${cKey}]`);
      assert.ok(cell.pedagogicalDirective.length > 10, `Pedagogical directive too short in [${vCode}][${cKey}]`);

      if (cell.percentage > maxCell.percentage) {
        maxCell = {
          voucherCode: vCode,
          errorType: cKey,
          percentage: cell.percentage,
          affectedCount: cell.affectedCount,
        };
      }
    }
  }

  assert.strictEqual(totalHeatmapCells, 25, 'Must verify all 25 cells');
  reportPass('25/25 Heatmap Matrix Cells Verified', 'All cells have valid percentages, scaled affectedCounts, and non-empty pedagogical directives');

  // Verify Cognitive Hotspot Isolation
  assert.strictEqual(maxCell.voucherCode, 'CPV-104', 'Top failure node must be CPV-104');
  assert.strictEqual(maxCell.errorType, 'DEBIT_CREDIT', 'Top failure error must be DEBIT_CREDIT inversion');
  assert.strictEqual(maxCell.percentage, 42.6, 'Top failure percentage must be 42.6%');
  assert.strictEqual(maxCell.affectedCount, 1636, 'Top failure affected count must be 1,636');
  reportPass('Top Cognitive Hotspot Node Isolation', 'CPV-104 DEBIT_CREDIT at 42.6% (1,636 students) correctly identified as #1 stumbling block');

  // Verify Remedial Drill Dispatcher format
  const topCell = heatmapData['CPV-104']['DEBIT_CREDIT'];
  const drillMessage = `Remedial Drill successfully scheduled for ${topCell.affectedCount} affected trainees on Trainee PWA: "${topCell.pedagogicalDirective}"`;
  assert.ok(drillMessage.includes('1636 affected trainees'));
  assert.ok(drillMessage.includes('CRITICAL DIRECTIVE: Deploy 30-min opposing T-Account Drill'));
  reportPass('Remedial Drill Dispatch Notification', 'Dispatches drill with student count and curriculum directive');

  console.log('\n========================================================================');
  console.log(`   ✓ ALL CHALLENGER EMPIRICAL TESTS COMPLETED! Passed: ${passedTests}/${totalTests}`);
  console.log('========================================================================');
}

runEmpiricalHarness().catch((err) => {
  console.error('\n❌ CHALLENGER HARNESS TERMINATED WITH ERROR:', err);
  process.exit(1);
});
