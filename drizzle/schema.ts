import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const divinationRecords = mysqlTable("divinationRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  question: text("question"),
  method: mysqlEnum("method", ["three_coins", "manual"]).notNull().default("three_coins"),
  lineValues: json("lineValues").$type<number[]>().notNull(),
  originalHexagramId: int("originalHexagramId").notNull(),
  transformedHexagramId: int("transformedHexagramId").notNull(),
  movingLines: json("movingLines").$type<number[]>().notNull(),
  sourceVersion: varchar("sourceVersion", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reflectionNotes = mysqlTable("reflectionNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  divinationRecordId: int("divinationRecordId").references(() => divinationRecords.id, { onDelete: "set null" }),
  anchor: varchar("anchor", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sourceReports = mysqlTable("sourceReports", {
  id: int("id").autoincrement().primaryKey(),
  reporterEmail: varchar("reporterEmail", { length: 320 }),
  anchor: varchar("anchor", { length: 255 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "reviewed", "resolved"]).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const mediaAttachments = mysqlTable("mediaAttachments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  chatRecordKey: varchar("chatRecordKey", { length: 128 }).notNull(),
  divinationRecordId: int("divinationRecordId").references(() => divinationRecords.id, { onDelete: "set null" }),
  kind: mysqlEnum("kind", ["image", "video", "audio"]).notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 1024 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 1200 }).notNull(),
  transcript: text("transcript"),
  transcriptSegments: json("transcriptSegments").$type<unknown[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const shareSnapshots = mysqlTable("shareSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  includesAttachments: boolean("includesAttachments").notNull().default(false),
  isRevoked: boolean("isRevoked").notNull().default(false),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const commentaryAnnotations = mysqlTable("commentaryAnnotations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  anchor: varchar("anchor", { length: 255 }).notNull(),
  commentator: varchar("commentator", { length: 120 }).notNull().default("我的研讀註解"),
  versionLabel: varchar("versionLabel", { length: 120 }).notNull().default("使用者註解"),
  body: text("body").notNull(),
  visibility: mysqlEnum("visibility", ["private", "shared"]).notNull().default("private"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const birthProfiles = mysqlTable("birthProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 120 }).notNull(),
  encryptedPayload: text("encryptedPayload").notNull(),
  encryptionIv: varchar("encryptionIv", { length: 64 }).notNull(),
  encryptionAuthTag: varchar("encryptionAuthTag", { length: 64 }).notNull(),
  encryptionVersion: varchar("encryptionVersion", { length: 64 }).notNull(),
  consentVersion: varchar("consentVersion", { length: 64 }).notNull(),
  consentedAt: timestamp("consentedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const baziCharts = mysqlTable("baziCharts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  birthProfileId: int("birthProfileId").notNull().references(() => birthProfiles.id, { onDelete: "cascade" }),
  targetYear: int("targetYear").notNull(),
  sect: int("sect").notNull(),
  chartResult: json("chartResult").$type<Record<string, unknown>>().notNull(),
  engineVersion: varchar("engineVersion", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const annualReadings = mysqlTable("annualReadings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  birthProfileId: int("birthProfileId").notNull().references(() => birthProfiles.id, { onDelete: "cascade" }),
  baziChartId: int("baziChartId").notNull().references(() => baziCharts.id, { onDelete: "cascade" }),
  targetYear: int("targetYear").notNull(),
  annualResult: json("annualResult").$type<Record<string, unknown>>().notNull(),
  guideContent: text("guideContent"),
  guideKind: mysqlEnum("guideKind", ["guide", "fallback", "safety_redirect"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sensitiveDataConsents = mysqlTable("sensitiveDataConsents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  birthProfileId: int("birthProfileId").notNull().references(() => birthProfiles.id, { onDelete: "cascade" }),
  purpose: mysqlEnum("purpose", ["bazi_private_storage"]).notNull().default("bazi_private_storage"),
  policyVersion: varchar("policyVersion", { length: 64 }).notNull(),
  consentedAt: timestamp("consentedAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DivinationRecord = typeof divinationRecords.$inferSelect;
export type ReflectionNote = typeof reflectionNotes.$inferSelect;
export type SourceReport = typeof sourceReports.$inferSelect;
export type MediaAttachment = typeof mediaAttachments.$inferSelect;
export type ShareSnapshot = typeof shareSnapshots.$inferSelect;
export type CommentaryAnnotation = typeof commentaryAnnotations.$inferSelect;
export type BirthProfile = typeof birthProfiles.$inferSelect;
export type BaziChart = typeof baziCharts.$inferSelect;
export type AnnualReading = typeof annualReadings.$inferSelect;
export type SensitiveDataConsent = typeof sensitiveDataConsents.$inferSelect;
