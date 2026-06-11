import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const configTable = pgTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Config = typeof configTable.$inferSelect;
