import { invokeLLM, listLLMModels } from "./_core/llm";
import { isHighRiskQuestion } from "./yijing";

const GUIDE_TIMEOUT_MS = 22_000;
const PREDICTION_PATTERN = /(吉凶|吉或凶|會不會|能不能|是否會|何時.{0,8}(發生|結婚|升遷|中獎|懷孕|死亡|破財)|保證|下注|賭博|選股|買賣)/i;

export const POETRY_LOT_HEADINGS = ["文本與來源定位", "逐句釋義", "語詞與典故提示", "意象與結構閱讀", "歧義與慣例", "反思問題與限制"] as const;

export type PoetryLotInput = {
  poemText: string;
  lotNumber?: string;
  temple?: string;
  sourceName?: string;
  sourceUrl?: string;
  versionLabel?: string;
  question?: string;
};

export type PoetryLotCitation = {
  label: string;
  anchor: string;
  excerpt: string;
  sourceLabel: string;
  sourceUrl: string;
  versionLabel: string;
};

function withTimeout<T>(task: Promise<T>) {
  return Promise.race<T>([task, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Poetry-lot guide timed out")), GUIDE_TIMEOUT_MS))]);
}

function cleanLines(poemText: string) {
  return poemText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 12);
}

function sourceMeta(input: PoetryLotInput) {
  const lot = input.lotNumber?.trim() ? `第 ${input.lotNumber.trim()} 籤` : "本次輸入籤詩";
  return {
    label: input.temple?.trim() ? `${input.temple.trim()}・${lot}` : lot,
    anchor: `poetry-lot-${input.lotNumber?.trim().replace(/[^\w\u4e00-\u9fff-]/g, "-") || "user-text"}`,
    excerpt: cleanLines(input.poemText).join("／"),
    sourceLabel: input.sourceName?.trim() || "使用者提供之籤詩原文",
    sourceUrl: input.sourceUrl?.trim() || "使用者未提供公開來源網址",
    versionLabel: input.versionLabel?.trim() || "使用者輸入版本；未主張為宮廟或出版單位授權解籤",
  } satisfies PoetryLotCitation;
}

export function isPoetryLotHighRiskQuestion(question?: string) {
  const normalized = question?.trim();
  return Boolean(normalized && (isHighRiskQuestion(normalized) || PREDICTION_PATTERN.test(normalized)));
}

function section(index: number, heading: string, content: string) {
  return `## ${index}. ${heading}\n${content}`;
}

export function fallbackPoetryLotGuide(input: PoetryLotInput) {
  const lines = cleanLines(input.poemText);
  const citation = sourceMeta(input);
  const segments = lines.map((line, index) => `第 ${index + 1} 句「${line}」`).join("；") || "原文未能切分為可讀句子";
  return [
    section(1, "文本與來源定位", `本次閱讀以${citation.label}為中心。原文來源標示為「${citation.sourceLabel}」，版本為「${citation.versionLabel}」。此頁只處理本次提交的文字，不推定其宮廟、流派、作者或儀式效力。`),
    section(2, "逐句釋義", `可先逐句核對：${segments}。若原文有異文、缺字、標點差異或不同籤本，應以你手上的籤條、官方刊本或已取得許可的底本優先。`),
    section(3, "語詞與典故提示", `籤詩常借古典語彙、人物、地名或敘事意象壓縮意思。沒有可驗證來源時，本系統不會杜撰典故出處；你可將不明語詞列為待查項，再回到辭典、典籍或原籤本核對。`),
    section(4, "意象與結構閱讀", `可觀察文字中的行動詞、時序詞、轉折詞與對比意象，辨識它如何安排「處境—張力—可能的閱讀線索」。這是文學與文化研究的結構閱讀，不是把詩句換算為事件結果。`),
    section(5, "歧義與慣例", `不同宮廟、籤本、解籤傳統或口傳脈絡可能有不同解法。此處不以單一說法取代原籤、宗教儀式或在地解籤人員的脈絡，也不宣稱能判定靈驗與否。`),
    section(6, "反思問題與限制", `可研究的問題是：${input.question?.trim() || "這首籤詩中哪一個語詞、意象或轉折最需要回到原文與來源再核對？"} 本解說不提供吉凶、事件、醫療、法律、投資或其他重大決策的預測或指令。`),
  ].join("\n\n");
}

export function poetryLotSafetyRedirect(input: PoetryLotInput) {
  return [
    section(1, "文本與來源定位", `本次可保留${sourceMeta(input).label}的原文、來源與版本資訊，作為文化與文本研究的對象。`),
    section(2, "逐句釋義", "系統可以協助逐句說明可見語詞與意象，但不會把籤詩轉化為個人的吉凶、事件或結果斷言。"),
    section(3, "語詞與典故提示", "可改問某個語詞、人物、典故或異文是否值得回到原籤、典籍或可靠辭典進一步核對。"),
    section(4, "意象與結構閱讀", "可改以文本中的時序、行動、對比與轉折為中心，整理它們如何構成閱讀張力。"),
    section(5, "歧義與慣例", "不同籤本與宗教傳統可能有不同說法；本功能不取代在地儀式、解籤脈絡或專業判斷。"),
    section(6, "反思問題與限制", "你的提問涉及吉凶、事件、醫療、法律、投資或其他重大決策。請以可查證事實、專業意見與風險評估作為決策依據；可改問「這首詩的意象與語詞如何閱讀？」"),
  ].join("\n\n");
}

export async function createPoetryLotGuide(input: PoetryLotInput) {
  const citation = sourceMeta(input);
  if (isPoetryLotHighRiskQuestion(input.question)) {
    return { kind: "safety_redirect" as const, content: poetryLotSafetyRedirect(input), citations: [citation] };
  }

  const fallback = fallbackPoetryLotGuide(input);
  try {
    const { data: models } = await listLLMModels();
    const preferred = ["claude-haiku-4-5", "gpt-5-mini", "gpt-5-nano"];
    const model = preferred.find((id) => models.some((candidate) => candidate.id === id)) ?? models[0]?.id;
    if (!model) throw new Error("No available LLM model");
    const response = await withTimeout(invokeLLM({
      model,
      max_tokens: 1400,
      messages: [
        { role: "system", content: "你是嚴謹的籤詩文本研究助理。只能依使用者提交的籤詩原文與來源欄位做文化、文學與語義導讀。絕對不得預測、承諾或暗示吉凶、事件、婚姻、健康、疾病、死亡、法律結果、投資報酬、交易、懷孕、職涯結果或任何重大決策。不得杜撰宮廟授權、典故出處、儀式效力、歷史事實或籤詩全文。使用繁體中文，依指定六段標題輸出，每段 80 至 180 字；不得使用程式碼區塊或前言。" },
        { role: "user", content: `研究問題：${input.question?.trim() || "請依原文作逐句與結構閱讀。"}\n\n原文（僅此可用）：\n${cleanLines(input.poemText).join("\n")}\n\n來源欄位（僅供標示，不可自行補全）：\n${JSON.stringify(citation)}\n\n請依序輸出：\n## 1. 文本與來源定位\n## 2. 逐句釋義\n## 3. 語詞與典故提示\n## 4. 意象與結構閱讀\n## 5. 歧義與慣例\n## 6. 反思問題與限制` },
      ],
    }));
    const raw = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content.trim() : "";
    if (!raw || POETRY_LOT_HEADINGS.some((heading) => !raw.includes(heading))) throw new Error("Incomplete poetry-lot guide headings");
    return { kind: "guide" as const, content: raw, citations: [citation] };
  } catch (error) {
    console.warn("[Poetry Lot] Falling back to deterministic guide:", error);
    return { kind: "fallback" as const, content: fallback, citations: [citation] };
  }
}
