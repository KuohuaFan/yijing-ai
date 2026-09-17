import { and, desc, eq } from "drizzle-orm";
import { annualReadings, baziCharts, birthProfiles, sensitiveDataConsents } from "../drizzle/schema";
import { calculateBazi, type BaziInput } from "./bazi";
import { decryptSensitiveBaziInput, encryptSensitiveBaziInput, type SensitiveBaziInput } from "./baziPrivacy";
import { getDb } from "./db";

export const BAZI_STORAGE_POLICY_VERSION = "bazi-private-storage-v1";

type SavedGuide = { content?: string; kind?: "guide" | "fallback" | "safety_redirect" };

function asRecord(value: unknown) {
  return value as Record<string, unknown>;
}

function safeProfile(profile: typeof birthProfiles.$inferSelect) {
  return {
    id: profile.id,
    label: profile.label,
    encryptionVersion: profile.encryptionVersion,
    consentVersion: profile.consentVersion,
    consentedAt: profile.consentedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function saveBaziProfile(input: {
  userId: number;
  label: string;
  sensitive: SensitiveBaziInput;
  baziInput: BaziInput;
  guide?: SavedGuide;
}) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  const now = new Date();
  const encrypted = encryptSensitiveBaziInput(input.sensitive);
  const calculated = calculateBazi(input.baziInput);

  return db.transaction(async (tx) => {
    const profileInsert = await tx.insert(birthProfiles).values({
      userId: input.userId,
      label: input.label,
      encryptedPayload: encrypted.ciphertext,
      encryptionIv: encrypted.iv,
      encryptionAuthTag: encrypted.authTag,
      encryptionVersion: encrypted.encryptionVersion,
      consentVersion: BAZI_STORAGE_POLICY_VERSION,
      consentedAt: now,
    });
    const profileId = Number(profileInsert[0].insertId);
    await tx.insert(sensitiveDataConsents).values({
      userId: input.userId,
      birthProfileId: profileId,
      policyVersion: BAZI_STORAGE_POLICY_VERSION,
      consentedAt: now,
    });
    const chartInsert = await tx.insert(baziCharts).values({
      userId: input.userId,
      birthProfileId: profileId,
      targetYear: input.baziInput.targetYear,
      sect: input.baziInput.sect,
      chartResult: asRecord(calculated),
      engineVersion: calculated.conventions.engine,
    });
    const chartId = Number(chartInsert[0].insertId);
    await tx.insert(annualReadings).values({
      userId: input.userId,
      birthProfileId: profileId,
      baziChartId: chartId,
      targetYear: input.baziInput.targetYear,
      annualResult: asRecord(calculated.annual),
      guideContent: input.guide?.content,
      guideKind: input.guide?.kind,
    });
    const [profile] = await tx.select().from(birthProfiles).where(eq(birthProfiles.id, profileId)).limit(1);
    const [chart] = await tx.select().from(baziCharts).where(eq(baziCharts.id, chartId)).limit(1);
    return { profile: safeProfile(profile), chart, calculated };
  });
}

export async function listBaziProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const profiles = await db.select().from(birthProfiles).where(eq(birthProfiles.userId, userId)).orderBy(desc(birthProfiles.updatedAt));
  return profiles.map(safeProfile);
}

export async function loadBaziProfile(userId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  const [profile] = await db.select().from(birthProfiles).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId))).limit(1);
  if (!profile) throw new Error("找不到此私密排盤資料。\n");
  const sensitive = decryptSensitiveBaziInput({
    encryptionVersion: profile.encryptionVersion as "bazi-aes-256-gcm-v1",
    ciphertext: profile.encryptedPayload,
    iv: profile.encryptionIv,
    authTag: profile.encryptionAuthTag,
  });
  const charts = await db.select().from(baziCharts).where(and(eq(baziCharts.birthProfileId, profileId), eq(baziCharts.userId, userId))).orderBy(desc(baziCharts.createdAt));
  return { profile: safeProfile(profile), sensitive, charts };
}

export async function getBaziChartForOwner(userId: number, chartId: number) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  const [chart] = await db.select().from(baziCharts).where(and(eq(baziCharts.id, chartId), eq(baziCharts.userId, userId))).limit(1);
  if (!chart) throw new Error("找不到此私密排盤結果。\n");
  const [annual] = await db.select().from(annualReadings).where(and(eq(annualReadings.baziChartId, chartId), eq(annualReadings.userId, userId))).orderBy(desc(annualReadings.updatedAt)).limit(1);
  return { chart, annual };
}

export function canDeleteOwnedBaziRecord(record: { userId: number } | undefined, requesterUserId: number) {
  return Boolean(record && record.userId === requesterUserId);
}

export async function deleteBaziProfile(userId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  const [profile] = await db.select({ id: birthProfiles.id, userId: birthProfiles.userId }).from(birthProfiles).where(eq(birthProfiles.id, profileId)).limit(1);
  if (!canDeleteOwnedBaziRecord(profile, userId)) throw new Error("找不到可刪除的私密排盤資料。\n");
  await db.delete(birthProfiles).where(and(eq(birthProfiles.id, profileId), eq(birthProfiles.userId, userId)));
  return { success: true } as const;
}

export async function deleteBaziChart(userId: number, chartId: number) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  const [chart] = await db.select({ id: baziCharts.id, userId: baziCharts.userId }).from(baziCharts).where(eq(baziCharts.id, chartId)).limit(1);
  if (!canDeleteOwnedBaziRecord(chart, userId)) throw new Error("找不到可刪除的私密排盤結果。\n");
  await db.delete(baziCharts).where(and(eq(baziCharts.id, chartId), eq(baziCharts.userId, userId)));
  return { success: true } as const;
}
