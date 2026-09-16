const SENSITIVE_KEY = /(^|_)(birth(date|time|place)?|dateofbirth|timeofbirth|location|timezone|encrypted(payload)?|encryption(iv|authtag|version)?|consent(edat)?)(_|$)/i;

export function sanitizeSharePayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeSharePayload);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, child]) => [key, sanitizeSharePayload(child)]));
  }
  return value;
}

export function baziSharePayload(chartResult: Record<string, unknown>, annualResult?: Record<string, unknown> | null, guideContent?: string | null) {
  const result = chartResult as { pillars?: unknown; dayMaster?: unknown; dayMasterElement?: unknown; hiddenStems?: unknown; tenGods?: unknown; elementCounts?: unknown; conventions?: unknown; daYun?: { direction?: unknown; preStart?: unknown; periods?: unknown; currentPeriod?: unknown; conventions?: { calculationSect?: unknown; startMethod?: unknown; pillarMethod?: unknown; ruleVersion?: unknown } } };
  return {
    kind: "bazi_research_snapshot",
    disclosure: "出生資料已遮罩；本快照僅供結構研讀，不作吉凶、事件或重大決策預測。",
    pillars: result.pillars,
    dayMaster: result.dayMaster,
    dayMasterElement: result.dayMasterElement,
    hiddenStems: result.hiddenStems,
    tenGods: result.tenGods,
    elementCounts: result.elementCounts,
    conventions: result.conventions,
    daYun: result.daYun ? {
      direction: result.daYun.direction,
      preStart: result.daYun.preStart,
      periods: result.daYun.periods,
      currentPeriod: result.daYun.currentPeriod,
      conventions: {
        calculationSect: result.daYun.conventions?.calculationSect,
        startMethod: result.daYun.conventions?.startMethod,
        pillarMethod: result.daYun.conventions?.pillarMethod,
        ruleVersion: result.daYun.conventions?.ruleVersion,
      },
    } : undefined,
    annual: annualResult ?? undefined,
    researchGuide: guideContent ?? undefined,
  };
}
