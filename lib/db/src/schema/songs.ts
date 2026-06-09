import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const songsTable = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  genre: text("genre"),
  playedCount: integer("played_count").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at"),
  lastPlayedBy: text("last_played_by"),
  isStudentSubmission: boolean("is_student_submission").notNull().default(false),
  submittedBy: text("submitted_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSongSchema = createInsertSchema(songsTable).omit({ id: true, createdAt: true, playedCount: true, lastPlayedAt: true, lastPlayedBy: true });
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songsTable.$inferSelect;
