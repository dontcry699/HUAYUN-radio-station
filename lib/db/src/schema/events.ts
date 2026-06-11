import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  eventType: text("event_type").notNull().default("general"),
  description: text("description"),
  bannerColor: text("banner_color").notNull().default("#7C3AED"),
  emoji: text("emoji").notNull().default("🎉"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Event = typeof eventsTable.$inferSelect;
