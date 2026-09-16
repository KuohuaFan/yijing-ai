import { describe, expect, it } from "vitest";
import { canViewAnnotation } from "./commentaryUtils";

describe("段落註解可見性", () => {
  it("僅向作者顯示私人註解", () => {
    expect(canViewAnnotation({ userId: 7, visibility: "private" }, 7)).toBe(true);
    expect(canViewAnnotation({ userId: 7, visibility: "private" }, 8)).toBe(false);
    expect(canViewAnnotation({ userId: 7, visibility: "private" })).toBe(false);
  });

  it("允許任何讀者查看共享註解", () => {
    expect(canViewAnnotation({ userId: 7, visibility: "shared" })).toBe(true);
  });
});
