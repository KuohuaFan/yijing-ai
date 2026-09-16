import { z } from "zod";
import { nanoid } from "nanoid";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { calculateDivination, createGuide, getHexagram, getReadingCitations, SOURCE_VERSION, yijingLibrary } from "../yijing";
import { createCommentaryAnnotation, createMediaAttachment, createReflectionNote, createShareSnapshot, createSourceReport, getActiveShareSnapshot, getMediaAttachment, listBaziShareSnapshots, listCommentaryAnnotations, listDivinationRecords, listMediaAttachments, listReflectionNotes, revokeShareSnapshot, saveDivinationRecord, saveMediaTranscript, searchPersonalResearch } from "../yijingDb";
import { storageGetSignedUrl, storagePut } from "../storage";
import { transcribeAudio } from "../_core/voiceTranscription";
import { safeMediaFileName, validateMediaInput } from "../mediaUtils";
import { calculateBazi } from "../bazi";
import { createBaziResearchGuide } from "../baziGuide";
import { getBaziEncryptionStatus } from "../baziPrivacy";
import { deleteBaziChart, deleteBaziProfile, getBaziChartForOwner, listBaziProfiles, loadBaziProfile, saveBaziProfile } from "../baziDb";
import { baziSharePayload, sanitizeSharePayload } from "../sharePrivacy";
import { searchCanonicalYijing } from "../unifiedSearch";
import { createPoetryLotGuide } from "../poetryLot";

const lineValuesSchema = z.array(z.union([z.literal(6), z.literal(7), z.literal(8), z.literal(9)])).length(6);

export const libraryRouter = router({
  summary: publicProcedure.query(() => ({
    sourceNotice: yijingLibrary.sourceNotice,
    hexagrams: yijingLibrary.hexagrams.map(({ id, name, lines, anchor }) => ({ id, name, lines, anchor })),
    wingGroups: Array.from(new Set(yijingLibrary.wings.map((wing) => wing.title))),
  })),
  hexagram: publicProcedure.input(z.object({ id: z.number().int().min(1).max(64) })).query(({ input }) => {
    const hexagram = getHexagram(input.id);
    if (!hexagram) throw new Error("找不到此卦資料。");
    return { hexagram, citations: getReadingCitations(hexagram) };
  }),
  wings: publicProcedure.query(() => yijingLibrary.wings),
});

export const searchRouter = router({
  unified: publicProcedure.input(z.object({ query: z.string().trim().min(2).max(120) })).query(async ({ input, ctx }) => ({
    canonical: searchCanonicalYijing(input.query),
    personal: ctx.user ? await searchPersonalResearch(ctx.user.id, input.query) : [],
  })),
});

export const divinationRouter = router({
  calculate: publicProcedure.input(z.object({ lineValues: lineValuesSchema })).mutation(({ input }) => calculateDivination(input.lineValues)),
  save: protectedProcedure.input(z.object({ question: z.string().max(1500).optional(), method: z.enum(["three_coins", "manual"]), lineValues: lineValuesSchema })).mutation(async ({ input, ctx }) => {
    const result = calculateDivination(input.lineValues);
    return saveDivinationRecord({
      userId: ctx.user.id,
      question: input.question,
      method: input.method,
      lineValues: input.lineValues,
      originalHexagramId: result.original.id,
      transformedHexagramId: result.transformed.id,
      movingLines: result.movingLines,
      sourceVersion: SOURCE_VERSION,
    });
  }),
  mine: protectedProcedure.query(({ ctx }) => listDivinationRecords(ctx.user.id)),
});

export const guideRouter = router({
  create: publicProcedure.input(z.object({ question: z.string().min(2).max(1500), lineValues: lineValuesSchema.optional() })).mutation(({ input }) => {
    const result = input.lineValues ? calculateDivination(input.lineValues) : undefined;
    return createGuide(input.question, result);
  }),
});

export const poetryLotRouter = router({
  interpret: publicProcedure.input(z.object({
    poemText: z.string().trim().min(4).max(3000),
    lotNumber: z.string().trim().max(80).optional(),
    temple: z.string().trim().max(160).optional(),
    sourceName: z.string().trim().max(240).optional(),
    sourceUrl: z.string().trim().url().max(500).optional(),
    versionLabel: z.string().trim().max(240).optional(),
    question: z.string().trim().max(800).optional(),
  })).mutation(({ input }) => createPoetryLotGuide(input)),
});

