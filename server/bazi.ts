import { Solar } from "lunar-javascript";

export type BaziInput = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  sect: 1 | 2;
  targetYear: number;
  daYunGender?: "male" | "female";
  daYunSect?: 1 | 2;
};

const STEM_ELEMENTS: Record<string, string> = { 甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水" };

function assertValidCivilDate(input: BaziInput) {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute));
  const valid = date.getUTCFullYear() === input.year
    && date.getUTCMonth() === input.month - 1
    && date.getUTCDate() === input.day
    && date.getUTCHours() === input.hour
    && date.getUTCMinutes() === input.minute;
  if (!valid) throw new Error("出生日期或時間不是有效的公曆民用時間。");
}

export type StoredDaYunConventions = { genderParameter: "male" | "female"; calculationSect: 1 | 2; ruleVersion: string };

export function readStoredDaYunConventions(chartResult: unknown): StoredDaYunConventions | undefined {
  const value = chartResult as { daYun?: { conventions?: Partial<StoredDaYunConventions> } };
  const conventions = value?.daYun?.conventions;
  if (!conventions || (conventions.genderParameter !== "male" && conventions.genderParameter !== "female")) return undefined;
  if (conventions.calculationSect !== 1 && conventions.calculationSect !== 2) return undefined;
  if (typeof conventions.ruleVersion !== "string" || !conventions.ruleVersion) return undefined;
  return { genderParameter: conventions.genderParameter, calculationSect: conventions.calculationSect, ruleVersion: conventions.ruleVersion };
}

function calculateDaYun(eightChar: any, input: BaziInput) {
  if (!input.daYunGender || !input.daYunSect) return undefined;
  const gender = input.daYunGender;
  const calculationSect = input.daYunSect;
  const yun = eightChar.getYun(gender === "male" ? 1 : 0, calculationSect);
  const allPeriods = yun.getDaYun(9);
  const startSolar = yun.getStartSolar();
  const startDate = typeof startSolar.toYmdHms === "function" ? startSolar.toYmdHms() : startSolar.toYmd();
  const toPeriod = (period: any) => ({
    index: period.getIndex(),
    ganZhi: period.getGanZhi() || undefined,
    startYear: period.getStartYear(),
    endYear: period.getEndYear(),
    startAge: period.getStartAge(),
    endAge: period.getEndAge(),
  });
  const preStart = toPeriod(allPeriods[0]);
  const periods = allPeriods.slice(1).map(toPeriod);
  const currentPeriod = periods.find((period: { startYear: number; endYear: number }) => input.targetYear >= period.startYear && input.targetYear <= period.endYear);
  return {
    start: {
      offset: { years: yun.getStartYear(), months: yun.getStartMonth(), days: yun.getStartDay(), hours: yun.getStartHour() },
      solarDate: startDate,
    },
    direction: yun.isForward() ? "順行" : "逆行",
    preStart,
    periods,
    currentPeriod,
    conventions: {
      genderParameter: gender,
      genderLabel: gender === "male" ? "傳統規則參數：男" : "傳統規則參數：女",
      calculationSect,
      startMethod: calculationSect === 2 ? "起運以相鄰節氣的分鐘差換算年、月、日、時" : "起運以相鄰節氣與時辰差換算年、月、日",
      pillarMethod: "十年大運柱以月柱干支依順逆行推移；起運前區段另列。",
      ruleVersion: "lunar-javascript-yun-v1",
    },
  };
}

export function calculateBazi(input: BaziInput) {
  assertValidCivilDate(input);
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(input.sect);
  const pillars = [
    { label: "年柱", value: eightChar.getYear() },
    { label: "月柱", value: eightChar.getMonth() },
    { label: "日柱", value: eightChar.getDay() },
    { label: "時柱", value: eightChar.getTime() },
  ];
  const targetLunar = Solar.fromYmd(input.targetYear, 7, 1).getLunar();
  const dayMaster = eightChar.getDay().charAt(0);
  const elementCounts = pillars.reduce<Record<string, number>>((acc, pillar) => {
    const element = STEM_ELEMENTS[pillar.value.charAt(0)] ?? "未知";
    acc[element] = (acc[element] ?? 0) + 1;
    return acc;
  }, {});
  return {
    pillars,
    dayMaster,
    dayMasterElement: STEM_ELEMENTS[dayMaster] ?? "未知",
    hiddenStems: { year: eightChar.getYearHideGan(), month: eightChar.getMonthHideGan(), day: eightChar.getDayHideGan(), hour: eightChar.getTimeHideGan() },
    tenGods: { year: eightChar.getYearShiShenGan(), month: eightChar.getMonthShiShenGan(), day: eightChar.getDayShiShenGan(), hour: eightChar.getTimeShiShenGan() },
    elementCounts,
    annual: { year: input.targetYear, ganZhi: targetLunar.getYearInGanZhiByLiChun(), reference: "以立春為年柱界，月份採節氣月。" },
    daYun: calculateDaYun(eightChar, input),
    conventions: { engine: "lunar-javascript 1.7.7", calendar: "公曆輸入；節氣月", dayBoundary: input.sect === 1 ? "子初（23:00）" : "子正（00:00）", timezoneNotice: "本 MVP 以使用者輸入的民用時間計算，尚未套用真太陽時校正。", daYunNotice: input.daYunGender && input.daYunSect ? "大運以使用者選擇的傳統規則參數與起運換算口徑計算；不同傳統可能採用不同口徑。" : "尚未同時選擇傳統大運順逆行參數與起運換算口徑，因此未計算大運時間軸。" },
  };
}
