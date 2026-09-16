import { invokeLLM, listLLMModels } from "./_core/llm";
import { hexagrams, type HexagramText, wings, SOURCE_NOTICE } from "./yijingText";

export const SOURCE_VERSION = "Project Gutenberg #25501《易經》；2008 發布、2021 更新";
export const GUIDE_HEADINGS = ["文本定位", "原文引句", "語義解說", "結構脈絡", "歧義提示", "反思問題"] as const;

const trigramNames: Record<string, string> = {
  "111": "乾",
  "000": "坤",
  "100": "震",
  "010": "坎",
  "001": "艮",
  "011": "巽",
  "101": "離",
  "110": "兌",
};

const highRiskPattern = /(診斷|治療|病情|癌|手術|藥物|懷孕|投資|買股|股票|交易|基金|虛擬貨幣|加密貨幣|訴訟|判決|法律意見|契約|賭博|自殺|自傷)/i;

export type Citation = {
  label: string;
  anchor: string;
  excerpt: string;
  sourceLabel: string;
  sourceUrl: string;
  versionLabel: string;
};

export type DivinationResult = {
  lineValues: number[];
  linePattern: string;
  transformedPattern: string;
  movingLines: number[];
  original: HexagramText;
  transformed: HexagramText;
  lowerTrigram: string;
  upperTrigram: string;
};

export type GuideFields = {
  semanticExplanation: string;
  structuralContext: string;
  ambiguityNote: string;
  reflectionQuestion: string;
};

const GUIDE_RESPONSE_TIMEOUT_MS = 22_000;

function withGuideTimeout<T>(task: Promise<T>) {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Guide response timed out")), GUIDE_RESPONSE_TIMEOUT_MS);
    }),
  ]);
}

export function getHexagram(id: number) {
  return hexagrams.find((hexagram) => hexagram.id === id) ?? null;
}

export function getHexagramByPattern(pattern: string) {
  return hexagrams.find((hexagram) => hexagram.lines === pattern) ?? null;
}

function resultFromHexagram(hexagram: HexagramText): DivinationResult {
  const lineValues = hexagram.lines.split("").map((line) => (line === "1" ? 7 : 8));
  return calculateDivination(lineValues);
}

function inferHexagramFromQuestion(question: string) {
  const normalized = question.replace(/\s/g, "");
  return hexagrams.find((hexagram) => normalized.includes(`${hexagram.name}卦`) || normalized.includes(`第${hexagram.id}卦`)) ?? null;
}

export function calculateDivination(lineValues: number[]): DivinationResult {
  if (lineValues.length !== 6 || lineValues.some((value) => ![6, 7, 8, 9].includes(value))) {
    throw new Error("起卦必須包含由下而上排列的六個有效爻值（6、7、8、9）。");
  }

  const linePattern = lineValues.map((value) => (value === 7 || value === 9 ? "1" : "0")).join("");
  const transformedPattern = lineValues
    .map((value) => (value === 6 ? "1" : value === 9 ? "0" : value === 7 ? "1" : "0"))
    .join("");
  const original = getHexagramByPattern(linePattern);
  const transformed = getHexagramByPattern(transformedPattern);

  if (!original || !transformed) {
    throw new Error("找不到相應卦象資料。");
  }

  return {
    lineValues,
    linePattern,
    transformedPattern,
    movingLines: lineValues.flatMap((value, index) => (value === 6 || value === 9 ? [index + 1] : [])),
    original,
    transformed,
    lowerTrigram: trigramNames[linePattern.slice(0, 3)] ?? "—",
    upperTrigram: trigramNames[linePattern.slice(3, 6)] ?? "—",
  };
}

function lineLabel(pattern: string, index: number) {
  const numbers = ["初", "二", "三", "四", "五", "上"];
  const polarity = pattern[index] === "1" ? "九" : "六";
  if (index === 0) return `初${polarity}`;
  if (index === 5) return `上${polarity}`;
  return `${polarity}${numbers[index]}`;
}

