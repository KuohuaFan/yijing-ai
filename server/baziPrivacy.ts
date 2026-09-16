import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const BAZI_ENCRYPTION_VERSION = "bazi-aes-256-gcm-v1";

export type EncryptedBaziPayload = {
  encryptionVersion: typeof BAZI_ENCRYPTION_VERSION;
  ciphertext: string;
  iv: string;
  authTag: string;
};

export type SensitiveBaziInput = {
  birthDate: string;
  birthTime: string;
  timezone: string;
  birthPlace?: string;
};

function getBaziEncryptionKey() {
  const encoded = process.env.BAZI_DATA_ENCRYPTION_KEY?.trim();
  if (!encoded || !/^[a-f0-9]{64}$/i.test(encoded)) {
    throw new Error("八字私密資料加密金鑰尚未正確設定。");
  }
  return Buffer.from(encoded, "hex");
}

export function getBaziEncryptionStatus() {
  try {
    return { encryptionReady: getBaziEncryptionKey().length === 32, encryptionVersion: BAZI_ENCRYPTION_VERSION };
  } catch {
    return { encryptionReady: false, encryptionVersion: BAZI_ENCRYPTION_VERSION };
  }
}

export function encryptSensitiveBaziInput(input: SensitiveBaziInput): EncryptedBaziPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getBaziEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(input), "utf8"), cipher.final()]);
  return {
    encryptionVersion: BAZI_ENCRYPTION_VERSION,
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSensitiveBaziInput(payload: EncryptedBaziPayload): SensitiveBaziInput {
  if (payload.encryptionVersion !== BAZI_ENCRYPTION_VERSION) throw new Error("不支援的八字加密版本。");
  const decipher = createDecipheriv("aes-256-gcm", getBaziEncryptionKey(), Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]).toString("utf8")) as SensitiveBaziInput;
}
