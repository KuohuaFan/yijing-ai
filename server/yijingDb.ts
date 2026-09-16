import { and, desc, eq, like } from "drizzle-orm";
import { commentaryAnnotations, divinationRecords, mediaAttachments, reflectionNotes, shareSnapshots, sourceReports } from "../drizzle/schema";
import { getDb } from "./db";
import { isShareSnapshotActive } from "./shareUtils";
import { canViewAnnotation } from "./commentaryUtils";

export type PersonalSearchHit = {
  kind: "divination" | "reflection" | "annotation";
  title: string;
  excerpt: string;
  anchor?: string;
  href: string;
  visibility: "private" | "shared";
  updatedAt: Date;
};

function searchExcerpt(value: string, query: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const index = normalized.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0) return normalized.slice(0, 180);
  const start = Math.max(0, index - 42);
  const end = Math.min(normalized.length, index + query.length + 126);
  return `${start ? "…" : ""}${normalized.slice(start, end)}${end < normalized.length ? "…" : ""}`;
}

function readerHref(anchor: string) {
  const id = anchor.match(/^hexagram-(\d+)-/)?.[1];
  return id ? `/reader/${id}#${anchor}` : "/library";
}

export async function searchPersonalResearch(userId: number, query: string, limit = 30): Promise<PersonalSearchHit[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];
  const db = await getDb();
  if (!db) return [];
  const lowered = needle.toLocaleLowerCase();
  const [divinations, reflections, annotations] = await Promise.all([
    db.select().from(divinationRecords).where(eq(divinationRecords.userId, userId)).orderBy(desc(divinationRecords.createdAt)).limit(80),
    db.select().from(reflectionNotes).where(eq(reflectionNotes.userId, userId)).orderBy(desc(reflectionNotes.updatedAt)).limit(120),
    db.select().from(commentaryAnnotations).orderBy(desc(commentaryAnnotations.updatedAt)).limit(240),
  ]);
  const matches = (value: string) => value.toLocaleLowerCase().includes(lowered);
  const hits: PersonalSearchHit[] = [];
  divinations.forEach((record) => {
    const text = `${record.question ?? ""}\n本卦 ${record.originalHexagramId}\n之卦 ${record.transformedHexagramId}`;
    if (matches(text)) hits.push({ kind: "divination", title: `起卦紀錄・本卦第 ${record.originalHexagramId} 卦`, excerpt: searchExcerpt(record.question || "未記錄問題", needle), href: `/shelf#divination-${record.id}`, visibility: "private", updatedAt: record.createdAt });
  });
  reflections.forEach((note) => {
    const text = `${note.title}\n${note.body}`;
    if (matches(text)) hits.push({ kind: "reflection", title: note.title, excerpt: searchExcerpt(note.body, needle), anchor: note.anchor ?? undefined, href: note.anchor ? `${readerHref(note.anchor)}` : `/shelf#reflection-${note.id}`, visibility: "private", updatedAt: note.updatedAt });
  });
  annotations.filter((note) => canViewAnnotation(note, userId)).forEach((note) => {
    const text = `${note.commentator}\n${note.versionLabel}\n${note.body}`;
    if (matches(text)) hits.push({ kind: "annotation", title: `${note.commentator}・${note.versionLabel}`, excerpt: searchExcerpt(note.body, needle), anchor: note.anchor, href: readerHref(note.anchor), visibility: note.userId === userId ? "private" : "shared", updatedAt: note.updatedAt });
  });
  return hits.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt)).slice(0, limit);
}

export async function saveDivinationRecord(input: {
  userId: number;
  question?: string;
  method: "three_coins" | "manual";
  lineValues: number[];
  originalHexagramId: number;
  transformedHexagramId: number;
  movingLines: number[];
  sourceVersion: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  await db.insert(divinationRecords).values(input);
  return (await db.select().from(divinationRecords).where(eq(divinationRecords.userId, input.userId)).orderBy(desc(divinationRecords.id)).limit(1))[0];
}

export async function listDivinationRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(divinationRecords).where(eq(divinationRecords.userId, userId)).orderBy(desc(divinationRecords.createdAt)).limit(60);
}