function shortExcerpt(value: string, maxLength = 240) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}…` : normalized;
}

export function getReadingCitations(hexagram: HexagramText, movingLines: number[] = []): Citation[] {
  const lines = hexagram.fullText.split("\n").map((line) => line.trim()).filter(Boolean);
  const citations: Citation[] = [];
  const judgment = lines.find((line) => line.startsWith(`${hexagram.name}：`));
  const shared = {
    sourceLabel: hexagram.sourceLabel,
    sourceUrl: hexagram.sourceUrl,
    versionLabel: hexagram.versionLabel,
  };

  if (judgment) {
    citations.push({ label: `${hexagram.name}・卦辭`, anchor: `${hexagram.anchor}-judgment`, excerpt: shortExcerpt(judgment), ...shared });
  }

  movingLines.forEach((position) => {
    const label = lineLabel(hexagram.lines, position - 1);
    const line = lines.find((item) => item.startsWith(`${label}：`) || item.startsWith(`${label}曰`));
    if (line) citations.push({ label: `${hexagram.name}・${label}`, anchor: `${hexagram.anchor}-line-${position}`, excerpt: shortExcerpt(line), ...shared });
  });

  const tuanIndex = lines.findIndex((line) => line.startsWith("彖曰"));
  if (tuanIndex >= 0) {
    citations.push({ label: `${hexagram.name}・彖傳`, anchor: `${hexagram.anchor}-tuan`, excerpt: shortExcerpt(lines.slice(tuanIndex, tuanIndex + 3).join(" ")), ...shared });
  }

  const imageIndex = lines.findIndex((line, index) => index > tuanIndex && line.startsWith("象曰"));
  if (imageIndex >= 0) {
    citations.push({ label: `${hexagram.name}・大象`, anchor: `${hexagram.anchor}-image`, excerpt: shortExcerpt(lines[imageIndex]), ...shared });
  }

  return citations.slice(0, 5);
}

function requestedLinePositions(question: string, hexagram: HexagramText) {
  const normalized = question.replace(/\s/g, "");
  return Array.from({ length: 6 }, (_, index) => index + 1).filter((position) => normalized.includes(lineLabel(hexagram.lines, position - 1)));
}

function fallbackGuide(question: string, result: DivinationResult, citations: Citation[]) {
  const quotation = citations.map((citation) => `> **${citation.label}**　${citation.excerpt}\n> [${citation.sourceLabel}](${citation.sourceUrl})`).join("\n\n");
  return `## 1. 文本定位\n本次閱讀以 **${result.original.name}（第 ${result.original.id} 卦）** 為本卦${result.movingLines.length ? `，第 ${result.movingLines.join("、")} 爻為變爻，之卦為 **${result.transformed.name}（第 ${result.transformed.id} 卦）**` : "，本次未見變爻"}。\n\n## 2. 原文引句\n${quotation}\n\n## 3. 語義解說\n目前無法取得模型回應，請先以卦辭與動爻為閱讀重心；本平台不將文本轉化為保證性的預測。\n\n## 4. 結構脈絡\n本卦下卦為 **${result.lowerTrigram}**、上卦為 **${result.upperTrigram}**。變爻提示讀者可比較本卦與之卦的結構差異。\n\n## 5. 歧義提示\n不同注家與詮釋傳統可能對同一卦爻有不同取向；上述引文是閱讀根據，不構成唯一正解。\n\n## 6. 反思問題\n就你的提問「${question}」，哪些條件已可觀察、哪些尚待釐清？你可以如何把原文中關於時位、進退或慎思的線索轉成下一步的事實查證？`;
}

function normalizeNestedGuide(parsed: Record<string, unknown>, question: string, result: DivinationResult): GuideFields | null {
  const guide = parsed["導讀"];
  if (!guide || typeof guide !== "object" || Array.isArray(guide)) return null;

  const sections = Object.values(guide as Record<string, unknown>)
    .map((value) => {
      if (typeof value === "string") return value.trim();
      if (!value || typeof value !== "object" || Array.isArray(value)) return "";
      const entry = value as Record<string, unknown>;
      const title = typeof entry["標題"] === "string" ? entry["標題"].trim() : "";
      const content = typeof entry["內容"] === "string" ? entry["內容"].trim() : "";
      return [title, content].filter(Boolean).join("：");
    })
    .filter(Boolean);

  if (!sections.length) return null;
  return {
    semanticExplanation: sections.slice(0, 3).join("\n\n"),
    structuralContext: sections.slice(3).join("\n\n") || `本卦下卦為${result.lowerTrigram}、上卦為${result.upperTrigram}；可與之卦${result.transformed.name}比較變爻所在位置。`,
    ambiguityNote: "模型以階層式導讀欄位回覆，系統已保守轉為固定閱讀段落；內容仍應以所附原文引句為優先核對依據，不構成唯一詮釋。",
    reflectionQuestion: `回到所附原文後，對「${question}」而言，這些段落中哪一個用語或爻位最值得再作文本核對？`,
  };
}

