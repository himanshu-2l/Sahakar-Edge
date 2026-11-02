import { generateKeyPairSync, sign, verify, createPrivateKey, createPublicKey, createHash } from 'node:crypto';
import {
  CanonicalCredentialPayload,
  Credential,
  CredentialStatus,
  CanonicalOfferPayload,
  DigitalOfferLetter,
  CredentialCryptographicProof,
  CredentialTamperSimulationResult,
} from '@sahakar/types';
import { canonicalJsonStringify } from '@sahakar/sync-protocol';

export interface KeyPairPem {
  publicKeyPem: string;
  privateKeyPem: string;
  keyId: string;
}

// In-Memory Issuer Public Key Registry
const ISSUER_PUBLIC_KEY_REGISTRY = new Map<string, string>();

/**
 * Registers an issuer public key PEM by keyId for global proof inspection.
 */
export function registerIssuerPublicKey(keyId: string, publicKeyPem: string): void {
  ISSUER_PUBLIC_KEY_REGISTRY.set(keyId, publicKeyPem);
}

/**
 * Retrieves a registered issuer public key PEM by keyId.
 */
export function getRegisteredIssuerPublicKey(keyId: string): string | undefined {
  return ISSUER_PUBLIC_KEY_REGISTRY.get(keyId);
}

/**
 * Generate a new Ed25519 key pair for digital credential signing.
 */
export function generateIssuerKeyPair(keyId: string = 'issuer-default-v1'): KeyPairPem {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  registerIssuerPublicKey(keyId, publicKey);

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
    keyId,
  };
}

/**
 * Digitally signs a canonical credential payload using an Ed25519 private key.
 */
export function signCredentialPayload(
  payload: CanonicalCredentialPayload,
  privateKeyPem: string,
  keyId: string
): { signatureHex: string; credential: Credential } {
  const canonicalBytes = Buffer.from(canonicalJsonStringify(payload), 'utf8');
  const privateKey = createPrivateKey(privateKeyPem);
  const signatureBuffer = sign(null, canonicalBytes, privateKey);
  const signatureHex = signatureBuffer.toString('hex');

  const credential: Credential = {
    id: payload.credentialId,
    traineeId: payload.recipient.traineeId,
    programmeId: payload.programme.id,
    payload,
    signature: signatureHex,
    issuerKeyId: keyId,
    status: CredentialStatus.ACTIVE,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };

  return { signatureHex, credential };
}

/**
 * Verifies the authenticity and integrity of a signed credential payload using an Ed25519 public key.
 */
