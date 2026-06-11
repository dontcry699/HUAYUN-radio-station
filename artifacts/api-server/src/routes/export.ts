import { Router } from "express";
import { db, songsTable, usersTable, submissionsTable, announcementsTable, playsTable, feedbackTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireRole } from "./auth.js";

const router = Router();

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  };
  return [keys.join(","), ...rows.map(r => keys.map(k => escape(r[k])).join(","))].join("\n");
}

const TABLES: Record<string, () => Promise<Record<string, unknown>[]>> = {
  songs: async () => {
    const rows = await db.select().from(songsTable).orderBy(desc(songsTable.playedCount));
    return rows.map(r => ({
      ...r,
      lastPlayedAt: r.lastPlayedAt?.toISOString() ?? "",
      createdAt: r.createdAt.toISOString(),
    }));
  },
  users: async () => {
    const rows = await db.select({
      id: usersTable.id, name: usersTable.name, username: usersTable.username,
      role: usersTable.role, isActive: usersTable.isActive, createdAt: usersTable.createdAt,
    }).from(usersTable);
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },
  submissions: async () => {
    const rows = await db.select().from(submissionsTable).orderBy(desc(submissionsTable.createdAt));
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },
  announcements: async () => {
    const rows = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },
  history: async () => {
    const rows = await db.select().from(playsTable).orderBy(desc(playsTable.playedAt));
    return rows.map(r => ({ ...r, playedAt: r.playedAt.toISOString() }));
  },
  feedback: async () => {
    const rows = await db.select().from(feedbackTable).orderBy(desc(feedbackTable.createdAt));
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));
  },
};

router.get("/export/:type", requireRole("admin"), async (req, res) => {
  const type = req.params.type as string;
  const format = (req.query.format as string) ?? "json";

  if (!(type in TABLES)) {
    res.status(400).json({ error: "Unknown export type" }); return;
  }

  const rows = await TABLES[type]();
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `campus-radio-${type}-${ts}.${format}`;

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + toCSV(rows)); // BOM for Excel UTF-8
  } else {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json({ exportedAt: new Date().toISOString(), type, count: rows.length, data: rows });
  }
});

export default router;