export async function createReflectionNote(input: {
  userId: number;
  divinationRecordId?: number;
  anchor?: string;
  title: string;
  body: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  await db.insert(reflectionNotes).values(input);
  return (await db.select().from(reflectionNotes).where(eq(reflectionNotes.userId, input.userId)).orderBy(desc(reflectionNotes.id)).limit(1))[0];
}

export async function listReflectionNotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reflectionNotes).where(eq(reflectionNotes.userId, userId)).orderBy(desc(reflectionNotes.updatedAt)).limit(100);
}

export async function createSourceReport(input: { reporterEmail?: string; anchor?: string; message: string }) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  await db.insert(sourceReports).values(input);
  return { success: true };
}

export async function createMediaAttachment(input: {
  userId: number;
  chatRecordKey: string;
  kind: "image" | "video" | "audio";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  await db.insert(mediaAttachments).values(input);
  return (await db.select().from(mediaAttachments).where(eq(mediaAttachments.userId, input.userId)).orderBy(desc(mediaAttachments.id)).limit(1))[0];
}

export async function listMediaAttachments(userId: number, chatRecordKey: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaAttachments).where(eq(mediaAttachments.userId, userId)).orderBy(desc(mediaAttachments.createdAt)).then((rows) => rows.filter((row) => row.chatRecordKey === chatRecordKey));
}

export async function getMediaAttachment(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(mediaAttachments).where(eq(mediaAttachments.id, id)).limit(1);
  return rows[0]?.userId === userId ? rows[0] : undefined;
}

export async function saveMediaTranscript(userId: number, id: number, transcript: string, segments: unknown[]) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  const attachment = await getMediaAttachment(userId, id);
  if (!attachment) throw new Error("找不到可轉錄的附件。");
  await db.update(mediaAttachments).set({ transcript, transcriptSegments: segments }).where(eq(mediaAttachments.id, id));
  return { ...attachment, transcript, transcriptSegments: segments };
}

export async function createShareSnapshot(input: {
  userId: number;
  token: string;
  title: string;
  payload: Record<string, unknown>;
  includesAttachments: boolean;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  await db.insert(shareSnapshots).values(input);
  return (await db.select().from(shareSnapshots).where(eq(shareSnapshots.token, input.token)).limit(1))[0];
}

export async function getActiveShareSnapshot(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const row = (await db.select().from(shareSnapshots).where(eq(shareSnapshots.token, token)).limit(1))[0];
  if (!row || !isShareSnapshotActive(row)) return undefined;
  return row;
}

export async function revokeShareSnapshot(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  const rows = await db.select().from(shareSnapshots).where(eq(shareSnapshots.id, id)).limit(1);
  if (!rows[0] || rows[0].userId !== userId) throw new Error("找不到可撤銷的分享連結。");
  await db.update(shareSnapshots).set({ isRevoked: true }).where(eq(shareSnapshots.id, id));
  return { success: true };
}

export async function listBaziShareSnapshots(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: shareSnapshots.id, title: shareSnapshots.title, token: shareSnapshots.token, expiresAt: shareSnapshots.expiresAt, isRevoked: shareSnapshots.isRevoked, createdAt: shareSnapshots.createdAt })
    .from(shareSnapshots)
    .where(and(eq(shareSnapshots.userId, userId), like(shareSnapshots.title, "八字／流年結構研讀%")))
    .orderBy(desc(shareSnapshots.createdAt))
    .limit(20);
}

export async function listCommentaryAnnotations(userId: number | undefined, anchor: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(commentaryAnnotations).where(eq(commentaryAnnotations.anchor, anchor)).orderBy(desc(commentaryAnnotations.updatedAt));
  return rows.filter((row) => canViewAnnotation(row, userId));
}

export async function createCommentaryAnnotation(input: { userId: number; anchor: string; commentator: string; versionLabel: string; body: string; visibility: "private" | "shared" }) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用，請稍後再試。");
  await db.insert(commentaryAnnotations).values(input);
  return (await db.select().from(commentaryAnnotations).where(eq(commentaryAnnotations.userId, input.userId)).orderBy(desc(commentaryAnnotations.id)).limit(1))[0];
}
