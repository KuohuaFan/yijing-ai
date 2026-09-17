import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("HistoryRail", () => {
  it("renders one compact brand heading without duplicating the sidebar title", () => {
    const source = readFileSync(new URL("./HistoryRail.tsx", import.meta.url), "utf8");

    expect(source.match(/你的研讀歷程/g)).toHaveLength(1);
    expect(source).toContain('<BrandIcon className="size-10" />');
    expect(source).not.toContain('<BrandMark className="size-10" />');
    expect(source.match(/whitespace-nowrap/g)).toHaveLength(2);
    expect(source).toContain('className="shrink-0"');
  });
});
