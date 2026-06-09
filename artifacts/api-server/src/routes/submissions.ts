import { Router } from "express";
import { db, submissionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListSubmissionsQueryParams,
  CreateSubmissionBody,
  UpdateSubmissionBody,
  UpdateSubmissionParams,
  DeleteSubmissionParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/submissions", async (req, res) => {
  const query = ListSubmissionsQueryParams.parse(req.query);
  let submissions = await db.select().from(submissionsTable);

  if (query.status && query.status !== "all") {
    submissions = submissions.filter((s) => s.status === query.status);
  }

  res.json(
    submissions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))
  );
});

router.post("/submissions", async (req, res) => {
  const body = CreateSubmissionBody.parse(req.body);
  const [submission] = await db
    .insert(submissionsTable)
    .values({
      title: body.title,
      artist: body.artist,
      studentName: body.isAnonymous ? null : (body.studentName ?? null),
      studentEmail: body.studentEmail ?? null,
      grade: body.grade ?? null,
      className: body.className ?? null,
      message: body.message ?? null,
      dedicationTo: body.dedicationTo ?? null,
      dedicationMessage: body.dedicationMessage ?? null,
      isAnonymous: body.isAnonymous ?? false,
      status: "pending",
    })
    .returning();
  res.status(201).json({ ...submission, createdAt: submission.createdAt.toISOString() });
});

router.patch("/submissions/:id", async (req, res) => {
  const { id } = UpdateSubmissionParams.parse({ id: Number(req.params.id) });
  const body = UpdateSubmissionBody.parse(req.body);
  const [submission] = await db
    .update(submissionsTable)
    .set({
      ...(body.status !== undefined && { status: body.status }),
      ...(body.reviewNote !== undefined && { reviewNote: body.reviewNote }),
    })
    .where(eq(submissionsTable.id, id))
    .returning();
  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  res.json({ ...submission, createdAt: submission.createdAt.toISOString() });
});

router.delete("/submissions/:id", async (req, res) => {
  const { id } = DeleteSubmissionParams.parse({ id: Number(req.params.id) });
  const [submission] = await db
    .delete(submissionsTable)
    .where(eq(submissionsTable.id, id))
    .returning();
  if (!submission) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  res.status(204).send();
});

export default router;
