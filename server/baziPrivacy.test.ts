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
});
