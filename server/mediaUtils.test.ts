import { describe, expect, it } from "vitest";
import { mediaLimits, safeMediaFileName, validateMediaInput } from "./mediaUtils";

describe("媒體附件驗證", () => {
  it("接受白名單圖片、影片與音訊格式", () => {
    expect(() => validateMediaInput("image", "image/png", 1024, 1024)).not.toThrow();
    expect(() => validateMediaInput("video", "video/mp4", 1024, 1024)).not.toThrow();
    expect(() => validateMediaInput("audio", "audio/webm", 1024, 1024)).not.toThrow();
  });

  it("拒絕未列入白名單、超額與大小不符的檔案", () => {
    expect(() => validateMediaInput("image", "application/pdf", 1024, 1024)).toThrow("不支援");
    expect(() => validateMediaInput("audio", "audio/mpeg", mediaLimits.audio + 1, mediaLimits.audio + 1)).toThrow("大小上限");
    expect(() => validateMediaInput("video", "video/mp4", 100, 50)).toThrow("內容或大小");
  });

  it("移除檔名中的非安全字元，同時保留中文與副檔名", () => {
    expect(safeMediaFileName("我的 問題 / 影片!.mp4")).toBe("我的_問題_影片_.mp4");
  });
});
