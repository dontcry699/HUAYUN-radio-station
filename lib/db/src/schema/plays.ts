import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { songsTable } from "./songs";

export const playsTable = pgTable("plays", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull().references(() => songsTable.id, { onDelete: "cascade" }),
  songTitle: text("song_title").notNull(),
  songArtist: text("song_artist").notNull(),
  playedBy: text("played_by"),
  notes: text("notes"),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export type Play = typeof playsTable.$inferSelect;
