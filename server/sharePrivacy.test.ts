import { describe, expect, it } from "vitest";
import { baziSharePayload, sanitizeSharePayload } from "./sharePrivacy";

describe("分享敏感資料遮罩", () => {
  it("removes sensitive birth and encryption keys recursively", () => {
    const payload = sanitizeSharePayload({ title: "研究", birthDate: "1968-10-14", nested: { birthTime: "23:40", timezone: "Asia/Taipei", keep: "四柱" }, list: [{ birthPlace: "Taipei", value: "戊申" }] });
    expect(payload).toEqual({ title: "研究", nested: { keep: "四柱" }, list: [{ value: "戊申" }] });
    expect(JSON.stringify(payload)).not.toContain("1968");
  });

  it("builds a bazi share snapshot with structural fields only", () => {
    const payload = baziSharePayload({ pillars: ["戊申"], conventions: { timezoneNotice: "民用時間" }, birthDate: "1968-10-14", daYun: { direction: "順行", start: { solarDate: "1968-12-01" }, periods: [{ ganZhi: "乙亥" }], conventions: { genderParameter: "male", startMethod: "分鐘差", ruleVersion: "v1" } } }, { ganZhi: "丙午" }, "研究解說");
    expect(JSON.stringify(payload)).not.toContain("1968");
    expect(JSON.stringify(payload)).not.toContain("genderParameter");
    expect(payload).toMatchObject({ kind: "bazi_research_snapshot", disclosure: expect.stringContaining("遮罩"), pillars: ["戊申"] });
  });
});
