import { generateKeyPairSync, sign, verify, createPrivateKey, createPublicKey } from 'node:crypto';
import { CanonicalCredentialPayload, Credential, CredentialStatus } from '@sahakar/types';
import { canonicalJsonStringify } from '@sahakar/sync-protocol';

export interface KeyPairPem {
  publicKeyPem: string;
  privateKeyPem: string;
  keyId: string;
}

/**
 * Generate a new Ed25519 key pair for digital credential signing.
 */
export function generateIssuerKeyPair(keyId: string = 'issuer-default-v1'): KeyPairPem {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

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
