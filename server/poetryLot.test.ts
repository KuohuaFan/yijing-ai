import { describe, expect, it } from "vitest";
import { addPoetryLotTraceability, fallbackPoetryLotGuide, isPoetryLotHighRiskQuestion, poetryLotSafetyRedirect } from "./poetryLot";

const input = {
  lotNumber: "12",
  temple: "研究用來源",
  sourceName: "使用者提供之籤詩原文",
  versionLabel: "使用者輸入版本",
  poemText: "前路未明宜審思\n且將疑義問分明\n若逢異文須查證\n莫把詩言作定評",
};

describe("poetry-lot research guide", () => {
  it("以固定六段產生不含事件預測的確定性回退解說", () => {
    const content = fallbackPoetryLotGuide({ ...input, question: "請比較詩中的時序與行動詞。" });
    expect(content).toContain("## 1. 文本與來源定位");
    expect(content).toContain("## 6. 反思問題與限制");
    expect(content).toContain("前路未明宜審思");
    expect(content).toContain("不提供吉凶、事件、醫療、法律、投資");
    expect(content.match(/\*\*原文片段\*\*/g)).toHaveLength(6);
    expect(content.match(/\*\*來源／版本\*\*/g)).toHaveLength(6);
    expect(content.match(/\*\*解釋範圍\*\*/g)).toHaveLength(6);
    expect(content.match(/\*\*不確定性\*\*/g)).toHaveLength(6);
    expect(content).toContain("使用者提供之籤詩原文｜使用者輸入版本");
  });

  it("攔截吉凶、投資與重大事件問題並回傳安全研究轉向", () => {
    expect(isPoetryLotHighRiskQuestion("這支籤能不能告訴我今年會不會破財？")).toBe(true);
    expect(isPoetryLotHighRiskQuestion("請說明此詩的轉折意象。 ")).toBe(false);
    const redirected = poetryLotSafetyRedirect({ ...input, question: "我今年會不會破財？" });
    expect(redirected).toContain("不會把籤詩轉化為個人的吉凶、事件或結果斷言");
    expect(redirected.match(/\*\*不確定性\*\*/g)).toHaveLength(6);
  });

  it("為模型六段輸出固定補上逐段可追溯標籤", () => {
    const raw = [
      "## 1. 文本與來源定位\n定位內容",
      "## 2. 逐句釋義\n逐句內容",
      "## 3. 語詞與典故提示\n典故內容",
      "## 4. 意象與結構閱讀\n結構內容",
      "## 5. 歧義與慣例\n歧義內容",
      "## 6. 反思問題與限制\n限制內容",
    ].join("\n\n");
    const content = addPoetryLotTraceability(raw, input);
    expect(content.match(/^## /gm)).toHaveLength(6);
    expect(content.match(/錨點 #poetry-lot-12/g)).toHaveLength(6);
    expect(content.match(/\*\*解釋範圍\*\*/g)).toHaveLength(6);
  });
});
