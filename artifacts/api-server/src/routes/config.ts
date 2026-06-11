import { Router } from "express";
import { db, configTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { requireRole } from "./auth.js";

const router = Router();

const CONFIG_KEYS = ["school_start", "broadcast_start", "broadcast_end", "school_end"] as const;

const DEFAULTS = {
  schoolStart: "17:30",
  broadcastStart: "18:15",
  broadcastEnd: "18:35",
  schoolEnd: "20:10",
};

const KEY_MAP: Record<string, keyof typeof DEFAULTS> = {
  school_start: "schoolStart",
  broadcast_start: "broadcastStart",
  broadcast_end: "broadcastEnd",
  school_end: "schoolEnd",
};

const REVERSE_MAP: Record<string, string> = {
  schoolStart: "school_start",
  broadcastStart: "broadcast_start",
  broadcastEnd: "broadcast_end",
  schoolEnd: "school_end",
};

router.get("/config/schedule", async (_req, res) => {
  const rows = await db.select().from(configTable).where(inArray(configTable.key, [...CONFIG_KEYS]));
  const result = { ...DEFAULTS };
  for (const row of rows) {
    const k = KEY_MAP[row.key];
    if (k) result[k] = row.value;
  }
  res.json(result);
});

router.put("/config/schedule", requireRole("admin"), async (req, res) => {
  const body = req.body as Partial<typeof DEFAULTS>;
  const toUpsert = Object.entries(body)
    .filter(([k]) => k in REVERSE_MAP)
    .map(([k, v]) => ({ key: REVERSE_MAP[k], value: String(v) }));

  for (const { key, value } of toUpsert) {
    await db
      .insert(configTable)
      .values({ key, value })
      .onConflictDoUpdate({ target: configTable.key, set: { value, updatedAt: new Date() } });
  }

  const rows = await db.select().from(configTable).where(inArray(configTable.key, [...CONFIG_KEYS]));
  const result = { ...DEFAULTS };
  for (const row of rows) {
    const k = KEY_MAP[row.key];
    if (k) result[k] = row.value;
  }
  res.json(result);
});

export default router;
