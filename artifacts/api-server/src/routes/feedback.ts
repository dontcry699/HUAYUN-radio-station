import { Router } from "express";
import { db, feedbackTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "./auth.js";

const router = Router();

// Submit feedback (public — no auth required)
router.post("/feedback", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  if (!body.title || !body.content) {
    res.status(400).json({ error: "title and content are required" }); return;
  }
  const validTypes = ["bug", "suggestion", "feature"];
  const validRoles = ["student", "teacher", "broadcaster", "other"];
  const [row] = await db.insert(feedbackTable).values({
    type: validTypes.includes(String(body.type)) ? String(body.type) : "suggestion",
    title: String(body.title),
    content: String(body.content),
    submitterName: body.submitterName ? String(body.submitterName) : null,
    submitterRole: validRoles.includes(String(body.submitterRole)) ? String(body.submitterRole) : "student",
    status: "pending",
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// List feedback (broadcaster+ only)
router.get("/feedback", requireRole("broadcaster", "admin"), async (_req, res) => {
  const rows = await db.select().from(feedbackTable).orderBy(desc(feedbackTable.createdAt));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// Update feedback status / admin note (admin only)
router.patch("/feedback/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  const validStatuses = ["pending", "reviewed", "resolved"];
  if (body.status !== undefined && validStatuses.includes(String(body.status))) update.status = String(body.status);
  if (body.adminNote !== undefined) update.adminNote = body.adminNote ? String(body.adminNote) : null;

  const [row] = await db.update(feedbackTable).set(update).where(eq(feedbackTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Feedback not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

// Delete feedback (admin only)
router.delete("/feedback/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(feedbackTable).where(eq(feedbackTable.id, id));
  res.status(204).end();
});

export default router;
