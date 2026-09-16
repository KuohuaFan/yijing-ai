import { describe, expect, it } from "vitest";
import { createChatRecord, deriveChatTitle } from "./chatHistory";

describe("沉浸式 Chat 歷程", () => {
  it("建立可保存的新對話，並提供未分類與未收藏預設值", () => {
    const record = createChatRecord();
    expect(record.id).toMatch(/^chat-/);
    expect(record.title).toBe("新的問易");
    expect(record.project).toBe("未分類");
    expect(record.starred).toBe(false);
    expect(record.messages).toEqual([]);
  });

  it("以第一個使用者問題作為歷程標題並維持可讀長度", () => {
    expect(deriveChatTitle([{ role: "assistant", content: "導讀" }, { role: "user", content: "請解釋乾卦九三的終日乾乾" }])).toBe("請解釋乾卦九三的終日乾乾");
    expect(deriveChatTitle([{ role: "user", content: "這是一段超過二十個字元的問題，用於驗證歷程標題是否會適度截斷並保留省略符號" }])).toMatch(/…$/);
  });
});
