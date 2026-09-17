import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { decryptSensitiveBaziInput, encryptSensitiveBaziInput } from "./baziPrivacy";

function authenticatedContext(): TrpcContext {
  return {
    user: { id: 1, openId: "privacy-test-user", name: "Privacy Test", email: null, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("八字私密資料加密金鑰", () => {
  it("exposes only readiness through the protected API and can encrypt/decrypt a sensitive payload", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    const status = await caller.bazi.privacyStatus();
    expect(status).toEqual({ encryptionReady: true, encryptionVersion: "bazi-aes-256-gcm-v1" });
    expect(JSON.stringify(status)).not.toContain("BAZI_DATA_ENCRYPTION_KEY");

    const input = { birthDate: "1968-10-14", birthTime: "23:40", timezone: "Asia/Taipei", birthPlace: "Taipei" };
    const encrypted = encryptSensitiveBaziInput(input);
    expect(JSON.stringify(encrypted)).not.toContain(input.birthDate);
    expect(decryptSensitiveBaziInput(encrypted)).toEqual(input);
  });

  it("拒絕未知加密版本，避免以不相容格式解密敏感資料", () => {
    expect(() => decryptSensitiveBaziInput({ encryptionVersion: "unknown", iv: "00", authTag: "00", ciphertext: "00" })).toThrow("不支援");
  });

  it("未明示同意時拒絕即時計算與永久保存", async () => {
    const caller = appRouter.createCaller(authenticatedContext());
    await expect(caller.bazi.calculate({ consent: false, year: 1990, month: 6, day: 7, hour: 9, minute: 11, sect: 2, targetYear: 2026 } as never)).rejects.toThrow();
    await expect(caller.bazi.saveProfile({ saveConsent: false, label: "拒絕保存", year: 1990, month: 6, day: 7, hour: 9, minute: 11, sect: 2, targetYear: 2026, timezone: "Asia/Taipei" } as never)).rejects.toThrow();
  });
});
