import { describe, expect, it } from "vitest";
import { calculateDivination, formatGuideContent, getReadingCitations, isHighRiskQuestion, parseGuideFields, yijingLibrary } from "./yijing";

describe("《易經》核心規則", () => {
  it("保有六十四卦與十翼資料節點", () => {
    expect(yijingLibrary.hexagrams).toHaveLength(64);
    expect(yijingLibrary.hexagrams[0]).toMatchObject({ id: 1, name: "乾", lines: "111111" });
    expect(yijingLibrary.hexagrams[63]).toMatchObject({ id: 64, name: "未濟", lines: "010101" });
    expect(yijingLibrary.wings.length).toBeGreaterThan(30);
  });

  it("依由下而上的六爻計算本卦與之卦", () => {
    const result = calculateDivination([6, 7, 8, 9, 7, 8]);
    expect(result.original).toMatchObject({ id: 47, name: "困", lines: "010110" });
    expect(result.transformed).toMatchObject({ id: 60, name: "節", lines: "110010" });
    expect(result.movingLines).toEqual([1, 4]);
    expect(result.lowerTrigram).toBe("坎");
    expect(result.upperTrigram).toBe("兌");
  });

  it("不把少陰與少陽誤認為變爻", () => {
    const result = calculateDivination([7, 8, 7, 8, 7, 8]);
    expect(result.original).toMatchObject({ id: 63, name: "既濟" });
    expect(result.transformed.id).toBe(63);
    expect(result.movingLines).toEqual([]);
  });

  it("為古書閱讀提供帶來源的引文節點", () => {
    const result = calculateDivination([6, 7, 8, 9, 7, 8]);
    const citations = getReadingCitations(result.original, result.movingLines);
    expect(citations.length).toBeGreaterThan(1);
    expect(citations[0]).toMatchObject({ sourceLabel: expect.stringContaining("Project Gutenberg"), anchor: expect.stringContaining("hexagram-") });
  });

  it("將高風險醫療、法律與投資問題導向安全模式", () => {
    expect(isHighRiskQuestion("我是否應該買股票？")).toBe(true);
    expect(isHighRiskQuestion("這個病情應該怎麼治療？")).toBe(true);
    expect(isHighRiskQuestion("請替我預測訴訟判決")).toBe(true);
    expect(isHighRiskQuestion("乾卦九三的文本脈絡是什麼？")).toBe(false);
  });

  it("將 JSON 與 Markdown JSON 穩定解析為 AI 導讀欄位", () => {
    const result = calculateDivination([7, 7, 7, 7, 7, 7]);
    const raw = "```json\n{\"semanticExplanation\":\"語義\",\"structuralContext\":\"結構\",\"ambiguityNote\":\"歧義\",\"reflectionQuestion\":\"反思？\"}\n```";
    expect(parseGuideFields(raw, "乾卦怎麼讀？", result)).toEqual({ semanticExplanation: "語義", structuralContext: "結構", ambiguityNote: "歧義", reflectionQuestion: "反思？" });
  });

  it("將模型的階層式導讀物件正規化為固定欄位", () => {
    const result = calculateDivination([8, 6, 6, 9, 8, 8]);
    const raw = JSON.stringify({
      導讀: {
        第一段: { 標題: "卦象", 內容: "坤下震上。" },
        第二段: { 標題: "卦辭", 內容: "利建侯行師。" },
        第三段: { 標題: "彖傳", 內容: "順以動。" },
        第四段: { 標題: "變爻", 內容: "二三四爻可並讀。" },
      },
    });
    const parsed = parseGuideFields(raw, "豫卦如何閱讀？", result);
    expect(parsed.semanticExplanation).toContain("卦象：坤下震上。");
    expect(parsed.structuralContext).toContain("變爻：二三四爻可並讀。");
    expect(parsed.ambiguityNote).toContain("階層式導讀欄位");
  });

  it("從截斷的階層式導讀回覆擷取可辨識內容", () => {
    const result = calculateDivination([8, 6, 6, 9, 8, 8]);
    const raw = '前言 ```json {"導讀":{"第一段":{"內容":"第一段的文本解說。"},"第二段":{"內容":"第二段的結構解說。"}' ;
    const parsed = parseGuideFields(raw, "豫卦如何閱讀？", result);
    expect(parsed.semanticExplanation).toContain("第一段的文本解說。");
    expect(parsed.semanticExplanation).toContain("第二段的結構解說。");
    expect(parsed.ambiguityNote).toContain("可能在完整結構前截斷");
  });

  it("保留可讀但未結構化的模型導讀文字", () => {
    const result = calculateDivination([7, 7, 7, 7, 7, 7]);
    const parsed = parseGuideFields("此段依乾卦卦辭說明自強不息的閱讀線索。", "乾卦怎麼讀？", result);
    expect(parsed.semanticExplanation).toContain("自強不息");
    expect(parsed.ambiguityNote).toContain("純文字而非固定欄位");
  });

  it("對非 JSON 的模型回應採用完整且安全的固定欄位回退", () => {
    const result = calculateDivination([7, 7, 7, 7, 7, 7]);
    const parsed = parseGuideFields('{"導讀":', "乾卦怎麼讀？", result);
    expect(parsed.semanticExplanation).toContain("模型未以固定欄位回覆");
    expect(parsed.semanticExplanation).not.toContain("這是一段依原文所作的閱讀線索");
    expect(parsed.ambiguityNote).toContain("未採用預期的結構格式");
  });

  it("格式化導讀固定保有六段標題與帶來源引文", () => {
    const result = calculateDivination([7, 7, 7, 7, 7, 7]);
    const citations = getReadingCitations(result.original);
    const content = formatGuideContent("乾卦怎麼讀？", result, citations, { semanticExplanation: "語義", structuralContext: "結構", ambiguityNote: "歧義", reflectionQuestion: "反思？" });
    expect(content).toContain("## 1. 文本定位");
    expect(content).toContain("## 6. 反思問題");
    expect(content).toContain("Project Gutenberg");
  });
});
