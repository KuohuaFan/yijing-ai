export type MediaKind = "image" | "video" | "audio";

export const mediaSchemas: Record<MediaKind, Set<string>> = {
  image: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  video: new Set(["video/mp4", "video/webm"]),
  audio: new Set(["audio/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/mp4"]),
};

export const mediaLimits: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  video: 25 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
};

export function validateMediaInput(kind: MediaKind, mimeType: string, declaredSize: number, actualSize: number) {
  if (!mediaSchemas[kind].has(mimeType)) throw new Error("不支援此附件格式。");
  if (declaredSize > mediaLimits[kind] || actualSize > mediaLimits[kind]) throw new Error("附件超過此類型的大小上限。");
  if (!actualSize || Math.abs(actualSize - declaredSize) > 4) throw new Error("附件內容或大小驗證失敗。");
}

export function safeMediaFileName(value: string) {
  return value.normalize("NFKD").replace(/[^\w.\-()\u4e00-\u9fff]+/g, "_").slice(0, 160) || "attachment";
}
