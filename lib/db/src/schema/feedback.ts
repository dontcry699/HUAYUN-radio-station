import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("suggestion"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  submitterName: text("submitter_name"),
  submitterRole: text("submitter_role").notNull().default("student"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Feedback = typeof feedbackTable.$inferSelect;