function normalizePartialNestedGuide(raw: string, question: string, result: DivinationResult): GuideFields | null {
  const fragments = Array.from(raw.matchAll(/"內容"\s*:\s*"((?:\\.|[^"\\])*)"/g))
    .map((match) => {
      try {
        return JSON.parse(`"${match[1]}"`) as string;
      } catch {
        return match[1].replace(/\\n/g, "\n").replace(/\\"/g, "\"");
      }
    })
    .map((value) => value.trim())
    .filter(Boolean);

  if (!fragments.length) return null;
  return {
    semanticExplanation: fragments.slice(0, 3).join("\n\n"),
    structuralContext: fragments.slice(3).join("\n\n") || `本卦下卦為${result.lowerTrigram}、上卦為${result.upperTrigram}；可與之卦${result.transformed.name}比較變爻所在位置。`,
    ambiguityNote: "模型以階層式內容回覆且可能在完整結構前截斷；系統僅保留已可辨識的文本片段，並以所附原文引句作為優先核對依據。",
    reflectionQuestion: `回到所附原文後，對「${question}」而言，哪些已回覆的文本片段最需要再與卦辭或動爻核對？`,
  };
}

function normalizeProseGuide(raw: string, question: string, result: DivinationResult): GuideFields | null {
  const prose = raw
    .replace(/```(?:json)?/gi, "")
    .replace(/^\s*json\s*$/gim, "")
    .replace(/\s*```/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!prose || /[{}[\]]/.test(prose)) return null;

  return {
    semanticExplanation: prose.length > 1500 ? `${prose.slice(0, 1500)}…` : prose,
    structuralContext: `本卦下卦為${result.lowerTrigram}、上卦為${result.upperTrigram}${result.movingLines.length ? `；第${result.movingLines.join("、")}爻為變爻，可與之卦${result.transformed.name}並讀` : "；本次未見變爻"}。`,
    ambiguityNote: "模型以純文字而非固定欄位回覆；系統已保留可讀導讀，但仍應以所附原文引句作為優先核對依據，不構成唯一詮釋。",
    reflectionQuestion: `回到所附原文後，對「${question}」而言，哪一個字詞或爻位最值得再作文本核對？`,
  };
}

export function parseGuideFields(raw: string, question: string, result: DivinationResult): GuideFields {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  const jsonPayload = firstBrace >= 0 && lastBrace > firstBrace ? trimmed.slice(firstBrace, lastBrace + 1) : trimmed;
  try {
    const parsed = JSON.parse(jsonPayload) as Partial<GuideFields>;
    if ([parsed.semanticExplanation, parsed.structuralContext, parsed.ambiguityNote, parsed.reflectionQuestion].every((item) => typeof item === "string")) {
      return parsed as GuideFields;
    }
    const normalizedNested = normalizeNestedGuide(parsed as Record<string, unknown>, question, result);
    if (normalizedNested) return normalizedNested;
  } catch {
    // The deterministic guide below prevents raw half-structured model output from reaching readers.
  }
  const normalizedPartial = normalizePartialNestedGuide(raw, question, result);
  if (normalizedPartial) return normalizedPartial;
  const normalizedProse = normalizeProseGuide(raw, question, result);
  if (normalizedProse) return normalizedProse;
  return {
    semanticExplanation: `模型未以固定欄位回覆；本段改以所附卦辭與動爻作保守導讀。請以「${result.original.name}」的卦辭、變爻與彖傳為優先閱讀材料，不把卦象化為保證性的結論。`,
    structuralContext: `本卦下卦為${result.lowerTrigram}、上卦為${result.upperTrigram}${result.movingLines.length ? `；第${result.movingLines.join("、")}爻為變爻，可與之卦${result.transformed.name}並讀` : "；本次未見變爻"}。`,
    ambiguityNote: "模型回應未採用預期的結構格式；此段仍僅可視為依所附引文提出的閱讀線索，不構成唯一詮釋。",
    reflectionQuestion: `回到所附原文後，對「${question}」而言，哪一個字詞或爻位最需要再加以核對？`,
  };
}

export function formatGuideContent(question: string, result: DivinationResult, citations: Citation[], parsed: GuideFields) {
  const quotation = citations.map((citation) => `> **${citation.label}**　${citation.excerpt}\n> [${citation.sourceLabel}](${citation.sourceUrl})`).join("\n\n");
  return `## 1. 文本定位\n本次導讀以 **${result.original.name}（第 ${result.original.id} 卦）** 為本卦${result.movingLines.length ? `，第 ${result.movingLines.join("、")} 爻為變爻，之卦為 **${result.transformed.name}（第 ${result.transformed.id} 卦）**` : "，本次未見變爻"}。\n\n## 2. 原文引句\n${quotation}\n\n## 3. 語義解說\n${parsed.semanticExplanation}\n\n## 4. 結構脈絡\n${parsed.structuralContext}\n\n## 5. 歧義提示\n${parsed.ambiguityNote}\n\n## 6. 反思問題\n${parsed.reflectionQuestion}`;
}

