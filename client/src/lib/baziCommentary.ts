export type BaziCommentaryInput = {
  pillars: Array<{ label: string; value: string }>;
  dayMaster: string;
  dayMasterElement: string;
  hiddenStems: Record<string, string>;
  tenGods: Record<string, string>;
  elementCounts: Record<string, number>;
  annual: { year: number; ganZhi: string; reference: string };
  conventions: { dayBoundary: string; timezoneNotice: string };
};

export type BaziMarginalNote = {
  title: string;
  observation: string;
  reflection: string;
};

const elementOrder = ["木", "火", "土", "金", "水"];
const pillarOrder: Array<[string, string]> = [["year", "年"], ["month", "月"], ["day", "日"], ["hour", "時"]];

export function createBaziMarginalia(chart: BaziCommentaryInput): BaziMarginalNote[] {
  const visibleElements = elementOrder
    .map((element) => `${element}${chart.elementCounts[element] ?? 0}`)
    .join("、");
  const hiddenStemSummary = pillarOrder
    .map(([key, label]) => `${label}支藏干 ${chart.hiddenStems[key] || "未列"}`)
    .join("；");
  const tenGodSummary = pillarOrder
    .map(([key, label]) => `${label}干十神 ${chart.tenGods[key] || "未列"}`)
    .join("；");
  const monthPillar = chart.pillars.find((pillar) => pillar.label === "月柱")?.value ?? "未列";

  return [
    {
      title: "日主旁註",
      observation: `日柱天干為${chart.dayMaster}，五行歸屬${chart.dayMasterElement}。這裡只標示日主的記號與五行歸屬，尚未作強弱、喜忌或人格定論。`,
      reflection: "可先把日主視為閱讀全盤關係的參照點，再回看其與月令、其餘天干地支的互動。",
    },
    {
      title: "節氣與月令旁註",
      observation: `月柱為${monthPillar}；本盤月柱依節氣月計算，而非僅依農曆月份。`,
      reflection: "閱讀時可先區分出生月的節氣框架與其他柱位，避免把不同曆法口徑混為一談。",
    },
    {
      title: "可見五行旁註",
      observation: `四柱天干的可見五行計數為：${visibleElements}。此為天干的初步盤點，不等同完整旺衰、通關或用神判斷。`,
      reflection: "可觀察哪些元素在天干層次被明確呈現，再配合地支與藏干補讀未顯於天干的關係。",
    },
    {
      title: "藏干與十神旁註",
      observation: `${hiddenStemSummary}。${tenGodSummary}。`,
      reflection: "十神在此作為相對關係的傳統標記；宜用以提出結構問題，不宜直接推論人生事件。",
    },
    {
      title: `${chart.annual.year} 流年旁註`,
      observation: `${chart.annual.year} 年指定流年為${chart.annual.ganZhi}；${chart.annual.reference}`,
      reflection: "可把流年視為與原局並讀的一個時間標記，記錄當年關注的議題與可實行的反思，而非預測吉凶。",
    },
    {
      title: "計算慣例旁註",
      observation: `本次採${chart.conventions.dayBoundary}為換日邊界。${chart.conventions.timezoneNotice}`,
      reflection: "若出生時間接近 23:00，建議切換子初／子正兩種慣例比對柱位差異，並將採用的口徑一併保存於研究紀錄。",
    },
  ];
}
