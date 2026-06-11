import { Router } from "express";
import { db, eventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "./auth.js";

const router = Router();

// Get currently active event (public)
router.get("/events/active", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const events = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.isActive, true))
    .orderBy(desc(eventsTable.createdAt));

  const active = events.find(e => e.startDate <= today && e.endDate >= today) ?? null;
  res.json(active);
});

// List all events (broadcaster+)
router.get("/events", requireRole("broadcaster", "admin"), async (_req, res) => {
  const rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));
  res.json(rows);
});

// Create event (admin only)
router.post("/events", requireRole("admin"), async (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!body.name || !body.startDate || !body.endDate) {
    res.status(400).json({ error: "name, startDate, endDate are required" }); return;
  }
  const [row] = await db.insert(eventsTable).values({
    name: String(body.name),
    eventType: body.eventType ? String(body.eventType) : "general",
    description: body.description ? String(body.description) : null,
    bannerColor: body.bannerColor ? String(body.bannerColor) : "#7C3AED",
    emoji: body.emoji ? String(body.emoji) : "🎉",
    startDate: String(body.startDate),
    endDate: String(body.endDate),
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
  }).returning();
  res.status(201).json(row);
});

// Update event (admin only)
router.patch("/events/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = String(body.name);
  if (body.eventType !== undefined) update.eventType = String(body.eventType);
  if (body.description !== undefined) update.description = body.description ? String(body.description) : null;
  if (body.bannerColor !== undefined) update.bannerColor = String(body.bannerColor);
  if (body.emoji !== undefined) update.emoji = String(body.emoji);
  if (body.startDate !== undefined) update.startDate = String(body.startDate);
  if (body.endDate !== undefined) update.endDate = String(body.endDate);
  if (body.isActive !== undefined) update.isActive = Boolean(body.isActive);

  const [row] = await db.update(eventsTable)
    .set(update)
    .where(eq(eventsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Event not found" }); return; }
  res.json(row);
});

// Delete event (admin only)
router.delete("/events/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.status(204).end();
});

export default router;