export const baziRouter = router({
  privacyStatus: protectedProcedure.query(() => getBaziEncryptionStatus()),
  calculate: protectedProcedure.input(z.object({
    consent: z.literal(true),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    sect: z.union([z.literal(1), z.literal(2)]).default(2),
    targetYear: z.number().int().min(1900).max(2100),
    daYunGender: z.enum(["male", "female"]).optional(),
    daYunSect: z.union([z.literal(1), z.literal(2)]).optional(),
  })).mutation(({ input }) => calculateBazi(input)),
  save: protectedProcedure.input(z.object({
    saveConsent: z.literal(true),
    label: z.string().trim().min(1).max(120),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    sect: z.union([z.literal(1), z.literal(2)]),
    targetYear: z.number().int().min(1900).max(2100),
    daYunGender: z.enum(["male", "female"]).optional(),
    daYunSect: z.union([z.literal(1), z.literal(2)]).optional(),
    timezone: z.string().trim().min(1).max(64).default("Asia/Taipei"),
    birthPlace: z.string().trim().max(255).optional(),
    guideContent: z.string().max(12000).optional(),
    guideKind: z.enum(["guide", "fallback", "safety_redirect"]).optional(),
  })).mutation(({ input, ctx }) => saveBaziProfile({
    userId: ctx.user.id,
    label: input.label,
    sensitive: { birthDate: `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`, birthTime: `${String(input.hour).padStart(2, "0")}:${String(input.minute).padStart(2, "0")}`, timezone: input.timezone, birthPlace: input.birthPlace },
    baziInput: input,
    guide: { content: input.guideContent, kind: input.guideKind },
  })),
  mine: protectedProcedure.query(({ ctx }) => listBaziProfiles(ctx.user.id)),
  shares: protectedProcedure.query(({ ctx }) => listBaziShareSnapshots(ctx.user.id)),
  load: protectedProcedure.input(z.object({ profileId: z.number().int().positive() })).mutation(({ input, ctx }) => loadBaziProfile(ctx.user.id, input.profileId)),
  deleteProfile: protectedProcedure.input(z.object({ profileId: z.number().int().positive() })).mutation(({ input, ctx }) => deleteBaziProfile(ctx.user.id, input.profileId)),
  deleteChart: protectedProcedure.input(z.object({ chartId: z.number().int().positive() })).mutation(({ input, ctx }) => deleteBaziChart(ctx.user.id, input.chartId)),
  share: protectedProcedure.input(z.object({ chartId: z.number().int().positive(), expiresInDays: z.number().int().min(1).max(365).optional() })).mutation(async ({ input, ctx }) => {
    const { chart, annual } = await getBaziChartForOwner(ctx.user.id, input.chartId);
    const snapshot = await createShareSnapshot({
      userId: ctx.user.id,
      token: nanoid(32),
      title: `八字／流年結構研讀 ${chart.targetYear}`,
      payload: baziSharePayload(chart.chartResult, annual?.annualResult, annual?.guideContent) as Record<string, unknown>,
      includesAttachments: false,
      expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000) : undefined,
    });
    return { id: snapshot.id, token: snapshot.token, expiresAt: snapshot.expiresAt };
  }),
  guide: protectedProcedure.input(z.object({
    consent: z.literal(true),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    sect: z.union([z.literal(1), z.literal(2)]).default(2),
    targetYear: z.number().int().min(1900).max(2100),
    daYunGender: z.enum(["male", "female"]).optional(),
    daYunSect: z.union([z.literal(1), z.literal(2)]).optional(),
    question: z.string().max(800).optional(),
  })).mutation(({ input }) => createBaziResearchGuide(input, input.question)),
});

export const reflectionRouter = router({
  mine: protectedProcedure.query(({ ctx }) => listReflectionNotes(ctx.user.id)),
  create: protectedProcedure.input(z.object({ divinationRecordId: z.number().int().positive().optional(), anchor: z.string().max(255).optional(), title: z.string().min(1).max(255), body: z.string().min(1).max(8000) })).mutation(({ input, ctx }) => createReflectionNote({ ...input, userId: ctx.user.id })),
});

