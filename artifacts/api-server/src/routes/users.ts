import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, requireRole } from "./auth.js";

const router = Router();

const safeUser = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  name: u.name,
  username: u.username,
  role: u.role,
  grade: u.grade,
  className: u.className,
  status: u.status,
  createdAt: u.createdAt.toISOString(),
});

router.get("/users", requireRole("admin"), async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(safeUser));
});

router.post("/users", requireRole("admin"), async (req, res) => {
  const { name, username, password, role, grade, className } = req.body as Record<string, string>;
  if (!name || !username || !password || !role) {
    res.status(400).json({ error: "请填写所有必填字段（姓名、用户名、密码、角色）" });
    return;
  }
  if (!["broadcaster", "admin"].includes(role)) {
    res.status(400).json({ error: "角色无效，只支持 broadcaster / admin" });
    return;
  }
  try {
    const [user] = await db
      .insert(usersTable)
      .values({ name, username, passwordHash: hashPassword(password), role, grade: grade || null, className: className || null })
      .returning();
    res.status(201).json(safeUser(user));
  } catch (e: any) {
    if (e.code === "23505") res.status(409).json({ error: "用户名已存在" });
    else res.status(500).json({ error: "创建失败" });
  }
});

router.patch("/users/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, role, grade, className, status, password } = req.body as Record<string, string>;
  const update: Record<string, any> = {};
  if (name) update.name = name;
  if (role) update.role = role;
  if (grade !== undefined) update.grade = grade || null;
  if (className !== undefined) update.className = className || null;
  if (status) update.status = status;
  if (password) update.passwordHash = hashPassword(password);
  const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "用户不存在" }); return; }
  res.json(safeUser(user));
});

router.delete("/users/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const currentUser = (req as any).currentUser;
  if (currentUser?.id === id) {
    res.status(400).json({ error: "不能删除当前登录账号" });
    return;
  }
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "用户不存在" }); return; }
  res.status(204).send();
});

export default router;
