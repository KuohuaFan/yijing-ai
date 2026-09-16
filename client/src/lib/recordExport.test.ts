import { describe, expect, it } from "vitest";
import { recordSharePayload, recordToMarkdown, recordToPrintHtml, recordToWordHtml } from "./recordExport";
import type { ChatRecord } from "./chatHistory";

const record: ChatRecord = {
  id: "chat-test",
  title: "乾卦研讀",
  createdAt: 1,
  updatedAt: 2,
  starred: false,
  project: "入門",
  tags: ["乾卦", "校讀"],
  messages: [{ role: "user", content: "請解釋乾卦。" }, { role: "assistant", content: "這是一則導讀，請對照卦辭 #hex-1 與初九 #line-1-1。" }],
  citations: [
    { label: "乾・卦辭", anchor: "hex-1", excerpt: "乾：元，亨，利，貞。", sourceLabel: "《易經》電子文本（Project Gutenberg #25501）", sourceUrl: "https://www.gutenberg.org/ebooks/25501", versionLabel: "2008 發布、2021 更新" },
    { label: "乾・初九", anchor: "line-1-1", excerpt: "初九：潛龍，勿用。", sourceLabel: "《易經》電子文本（Project Gutenberg #25501）", sourceUrl: "https://www.gutenberg.org/ebooks/25501", versionLabel: "2008 發布、2021 更新" },
  ],
  divination: { question: "如何研讀？", lineValues: [7, 7, 7, 7, 7, 7], originalId: 1, originalName: "乾", transformedId: 1, transformedName: "乾", movingLines: [] },
  attachments: [{ kind: "audio", fileName: "voice.webm", mimeType: "audio/webm", sizeBytes: 100, storageUrl: "/manus-storage/test", transcript: "語音內容" }],
};

describe("研讀紀錄交付", () => {
  it("Markdown 匯出保留起卦快照、對話與附件逐字稿", () => {
    const markdown = recordToMarkdown(record);
    expect(markdown).toContain("本卦：乾（第 1 卦）");
    expect(markdown).toContain("請解釋乾卦。");
    expect(markdown).toContain("語音逐字稿：語音內容");
    expect(markdown).toContain("#乾卦、#校讀");
    expect(markdown).toContain("引文與來源腳註");
    expect(markdown).toContain("錨點：#hex-1");
    expect(markdown).toContain("錨點：#line-1-1");
    expect(markdown).toContain("來源：《易經》電子文本（Project Gutenberg #25501）");
    expect(markdown).toContain("版本：2008 發布、2021 更新");
  });

  it("建立受控分享快照時可排除附件", () => {
    const privateShare = recordSharePayload(record, false) as unknown as ChatRecord;
    const attachmentShare = recordSharePayload(record, true) as unknown as ChatRecord;
    expect(privateShare.attachments).toEqual([]);
    expect(attachmentShare.attachments).toHaveLength(1);
  });

  it("Word 匯出保留研讀標題、起卦結構與原典錨點腳註", () => {
    const wordHtml = recordToWordHtml(record);
    expect(wordHtml).toContain("yijing-ai-logo_02eb33ab.png");
    expect(wordHtml).toContain("易經 AI｜觀象・卜卦");
    expect(wordHtml).toContain("乾卦研讀");
    expect(wordHtml).toContain("本卦：乾（第 1 卦）");
    expect(wordHtml).toContain("錨點：#hex-1");
    expect(wordHtml).toContain("錨點：#line-1-1");
  });

  it("PDF 列印內容帶有雙卦、變爻與逐筆原典錨點腳註", () => {
    const printHtml = recordToPrintHtml(record);
    expect(printHtml).toContain("yijing-ai-logo_02eb33ab.png");
    expect(printHtml).toContain("易經 AI｜觀象・卜卦");
    expect(printHtml).toContain("本卦・乾卦");
    expect(printHtml).toContain("之卦・乾卦");
    expect(printHtml).toContain("變爻：無");
    expect(printHtml).toContain("來源：《易經》電子文本（Project Gutenberg #25501）");
    expect(printHtml).toContain("錨點：#hex-1");
    expect(printHtml).toContain("錨點：#line-1-1");
    expect(printHtml).toContain("來源：《易經》電子文本（Project Gutenberg #25501）");
    expect(printHtml).toContain("版本：2008 發布、2021 更新");
  });
});
