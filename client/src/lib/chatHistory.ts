import type { Message } from "@/components/AIChatBox";

export type ResearchCitation = {
  label: string;
  anchor: string;
  excerpt: string;
  sourceLabel: string;
  sourceUrl: string;
  versionLabel: string;
};

export type DivinationSnapshot = {
  question: string;
  lineValues: number[];
  originalId: number;
  originalName: string;
  transformedId: number;
  transformedName: string;
  movingLines: number[];
};

export type ChatAttachment = {
  id?: number;
  kind: "image" | "video" | "audio";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  transcript?: string | null;
  transcriptSegments?: unknown[] | null;
};

export type ChatShare = {
  id: number;
  token: string;
  expiresAt?: string | Date | null;
};

export type ChatRecord = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  starred: boolean;
  project: string;
  tags?: string[];
  messages: Message[];
  citations?: ResearchCitation[];
  divination?: DivinationSnapshot;
  attachments?: ChatAttachment[];
  share?: ChatShare;
};

const STORAGE_KEY = "yijing-chat-records-v1";

function recordId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createChatRecord(partial: Partial<ChatRecord> = {}): ChatRecord {
  const now = Date.now();
  return {
    id: recordId(),
    title: "新的問易",
    createdAt: now,
    updatedAt: now,
    starred: false,
    project: "未分類",
    tags: [],
    messages: [],
    ...partial,
  };
}

export function deriveChatTitle(messages: Message[], fallback = "新的問易") {
  const userQuestion = messages.find((message) => message.role === "user")?.content.trim();
  if (!userQuestion) return fallback;
  return userQuestion.length > 20 ? `${userQuestion.slice(0, 20)}…` : userQuestion;
}

export function loadChatRecords(): ChatRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as ChatRecord[];
    return Array.isArray(parsed) ? parsed.filter((record) => record?.id && Array.isArray(record.messages)) : [];
  } catch {
    return [];
  }
}

export function persistChatRecords(records: ChatRecord[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function appendDivinationHistory(snapshot: DivinationSnapshot) {
  const content = `## 起卦紀錄\n\n**所問**：${snapshot.question || "未填寫問題"}\n\n本卦為 **${snapshot.originalName}（第 ${snapshot.originalId} 卦）**；${snapshot.movingLines.length ? `第 ${snapshot.movingLines.join("、")} 爻為變爻，之卦為 **${snapshot.transformedName}（第 ${snapshot.transformedId} 卦）**。` : "本次未見變爻。"}\n\n六爻（下至上）：${snapshot.lineValues.join("、")}。\n\n> 此紀錄保留供回看原文、比較卦象與進行反思；不構成預測或專業意見。`;
  const record = createChatRecord({
    title: `${snapshot.originalName}卦・起卦紀錄`,
    messages: [{ role: "assistant", content }],
    divination: snapshot,
  });
  const records = [record, ...loadChatRecords()];
  persistChatRecords(records);
  return record;
}
