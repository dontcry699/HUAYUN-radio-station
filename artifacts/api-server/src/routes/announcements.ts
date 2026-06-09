import { Router } from "express";
import { db, announcementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListAnnouncementsQueryParams,
  CreateAnnouncementBody,
  UpdateAnnouncementBody,
  UpdateAnnouncementParams,
  DeleteAnnouncementParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/announcements", async (req, res) => {
  const query = ListAnnouncementsQueryParams.parse(req.query);
  let announcements = await db.select().from(announcementsTable);

  if (query.category && query.category !== "all") {
    announcements = announcements.filter((a) => a.category === query.category);
  }

  if (query.activeOnly) {
    announcements = announcements.filter((a) => a.isActive);
  }

  res.json(
    announcements
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))
  );
});

router.post("/announcements", async (req, res) => {
  const body = CreateAnnouncementBody.parse(req.body);
  const [announcement] = await db
    .insert(announcementsTable)
    .values({
      title: body.title,
      content: body.content,
      category: body.category ?? "general",
      isActive: body.isActive ?? true,
    })
    .returning();
  res.status(201).json({ ...announcement, createdAt: announcement.createdAt.toISOString() });
});

router.patch("/announcements/:id", async (req, res) => {
  const { id } = UpdateAnnouncementParams.parse({ id: Number(req.params.id) });
  const body = UpdateAnnouncementBody.parse(req.body);
  const [announcement] = await db
    .update(announcementsTable)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    })
    .where(eq(announcementsTable.id, id))
    .returning();
  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  res.json({ ...announcement, createdAt: announcement.createdAt.toISOString() });
});

router.delete("/announcements/:id", async (req, res) => {
  const { id } = DeleteAnnouncementParams.parse({ id: Number(req.params.id) });
  const [announcement] = await db
    .delete(announcementsTable)
    .where(eq(announcementsTable.id, id))
    .returning();
  if (!announcement) {
    res.status(404).json({ error: "Announcement not found" });
    return;
  }
  res.status(204).send();
});

export default router;
