import { Router } from "express";
import { db, songsTable, submissionsTable, playsTable } from "@workspace/db";
import { desc, sql, gte } from "drizzle-orm";
import { requireRole } from "./auth.js";

const router = Router();

router.get("/analytics", requireRole("broadcaster", "admin"), async (_req, res) => {
  // Top 10 songs by play count
  const topSongs = await db
    .select()
    .from(songsTable)
    .where(sql`${songsTable.playedCount} > 0`)
    .orderBy(desc(songsTable.playedCount))
    .limit(10);

  // Top artists (aggregate play count by artist)
  const allSongs = await db.select().from(songsTable);
  const artistMap = new Map<string, number>();
  for (const s of allSongs) {
    artistMap.set(s.artist, (artistMap.get(s.artist) ?? 0) + s.playedCount);
  }
  const topArtists = Array.from(artistMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([artist, plays]) => ({ artist, plays }));

  // Submission stats
  const submissions = await db.select().from(submissionsTable);
  const submissionStats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === "pending").length,
    approved: submissions.filter(s => s.status === "approved").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  };

  // Song genre breakdown
  const genreMap = new Map<string, number>();
  for (const s of allSongs) {
    const g = s.genre ?? "未分类";
    genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
  }
  const genreBreakdown = Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({ genre, count }));

  // Recent plays from plays table (last 30 days)
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const recentPlays = await db
    .select()
    .from(playsTable)
    .where(gte(playsTable.playedAt, since30))
    .orderBy(desc(playsTable.playedAt))
    .limit(100);

  // Daily play counts for last 14 days
  const dailyCounts: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyCounts[key] = 0;
  }
  for (const play of recentPlays) {
    const key = play.playedAt.toISOString().split("T")[0];
    if (key in dailyCounts) dailyCounts[key]++;
  }
  const dailyTrend = Object.entries(dailyCounts).map(([date, count]) => ({
    date: date.slice(5), // MM-DD
    count,
  }));

  // Broadcaster activity
  const broadcasterMap = new Map<string, number>();
  for (const play of recentPlays) {
    if (play.playedBy) broadcasterMap.set(play.playedBy, (broadcasterMap.get(play.playedBy) ?? 0) + 1);
  }
  const broadcasterActivity = Array.from(broadcasterMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Library stats
  const libStats = {
    total: allSongs.length,
    played: allSongs.filter(s => s.playedCount > 0).length,
    unplayed: allSongs.filter(s => s.playedCount === 0).length,
    studentSubmissions: allSongs.filter(s => s.isStudentSubmission).length,
    totalPlays: allSongs.reduce((a, s) => a + s.playedCount, 0),
  };

  res.json({
    topSongs: topSongs.map(s => ({ id: s.id, title: s.title, artist: s.artist, plays: s.playedCount })),
    topArtists,
    submissionStats,
    genreBreakdown,
    dailyTrend,
    broadcasterActivity,
    libStats,
  });
});

export default router;
