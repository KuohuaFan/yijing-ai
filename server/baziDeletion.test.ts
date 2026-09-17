import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canDeleteOwnedBaziRecord } from "./baziDb";

describe("八字私密資料刪除契約", () => {
  it("只允許資料擁有者啟動 profile 或 chart 永久刪除", () => {
    expect(canDeleteOwnedBaziRecord({ userId: 7 }, 7)).toBe(true);
    expect(canDeleteOwnedBaziRecord({ userId: 7 }, 8)).toBe(false);
    expect(canDeleteOwnedBaziRecord(undefined, 7)).toBe(false);
  });

  it("profile 與 chart 的外鍵會級聯清除 annual 與 consent 關聯資料", () => {
    const migration = readFileSync(new URL("../drizzle/0004_aspiring_katie_power.sql", import.meta.url), "utf8");
    expect(migration).toMatch(/annualReadings_birthProfileId_birthProfiles_id_fk[\s\S]*?ON DELETE cascade/);
    expect(migration).toMatch(/annualReadings_baziChartId_baziCharts_id_fk[\s\S]*?ON DELETE cascade/);
    expect(migration).toMatch(/baziCharts_birthProfileId_birthProfiles_id_fk[\s\S]*?ON DELETE cascade/);
    expect(migration).toMatch(/sensitiveDataConsents_birthProfileId_birthProfiles_id_fk[\s\S]*?ON DELETE cascade/);
  });
});
