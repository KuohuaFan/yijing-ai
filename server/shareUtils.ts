export type ShareAccessState = {
  isRevoked: boolean;
  expiresAt?: Date | null;
};

export function isShareSnapshotActive(snapshot: ShareAccessState, now = Date.now()) {
  return !snapshot.isRevoked && (!snapshot.expiresAt || snapshot.expiresAt.getTime() > now);
}
