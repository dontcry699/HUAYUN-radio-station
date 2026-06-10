import { Router } from "express";
import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const SECRET = () => process.env.SESSION_SECRET || "campus-radio-default-secret";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const colonIdx = stored.indexOf(":");
    const salt = stored.slice(0, colonIdx);
    const hashHex = stored.slice(colonIdx + 1);
    const buf = scryptSync(password, salt, 64);
    return timingSafeEqual(buf, Buffer.from(hashHex, "hex"));
  } catch {
    return false;
  }
}

export function generateToken(userId: number): string {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiry}`;
  const sig = createHmac("sha256", SECRET()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64");
}

export function verifyToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const lastDot = decoded.lastIndexOf(".");
    const sig = decoded.slice(lastDot + 1);
    const payload = decoded.slice(0, lastDot);
    const dotIdx = payload.indexOf(".");
    const userId = Number(payload.slice(0, dotIdx));
    const expiry = Number(payload.slice(dotIdx + 1));
    const expectedSig = createHmac("sha256", SECRET()).update(payload).digest("hex");
    if (sig !== expectedSig) return null;
    if (Date.now() > expiry) return null;
    if (isNaN(userId) || userId <= 0) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const userId = verifyToken(token);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.status === "disabled") return null;
  return user;
}

export function requireRole(...roles: string[]) {
  return async (req: any, res: any, next: any) => {
    const user = await getAuthUser(req);
    if (!user) { res.status(401).json({ error: "未授权，请先登录" }); return; }
    if (roles.length && !roles.includes(user.role)) { res.status(403).json({ error: "权限不足" }); return; }
    req.currentUser = user;
    next();
  };
}

const safeUser = (u: typeof usersTable.$inferSelect) => ({
  id: u.id,
  name: u.name,
  username: u.username,
  role: u.role,
  grade: u.grade,
  className: u.className,
  status: u.status,
});

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "请填写用户名和密码" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || user.status === "disabled") {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }
  const token = generateToken(user.id);
  res.json({ token, user: safeUser(user) });
});

router.get("/auth/me", async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) { res.status(401).json({ error: "未授权" }); return; }
  res.json(safeUser(user));
});

export default router;