export const commentaryRouter = router({
  list: publicProcedure.input(z.object({ anchor: z.string().min(3).max(255) })).query(({ input, ctx }) => listCommentaryAnnotations(ctx.user?.id, input.anchor)),
  create: protectedProcedure.input(z.object({ anchor: z.string().min(3).max(255), commentator: z.string().min(1).max(120), versionLabel: z.string().min(1).max(120), body: z.string().min(1).max(8000), visibility: z.enum(["private", "shared"]) })).mutation(({ input, ctx }) => createCommentaryAnnotation({ ...input, userId: ctx.user.id })),
});

export const reportRouter = router({
  create: publicProcedure.input(z.object({ reporterEmail: z.string().email().optional(), anchor: z.string().max(255).optional(), message: z.string().min(5).max(4000) })).mutation(({ input }) => createSourceReport(input)),
});

export const mediaRouter = router({
  upload: protectedProcedure.input(z.object({
    chatRecordKey: z.string().min(6).max(128),
    kind: z.enum(["image", "video", "audio"]),
    fileName: z.string().min(1).max(512),
    mimeType: z.string().min(3).max(128),
    sizeBytes: z.number().int().positive(),
    base64: z.string().min(1),
  })).mutation(async ({ input, ctx }) => {
    const data = Buffer.from(input.base64, "base64");
    validateMediaInput(input.kind, input.mimeType, input.sizeBytes, data.length);
    const fileName = safeMediaFileName(input.fileName);
    const stored = await storagePut(`${ctx.user.id}/yijing-media/${input.kind}/${fileName}`, data, input.mimeType);
    return createMediaAttachment({ userId: ctx.user.id, chatRecordKey: input.chatRecordKey, kind: input.kind, fileName, mimeType: input.mimeType, sizeBytes: data.length, storageKey: stored.key, storageUrl: stored.url });
  }),
  mine: protectedProcedure.input(z.object({ chatRecordKey: z.string().min(6).max(128) })).query(({ input, ctx }) => listMediaAttachments(ctx.user.id, input.chatRecordKey)),
  transcribe: protectedProcedure.input(z.object({ attachmentId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const attachment = await getMediaAttachment(ctx.user.id, input.attachmentId);
    if (!attachment || attachment.kind !== "audio") throw new Error("找不到可轉錄的音訊附件。");
    const result = await transcribeAudio({ audioUrl: await storageGetSignedUrl(attachment.storageKey), language: "zh", prompt: "請忠實轉錄繁體中文語音內容。" });
    if ("error" in result) throw new Error(result.error);
    return saveMediaTranscript(ctx.user.id, attachment.id, result.text, result.segments);
  }),
});

export const shareRouter = router({
  create: protectedProcedure.input(z.object({
    title: z.string().min(1).max(255),
    payload: z.record(z.string(), z.unknown()),
    includesAttachments: z.boolean().default(false),
    expiresInDays: z.number().int().min(1).max(365).optional(),
  })).mutation(async ({ input, ctx }) => {
    const snapshot = await createShareSnapshot({
      userId: ctx.user.id,
      token: nanoid(32),
      title: input.title,
      payload: sanitizeSharePayload(input.payload) as Record<string, unknown>,
      includesAttachments: input.includesAttachments,
      expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86400000) : undefined,
    });
    return { id: snapshot.id, token: snapshot.token, expiresAt: snapshot.expiresAt };
  }),
  view: publicProcedure.input(z.object({ token: z.string().min(16).max(80) })).query(async ({ input }) => {
    const snapshot = await getActiveShareSnapshot(input.token);
    if (!snapshot) throw new Error("此分享連結已失效、過期或不存在。");
    return { title: snapshot.title, payload: snapshot.payload, includesAttachments: snapshot.includesAttachments, createdAt: snapshot.createdAt, expiresAt: snapshot.expiresAt };
  }),
  revoke: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => revokeShareSnapshot(ctx.user.id, input.id)),
});
