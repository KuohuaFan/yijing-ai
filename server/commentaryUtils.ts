export type AnnotationVisibilityRecord = { userId: number; visibility: "private" | "shared" };

export function canViewAnnotation(note: AnnotationVisibilityRecord, viewerUserId?: number) {
  return note.visibility === "shared" || note.userId === viewerUserId;
}
