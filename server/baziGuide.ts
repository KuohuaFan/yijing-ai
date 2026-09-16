import { invokeLLM, listLLMModels } from "./_core/llm";
import { calculateBazi, type BaziInput } from "./bazi";
import { isHighRiskQuestion } from "./yijing";

const GUIDE_TIMEOUT_MS = 22_000;
const BAZI_PREDICTION_PATTERN = /(吉凶|吉或凶|會不會|能不能|是否會|發生.{0,10}(事故|疾病|訴訟|賺錢|破財|死亡)|保證|下注|賭博)/i;

export const BAZI_GUIDE_HEADINGS = ["計算定位", "盤面結構", "傳統術語", "流年並讀", "慣例與不確定性", "研究問題與限制"] as const;

export type BaziGuideFields = Record<(typeof BAZI_GUIDE_HEADINGS)[number], string>;

function withTimeout<T>(task: Promise<T>) {
  return Promise.race<T>([task, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Bazi guide timed out")), GUIDE_TIMEOUT_MS))]);
}

function chartPacket(chart: ReturnType<typeof calculateBazi>) {
  return {
    fourPillars: chart.pillars.map((pillar) => `${pillar.label}${pillar.value}`).join("；"),
    dayMaster: `${chart.dayMaster}（${chart.dayMasterElement}）`,
    visibleElements: chart.elementCounts,
    hiddenStems: chart.hiddenStems,
    tenGods: chart.tenGods,
    annual: `${chart.annual.year} ${chart.annual.ganZhi}；${chart.annual.reference}`,
    daYun: chart.daYun,
    conventions: chart.conventions,
  };
}

export function isBaziHighRiskQuestion(question?: string) {
  const normalized = question?.trim();
  if (!normalized) return false;
  return isHighRiskQuestion(normalized) || BAZI_PREDICTION_PATTERN.test(normalized);
}

export function fallbackBaziGuide(chart: ReturnType<typeof calculateBazi>, question?: string) {
  const elements = ["木", "火", "土", "金", "水"].map((element) => `${element}${chart.elementCounts[element] ?? 0}`).join("、");
  const heading = (index: number, title: string, content: string) => `## ${index}. ${title}\n${content}`;
  return [
    heading(1, "計算定位", `本次四柱為${chart.pillars.map((pillar) => `${pillar.label}${pillar.value}`).join("、")}；日主為${chart.dayMaster}（${chart.dayMasterElement}）。此解說以公曆輸入、節氣月與${chart.conventions.dayBoundary}為基礎。`),
    heading(2, "盤面結構", `四柱天干的可見五行初步計數為${elements}。這只是可見天干的盤點，不等同旺衰、喜忌、用神或人生結果的判定。`),
    heading(3, "傳統術語", `月柱十神為${chart.tenGods.month || "未列"}，地支藏干依序可核對為年${chart.hiddenStems.year ?? "未列"}、月${chart.hiddenStems.month ?? "未列"}、日${chart.hiddenStems.day ?? "未列"}、時${chart.hiddenStems.hour ?? "未列"}。這些是傳統關係標記，適合用於結構比對，而非事件推論。`),
    heading(4, "流年並讀", `${chart.annual.year} 流年為${chart.annual.ganZhi}。${chart.daYun?.currentPeriod ? `依本次大運參數，該年落在${chart.daYun.currentPeriod.ganZhi}大運（${chart.daYun.currentPeriod.startYear}–${chart.daYun.currentPeriod.endYear}）的結構時間段。` : "尚未選擇大運順逆行參數，因此不併列大運。"} 可把它作為與原局並讀的時間標記，記錄研究問題與觀察，不將其轉化為個人事件的機率預報。`),
    heading(5, "慣例與不確定性", `${chart.conventions.timezoneNotice}。${chart.daYun ? `${chart.daYun.conventions.genderLabel}、${chart.daYun.conventions.startMethod}；方向為${chart.daYun.direction}。` : "大運需另選傳統順逆行參數與起運換算口徑。"} 若出生時間接近 23:00，宜比較子初與子正兩種日界設定，並核對出生時間的來源與地點。`),
    heading(6, "研究問題與限制", `可研究的問題是：${question?.trim() || "四柱中哪些關係需要回到藏干、十神與節氣口徑再核對？"} 本解說不是吉凶、事件、醫療、法律、投資或其他重大決策建議。`),
  ].join("\n\n");
}

export async function createBaziResearchGuide(input: BaziInput, question?: string) {
  const chart = calculateBazi(input);
  if (isBaziHighRiskQuestion(question)) {
    return {
      kind: "safety_redirect" as const,
      content: `## 1. 研究範圍\n你的提問涉及吉凶、事件預測、醫療、法律、投資或其他重大決策。本功能可以整理排盤結構與傳統術語，但不會把八字或流年轉成個人事件預估或行動指令。\n\n## 2. 可改用的研究問題\n你可改問「本盤的日主、月令、十神與藏干如何作傳統結構閱讀？」或「子初與子正換日後，哪些可檢查欄位不同？」\n\n## 3. 限制\n重大決策應依可查證事實、專業意見與風險評估處理；排盤研究不取代這些程序。`,
      chart,
    };
  }

  const fallback = fallbackBaziGuide(chart, question);
  try {
    const { data: models } = await listLLMModels();
    const preferred = ["claude-haiku-4-5", "gpt-5-mini", "gpt-5-nano"];
    const model = preferred.find((id) => models.some((candidate) => candidate.id === id)) ?? models[0]?.id;
    if (!model) throw new Error("No available LLM model");
    const response = await withTimeout(invokeLLM({
      model,
      max_tokens: 1200,
      messages: [
        { role: "system", content: "你是嚴謹的八字傳統術語研究助理。你只能根據使用者提供的確定性盤面資料作學術性、文化性的結構解說。絕對不得推測或承諾吉凶、事件、健康、疾病、死亡、法律結果、投資報酬、交易、婚姻、懷孕、職涯結果或任何重大決策。不得杜撰資料、引文、統計、門派結論或事實。使用繁體中文，依指定的六段標題輸出，每段 80 至 180 字；不得使用程式碼區塊或前言。" },
        { role: "user", content: `研究問題：${question?.trim() || "請依盤面資料整理可供研究參照的結構解說。"}\n\n確定性盤面資料（僅此可用）：\n${JSON.stringify(chartPacket(chart))}\n\n請依序輸出：\n## 1. 計算定位\n## 2. 盤面結構\n## 3. 傳統術語\n## 4. 流年並讀\n## 5. 慣例與不確定性\n## 6. 研究問題與限制` },
      ],
    }));
    const content = response.choices[0]?.message?.content;
    const raw = typeof content === "string" ? content.trim() : "";
    if (!raw || BAZI_GUIDE_HEADINGS.some((heading) => !raw.includes(heading))) throw new Error("Incomplete guide headings");
    return { kind: "guide" as const, content: raw, chart };
  } catch (error) {
    console.warn("[Bazi Guide] Falling back to deterministic guide:", error);
    return { kind: "fallback" as const, content: fallback, chart };
  }
}
