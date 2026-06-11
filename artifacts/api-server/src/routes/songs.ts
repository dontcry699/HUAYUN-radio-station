import { Router } from "express";
import { db, songsTable, playsTable } from "@workspace/db";
import { eq, ilike, or, sql, desc, and } from "drizzle-orm";
import {
  ListSongsQueryParams,
  CreateSongBody,
  UpdateSongBody,
  MarkSongPlayedBody,
  ListRecentPlaysQueryParams,
  GetSongParams,
  UpdateSongParams,
  DeleteSongParams,
  MarkSongPlayedParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/songs", async (req, res) => {
  const query = ListSongsQueryParams.parse(req.query);

  let songs = await db
    .select()
    .from(songsTable)
    .orderBy(desc(songsTable.playedCount), desc(songsTable.createdAt));

  if (query.status === "played") {
    songs = songs.filter((s) => s.playedCount > 0);
  } else if (query.status === "unplayed") {
    songs = songs.filter((s) => s.playedCount === 0);
  }

  if (query.source === "student") {
    songs = songs.filter((s) => s.isStudentSubmission);
  } else if (query.source === "staff") {
    songs = songs.filter((s) => !s.isStudentSubmission);
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    songs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album ?? "").toLowerCase().includes(q)
    );
  }

  res.json(
    songs.map((s) => ({
      ...s,
      lastPlayedAt: s.lastPlayedAt ? s.lastPlayedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/songs", async (req, res) => {
  const body = CreateSongBody.parse(req.body);
  const [song] = await db
    .insert(songsTable)
    .values({
      title: body.title,
      artist: body.artist,
      album: body.album ?? null,
      genre: body.genre ?? null,
      isStudentSubmission: body.isStudentSubmission ?? false,
      submittedBy: body.submittedBy ?? null,
      notes: body.notes ?? null,
    })
    .returning();
  res.status(201).json({
    ...song,
    lastPlayedAt: song.lastPlayedAt ? song.lastPlayedAt.toISOString() : null,
    createdAt: song.createdAt.toISOString(),
  });
});

router.get("/songs/recent-plays", async (req, res) => {
  const query = ListRecentPlaysQueryParams.parse(req.query);
  const limit = query.limit ?? 10;
  const songs = await db
    .select()
    .from(songsTable)
    .orderBy(desc(songsTable.lastPlayedAt))
    .limit(limit * 3);

  const played = songs
    .filter((s) => s.playedCount > 0 && s.lastPlayedAt)
    .slice(0, limit);

  res.json(
    played.map((s) => ({
      ...s,
      lastPlayedAt: s.lastPlayedAt ? s.lastPlayedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.get("/songs/:id", async (req, res) => {
  const { id } = GetSongParams.parse({ id: Number(req.params.id) });
  const [song] = await db
    .select()
    .from(songsTable)
    .where(eq(songsTable.id, id));
  if (!song) {
    res.status(404).json({ error: "Song not found" });
    return;
  }
  res.json({
    ...song,
    lastPlayedAt: song.lastPlayedAt ? song.lastPlayedAt.toISOString() : null,
    createdAt: song.createdAt.toISOString(),
  });
});

router.patch("/songs/:id", async (req, res) => {
  const { id } = UpdateSongParams.parse({ id: Number(req.params.id) });
  const body = UpdateSongBody.parse(req.body);
  const [song] = await db
    .update(songsTable)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.artist !== undefined && { artist: body.artist }),
      ...(body.album !== undefined && { album: body.album }),
      ...(body.genre !== undefined && { genre: body.genre }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .where(eq(songsTable.id, id))
    .returning();
  if (!song) {
    res.status(404).json({ error: "Song not found" });
    return;
  }
  res.json({
    ...song,
    lastPlayedAt: song.lastPlayedAt ? song.lastPlayedAt.toISOString() : null,
    createdAt: song.createdAt.toISOString(),
  });
});

router.delete("/songs/:id", async (req, res) => {
  const { id } = DeleteSongParams.parse({ id: Number(req.params.id) });
  const [song] = await db
    .delete(songsTable)
    .where(eq(songsTable.id, id))
    .returning();
  if (!song) {
    res.status(404).json({ error: "Song not found" });
    return;
  }
  res.status(204).send();
});

router.post("/songs/:id/play", async (req, res) => {
  const { id } = MarkSongPlayedParams.parse({ id: Number(req.params.id) });
  const body = MarkSongPlayedBody.parse(req.body);
  const [song] = await db
    .update(songsTable)
    .set({
      playedCount: sql`${songsTable.playedCount} + 1`,
      lastPlayedAt: new Date(),
      lastPlayedBy: body.djName ?? null,
    })
    .where(eq(songsTable.id, id))
    .returning();
  if (!song) {
    res.status(404).json({ error: "Song not found" });
    return;
  }
  // Log to plays history table
  await db.insert(playsTable).values({
    songId: song.id,
    songTitle: song.title,
    songArtist: song.artist,
    playedBy: body.djName ?? null,
    playedAt: new Date(),
  });
  res.json({
    ...song,
    lastPlayedAt: song.lastPlayedAt ? song.lastPlayedAt.toISOString() : null,
    createdAt: song.createdAt.toISOString(),
  });
});

export default router;