export function verifyCredentialSignature(
  payload: CanonicalCredentialPayload,
  signatureHex: string,
  publicKeyPem: string
): boolean {
  try {
    const canonicalBytes = Buffer.from(canonicalJsonStringify(payload), 'utf8');
    const signatureBuffer = Buffer.from(signatureHex, 'hex');
    const publicKey = createPublicKey(publicKeyPem);
    return verify(null, canonicalBytes, publicKey, signatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Encodes a credential into a compact QR-compatible verification payload or verification URL.
 */
export function createQrVerificationPayload(credential: Credential, verifyBaseUrl: string = 'https://verify.sahakar.gov.in'): {
  verificationUrl: string;
  compactPayload: string;
} {
  const compact = {
    id: credential.id,
    sig: credential.signature.slice(0, 32), // truncated preview for QR density
    iss: credential.issuerKeyId,
    iat: credential.issuedAt,
  };

  const compactPayload = Buffer.from(JSON.stringify(compact)).toString('base64url');
  const verificationUrl = `${verifyBaseUrl}/credentials/${credential.id}?sig=${credential.signature}`;

  return { verificationUrl, compactPayload };
}

/**
 * Digitally signs a canonical offer letter payload using an Ed25519 private key.
 */
export function signOfferLetterPayload(
  payload: CanonicalOfferPayload,
  privateKeyPem: string,
  keyId: string,
  verifyBaseUrl: string = 'https://verify.sahakar.gov.in'
): { signatureHex: string; canonicalDigest: string; offer: DigitalOfferLetter } {
  const canonicalJson = canonicalJsonStringify(payload);
  const canonicalBytes = Buffer.from(canonicalJson, 'utf8');
  const canonicalDigest = createHash('sha256').update(canonicalBytes).digest('hex');
  const privateKey = createPrivateKey(privateKeyPem);
  const signatureBuffer = sign(null, canonicalBytes, privateKey);
  const signatureHex = signatureBuffer.toString('hex');

  const verificationUrl = `${verifyBaseUrl}/offers/${payload.offerId}?sig=${signatureHex}`;
  const compactQr = Buffer.from(
    JSON.stringify({
      id: payload.offerId,
      appId: payload.applicationId,
      sig: signatureHex.slice(0, 32),
      iss: keyId,
      iat: payload.issuedAt,
    })
  ).toString('base64url');

  const offer: DigitalOfferLetter = {
    id: payload.offerId,
    applicationId: payload.applicationId,
    jobId: payload.jobId,
    candidateId: payload.candidate.id,
    payload,
    signatureHex,
    signature: signatureHex,
    issuerKeyId: keyId,
    canonicalDigest,
    verificationUrl,
    compactQr,
    status: 'ISSUED',
    issuedAt: payload.issuedAt,
  };

  return { signatureHex, canonicalDigest, offer };
}

/**
 * Verifies the authenticity and integrity of a signed offer letter payload using an Ed25519 public key.
 */
export function verifyOfferLetterSignature(
  payload: CanonicalOfferPayload,
  signatureHex: string,
  publicKeyPem: string
): boolean {
  try {
    const canonicalBytes = Buffer.from(canonicalJsonStringify(payload), 'utf8');
    const signatureBuffer = Buffer.from(signatureHex, 'hex');
    const publicKey = createPublicKey(publicKeyPem);
    return verify(null, canonicalBytes, publicKey, signatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Converts an Ed25519 SPKI PEM public key into a raw 32-byte (64 hex char) curve point hex.
 */
export function ed25519PemToRawPublicKeyHex(publicKeyPem: string): string {
  try {
    const key = createPublicKey(publicKeyPem);
    const der = key.export({ type: 'spki', format: 'der' });
    // In RFC 8410 Ed25519 SPKI DER (44 bytes), the raw 32-byte public key is the trailing 32 bytes
    const rawBytes = der.subarray(der.length - 32);
    return rawBytes.toString('hex');
  } catch {
    return '';
  }
}

/**
 * Inspects a digital credential's cryptographic proof:
 * Computes RFC 8785 canonical JSON, SHA-256 digest hex, extracts Ed25519 signature
 * curve point R (first 32 bytes hex) and scalar S (last 32 bytes hex), extracts public key hex,
 * and verifies cryptographic signature validity.
 */
export function inspectCredentialProof(
  credential: Credential,
  publicKeyPem?: string
): CredentialCryptographicProof {
  // 1. Resolve Public Key PEM
  const resolvedPem =
    publicKeyPem ||
    (credential as any).publicKeyPem ||
    getRegisteredIssuerPublicKey(credential.issuerKeyId);

  // 2. Compute RFC 8785 Canonical JSON and SHA-256 Digest Hex
  const canonicalJson = canonicalJsonStringify(credential.payload);
  const sha256DigestHex = createHash('sha256')
    .update(Buffer.from(canonicalJson, 'utf8'))
    .digest('hex');

  // 3. Decompose Ed25519 Signature into Curve Point R and Scalar S
  const rawSig = (credential.signature || '').trim();
  const cleanSig = rawSig.startsWith('0x') ? rawSig.slice(2) : rawSig;
  const curvePointR = cleanSig.slice(0, 64).padEnd(64, '0');
  const scalarS = cleanSig.slice(64, 128).padEnd(64, '0');

  // 4. Extract 32-Byte Public Key Hex
  let publicKeyHex = '';
  if (resolvedPem) {
    publicKeyHex = ed25519PemToRawPublicKeyHex(resolvedPem);
  } else if ((credential as any).publicKeyHex) {
    publicKeyHex = (credential as any).publicKeyHex;
  }

  // 5. Verify Cryptographic Authenticity
  let isValid = false;
  if (resolvedPem) {
    isValid = verifyCredentialSignature(credential.payload, credential.signature, resolvedPem);
  }

  return {
    canonicalJson,
    sha256DigestHex,
    signatureHex: credential.signature,
    curvePointR,
    scalarS,
    publicKeyHex,
    issuerKeyId: credential.issuerKeyId,
    isValid,
  };
}

/**
 * Simulates a cryptographic tamper on a credential:
 * Clones the credential payload, modifies the specified field, recomputes RFC 8785 canonical
 * JSON and SHA-256 digest, tests signature verification against public key, and asserts
 * cryptographic failure ('SIGNATURE_INVALID: DIGEST_MISMATCH').
 */
export function simulateCredentialTamper(
  credential: Credential,
  tamperedField: string,
  tamperedValue: unknown,
  publicKeyPem?: string
): CredentialTamperSimulationResult {
  const resolvedPem =
    publicKeyPem ||
    (credential as any).publicKeyPem ||
    getRegisteredIssuerPublicKey(credential.issuerKeyId);

  // 1. Deep-clone payload
  const tamperedPayload: any = JSON.parse(JSON.stringify(credential.payload));

  // 2. Extract original value and mutate specified field (supporting nested dot-notation paths)
  const pathParts = tamperedField.split('.');
  let originalTarget: any = credential.payload;
  let mutateTarget: any = tamperedPayload;

  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (originalTarget && originalTarget[part] !== undefined) {
      originalTarget = originalTarget[part];
    }
    if (mutateTarget[part] === undefined || mutateTarget[part] === null) {
      mutateTarget[part] = {};
    }
    mutateTarget = mutateTarget[part];
  }

  const lastKey = pathParts[pathParts.length - 1];
  const originalValue = originalTarget ? originalTarget[lastKey] : undefined;
  mutateTarget[lastKey] = tamperedValue;

  // 3. Compute original and tampered digests
  const originalCanonicalJson = canonicalJsonStringify(credential.payload);
  const originalDigestHex = createHash('sha256')
    .update(Buffer.from(originalCanonicalJson, 'utf8'))
    .digest('hex');

  const tamperedCanonicalJson = canonicalJsonStringify(tamperedPayload);
  const tamperedDigestHex = createHash('sha256')
    .update(Buffer.from(tamperedCanonicalJson, 'utf8'))
    .digest('hex');

  // 4. Test Signature Verification Against Public Key
  let verificationResult = false;
  if (resolvedPem) {
    verificationResult = verifyCredentialSignature(
      tamperedPayload,
      credential.signature,
      resolvedPem
    );
  }

  // 5. Assert Cryptographic Failure
  if (verificationResult === true) {
    throw new Error(
      `Cryptographic Security Breach: Tampered credential payload unexpectedly passed Ed25519 signature verification on field "${tamperedField}"!`
    );
  }

  return {
    tamperedPayload,
    tamperedDigestHex,
    originalDigestHex,
    verificationResult,
    errorReason: 'SIGNATURE_INVALID: DIGEST_MISMATCH',
    fieldModified: tamperedField,
    originalValue,
    modifiedValue: tamperedValue,
  };
}
