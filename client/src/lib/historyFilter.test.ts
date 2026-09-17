import { describe, expect, it } from "vitest";
import { createChatRecord } from "./chatHistory";
import { buildHistoryGroups, filterChatRecords } from "./historyFilter";

const records = [
  createChatRecord({ id: "one", title: "乾卦研讀", project: "經典校讀", tags: ["潛龍"], messages: [{ role: "user", content: "請解釋初九。" }] }),
  createChatRecord({ id: "two", title: "八字研究", project: "命理資料", tags: ["流年"], messages: [{ role: "assistant", content: "只作結構研究。" }] }),
];

describe("歷程標籤與全文篩選", () => {
  it("可依標題、專案、標籤與訊息文字搜尋", () => {
    expect(filterChatRecords(records, "乾卦").map((item) => item.id)).toEqual(["one"]);
    expect(filterChatRecords(records, "經典校讀").map((item) => item.id)).toEqual(["one"]);
    expect(filterChatRecords(records, "潛龍").map((item) => item.id)).toEqual(["one"]);
    expect(filterChatRecords(records, "結構研究").map((item) => item.id)).toEqual(["two"]);
  });

  it("忽略前後空白與大小寫，空白查詢保留全部紀錄", () => {
    expect(filterChatRecords(records, "  FLOW ").map((item) => item.id)).toEqual([]);
    expect(filterChatRecords(records, "   ")).toHaveLength(2);
  });

  it("以固定單一路徑建立 Projects、Starred、Current 與 All Chats 群組", () => {
    const grouped = buildHistoryGroups([{ ...records[0]!, starred: true }, records[1]!], "one", "");
    expect(grouped.projects).toEqual(["經典校讀", "命理資料"]);
    expect(grouped.starred.map((item) => item.id)).toEqual(["one"]);
    expect(grouped.active?.id).toBe("one");
    expect(grouped.allChats.map((item) => item.id)).toEqual(["two"]);
  });

  it("在無收藏或無目前紀錄時保留可預期空群組", () => {
    const grouped = buildHistoryGroups(records, "missing", "不存在");
    expect(grouped.starred).toEqual([]);
    expect(grouped.active).toBeUndefined();
    expect(grouped.allChats).toEqual([]);
  });
});
