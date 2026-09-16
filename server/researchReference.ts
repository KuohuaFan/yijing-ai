export type ResearchDatasetManifest = {
  sourceName: string;
  sourceUrl: string;
  license: string;
  studyPurpose: string;
  sampleUnit: string;
  sampleSize: number;
  deidentified: boolean;
  auditMethod: string;
  methodologyUrl: string;
  updatedAt: string;
  decisionUseProhibited: boolean;
};

export const RESEARCH_REFERENCE_NOTICE = "研究參照僅能呈現具來源、可稽核且去識別化資料的描述性統計；不得推論個人吉凶、事件或作為醫療、法律、投資及其他重大決策依據。";

export function researchDatasetReadiness(manifest: Partial<ResearchDatasetManifest>) {
  const missing: string[] = [];
  if (!manifest.sourceName?.trim()) missing.push("資料來源名稱");
  if (!manifest.sourceUrl?.trim()) missing.push("資料來源網址");
  if (!manifest.license?.trim()) missing.push("授權或再利用條件");
  if (!manifest.studyPurpose?.trim()) missing.push("研究目的");
  if (!manifest.sampleUnit?.trim()) missing.push("樣本單位定義");
  if (!Number.isInteger(manifest.sampleSize) || (manifest.sampleSize ?? 0) < 1) missing.push("有效樣本數");
  if (manifest.deidentified !== true) missing.push("去識別化聲明");
  if (!manifest.auditMethod?.trim()) missing.push("審計方法");
  if (!manifest.methodologyUrl?.trim()) missing.push("方法說明網址");
  if (!manifest.updatedAt?.trim()) missing.push("更新日期");
  if (manifest.decisionUseProhibited !== true) missing.push("非個人決策用途聲明");
  return { ready: missing.length === 0, missing };
}
