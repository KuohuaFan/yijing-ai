import { describe, expect, it } from "vitest";
import { isShareSnapshotActive } from "./shareUtils";

describe("分享快照存取規則", () => {
  const now = Date.UTC(2026, 7, 21, 0, 0, 0);

  it("允許未撤銷且未過期的快照", () => {
    expect(isShareSnapshotActive({ isRevoked: false, expiresAt: new Date(now + 1000) }, now)).toBe(true);
    expect(isShareSnapshotActive({ isRevoked: false, expiresAt: null }, now)).toBe(true);
  });

  it("拒絕撤銷或已到期的快照", () => {
    expect(isShareSnapshotActive({ isRevoked: true, expiresAt: new Date(now + 1000) }, now)).toBe(false);
    expect(isShareSnapshotActive({ isRevoked: false, expiresAt: new Date(now) }, now)).toBe(false);
  });
});