export function isHighRiskQuestion(question: string) {
  return highRiskPattern.test(question);
}

export async function createGuide(question: string, result?: DivinationResult) {
  if (isHighRiskQuestion(question)) {
    return {
      kind: "safety_redirect" as const,
      content: `## 1. 文本定位\n你提出的問題涉及醫療、法律、投資或其他重大決策領域。此平台可協助閱讀《易經》文本，但不會依卦提供診斷、法律結論、投資交易或保證性的預測。\n\n## 2. 原文引句\n你仍可使用讀本查閱卦辭、爻辭與《繫辭》中的相關段落。\n\n## 3. 語義解說\n若你希望繼續閱讀，我們可以改以「文本中如何理解慎思、時位、進退」為題，提供來源明示的導讀。\n\n## 4. 結構脈絡\n重大決策通常需要事實、專業意見與多種風險評估；古典文本導讀不應取代這些程序。\n\n## 5. 歧義提示\n任何把卦象直接化為具體醫療、法律或投資指令的做法，都超出本站可驗證的閱讀範圍。\n\n## 6. 反思問題\n目前有哪些可查證的事實？你需要諮詢哪一位合格專業人士，才能再作決定？`,
      citations: [],
    };
  }

  const inferred = inferHexagramFromQuestion(question);
  const selected = result ?? (inferred ? resultFromHexagram(inferred) : calculateDivination([7, 8, 7, 8, 7, 8]));
  const targetLines = Array.from(new Set([...selected.movingLines, ...requestedLinePositions(question, selected.original)]));
  const citations = getReadingCitations(selected.original, targetLines);
  const sourcePacket = citations.map((citation) => `${citation.label}\n${citation.excerpt}\n來源：${citation.sourceLabel}；錨點：${citation.anchor}`).join("\n\n");

  try {
    const { data: models } = await listLLMModels();
    const preferred = ["claude-haiku-4-5", "gpt-5-mini", "gpt-5-nano"];
    const model = preferred.find((id) => models.some((candidate) => candidate.id === id)) ?? models[0]?.id;
    if (!model) throw new Error("No available LLM model");

    const response = await withGuideTimeout(invokeLLM({
      model,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: "你是嚴謹的《易經》文本導讀者。你只能根據提供的原文材料解釋，不得杜撰原文、注家、事實或預言。你不提供醫療、法律、投資、賭博或其他重大決策指令。請使用繁體中文，以一段到三段完整散文回覆，不要輸出 JSON、Markdown 程式碼區塊、前言、致歉、巢狀欄位或清單。語義解說與結構脈絡要承認不確定性，最後提出一個開放式反思問題。",
        },
        {
          role: "user",
          content: `使用者問題：${question}\n\n本卦：${selected.original.name}（第 ${selected.original.id} 卦）；之卦：${selected.transformed.name}（第 ${selected.transformed.id} 卦）；變爻：${selected.movingLines.length ? selected.movingLines.join("、") : "無"}；下卦：${selected.lowerTrigram}；上卦：${selected.upperTrigram}。\n\n僅可依據以下材料：\n${sourcePacket}`,
        },
      ],
    }));

    const rawContent = response.choices[0]?.message?.content;
    const raw = typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.filter((part) => part.type === "text").map((part) => part.text).join("\n")
        : "";
    if (!raw.trim()) {
      console.warn("[Yijing Guide] Empty model content", { model, finishReason: response.choices[0]?.finish_reason, hasToolCalls: Boolean(response.choices[0]?.message?.tool_calls?.length) });
      throw new Error("Empty LLM response");
    }
    const parsed = parseGuideFields(raw, question, selected);
    return {
      kind: "guide" as const,
      content: formatGuideContent(question, selected, citations, parsed),
      citations,
    };
  } catch (error) {
    console.warn("[Yijing Guide] Falling back to deterministic guide:", error);
    return { kind: "fallback" as const, content: fallbackGuide(question, selected, citations), citations };
  }
}

export const yijingLibrary = {
  hexagrams,
  wings,
  sourceNotice: SOURCE_NOTICE,
};
