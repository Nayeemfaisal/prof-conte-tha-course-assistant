import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }), studentName: text("student_name").notNull(), studentEmail: text("student_email"),
  title: text("title").notNull(), body: text("body").notNull(), category: text("category").notNull().default("General"),
  status: text("status").notNull().default("open"), channel: text("channel").notNull().default("web"), anonymous: integer("anonymous").notNull().default(0),
  externalContact: text("external_contact"), externalMessageId: text("external_message_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, table => [uniqueIndex("idx_questions_external_message_id").on(table.externalMessageId)]);

export const answers = sqliteTable("answers", {
  id: integer("id").primaryKey({ autoIncrement: true }), questionId: integer("question_id").notNull().unique().references(() => questions.id, { onDelete: "cascade" }),
  draft: text("draft"), finalText: text("final_text"), sources: text("sources").notNull().default("[]"), approved: integer("approved").notNull().default(0),
  publishedAt: text("published_at"), deliveryStatus: text("delivery_status").notNull().default("not_requested"), deliveredAt: text("delivered_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }), event: text("event").notNull(), entityId: integer("entity_id"), detail: text("detail"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(), email: text("email").notNull(), expiresAt: integer("expires_at").notNull(),
});
