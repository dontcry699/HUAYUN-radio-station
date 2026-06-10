import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("broadcaster"), // 'broadcaster' | 'admin'
  grade: text("grade"),
  className: text("class_name"),
  status: text("status").notNull().default("active"), // 'active' | 'disabled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
