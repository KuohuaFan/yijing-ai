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

type SearchDivination = { id: number; userId: number; question: string | null; originalHexagramId: number; transformedHexagramId: number; createdAt: Date };
type SearchReflection = { id: number; userId: number; title: string; body: string; anchor: string | null; updatedAt: Date };
type SearchAnnotation = { id: number; userId: number; commentator: string; versionLabel: string; body: string; anchor: string; visibility: "private" | "shared"; updatedAt: Date };

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

export function buildPersonalSearchHits(input: {
  userId: number;
  query: string;
  divinations: SearchDivination[];
  reflections: SearchReflection[];
  annotations: SearchAnnotation[];
  limit?: number;
}): PersonalSearchHit[] {
  const needle = input.query.trim();
  if (needle.length < 2) return [];
  const lowered = needle.toLocaleLowerCase();
  const matches = (value: string) => value.toLocaleLowerCase().includes(lowered);
  const hits: PersonalSearchHit[] = [];

  input.divinations.filter((record) => record.userId === input.userId).forEach((record) => {
    const text = `${record.question ?? ""}\n本卦 ${record.originalHexagramId}\n之卦 ${record.transformedHexagramId}`;
    if (matches(text)) hits.push({ kind: "divination", title: `起卦紀錄・本卦第 ${record.originalHexagramId} 卦`, excerpt: searchExcerpt(record.question || "未記錄問題", needle), href: `/shelf#divination-${record.id}`, visibility: "private", updatedAt: record.createdAt });
  });
  input.reflections.filter((note) => note.userId === input.userId).forEach((note) => {
    const text = `${note.title}\n${note.body}`;
    if (matches(text)) hits.push({ kind: "reflection", title: note.title, excerpt: searchExcerpt(note.body, needle), anchor: note.anchor ?? undefined, href: note.anchor ? readerHref(note.anchor) : `/shelf#reflection-${note.id}`, visibility: "private", updatedAt: note.updatedAt });
  });
  input.annotations.filter((note) => canViewAnnotation(note, input.userId)).forEach((note) => {
    const text = `${note.commentator}\n${note.versionLabel}\n${note.body}`;
    if (matches(text)) hits.push({ kind: "annotation", title: `${note.commentator}・${note.versionLabel}`, excerpt: searchExcerpt(note.body, needle), anchor: note.anchor, href: readerHref(note.anchor), visibility: note.userId === input.userId ? "private" : "shared", updatedAt: note.updatedAt });
  });
  return hits.sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt)).slice(0, input.limit ?? 30);
}
