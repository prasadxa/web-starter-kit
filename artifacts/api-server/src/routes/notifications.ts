import { Router, type IRouter, type Request, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

function serializeNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    ...n,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
  };
}

router.get("/notifications", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const page = parseInt(String(req.query.page)) || 1;
  const limit = parseInt(String(req.query.limit)) || 20;
  const offset = (page - 1) * limit;
  const unreadOnly = req.query.unreadOnly === "true";

  const conditions = [eq(notificationsTable.userId, req.user.id)];
  if (unreadOnly) {
    conditions.push(eq(notificationsTable.read, false));
  }

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(and(...conditions))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(and(...conditions));

  const [unreadResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, req.user.id), eq(notificationsTable.read, false)));

  res.json({
    notifications: rows.map(serializeNotification),
    total: totalResult?.count ?? 0,
    unreadCount: unreadResult?.count ?? 0,
  });
});

router.patch("/notifications/:id/read", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(String(req.params.id));
  const [notif] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));

  if (!notif || notif.userId !== req.user.id) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

router.patch("/notifications/read-all", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.userId, req.user.id), eq(notificationsTable.read, false)));

  res.json({ success: true });
});

export async function createNotification(userId: string, type: string, title: string, message: string, link?: string) {
  await db.insert(notificationsTable).values({
    userId,
    type: type as any,
    title,
    message,
    link: link ?? null,
  });
}

export default router;
