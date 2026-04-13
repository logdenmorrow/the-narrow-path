import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
export const JOURNAL_ENCRYPTION_VERSION = 1;

function getJournalKey(): Buffer {
  const rawKey = process.env.JOURNAL_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      "Missing JOURNAL_ENCRYPTION_KEY. Expected a base64-encoded 32-byte key."
    );
  }

  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) {
    throw new Error(
      "Invalid JOURNAL_ENCRYPTION_KEY. Expected base64 for exactly 32 bytes (AES-256 key)."
    );
  }

  return key;
}

export type EncryptedJournalEntry = {
  ciphertext: string;
  iv: string;
  authTag: string;
  encryptionVersion: number;
};

export function encryptJournalEntry(entryText: string): EncryptedJournalEntry {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getJournalKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(entryText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    encryptionVersion: JOURNAL_ENCRYPTION_VERSION,
  };
}

export function decryptJournalEntry(payload: {
  ciphertext: string;
  iv: string;
  authTag: string;
  encryptionVersion: number;
}): string {
  if (payload.encryptionVersion !== JOURNAL_ENCRYPTION_VERSION) {
    throw new Error("Unsupported journal encryption version.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getJournalKey(),
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
