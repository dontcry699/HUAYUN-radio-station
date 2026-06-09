import { Router } from "express";
import { db, songsTable, submissionsTable } from "@workspace/db";
import { eq, gt, sum } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const songs = await db.select().from(songsTable);
  const submissions = await db.select().from(submissionsTable);

  const totalSongs = songs.length;
  const playedSongs = songs.filter((s) => s.playedCount > 0).length;
  const unplayedSongs = songs.filter((s) => s.playedCount === 0).length;
  const totalPlays = songs.reduce((acc, s) => acc + s.playedCount, 0);

  const pendingSubmissions = submissions.filter((s) => s.status === "pending").length;
  const approvedSubmissions = submissions.filter((s) => s.status === "approved").length;
  const rejectedSubmissions = submissions.filter((s) => s.status === "rejected").length;

  res.json({
    totalSongs,
    playedSongs,
    unplayedSongs,
    totalPlays,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
  });
});

export default router;
