import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, doctorsTable } from "@workspace/db";
import { GetUserProfileResponse, UpdateUserProfileBody, UpdateUserProfileResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let doctorId: number | null = user.doctorId ?? null;
  if (!doctorId) {
    const [doc] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, user.id)).limit(1);
    if (doc) doctorId = doc.id;
  }

  res.json(GetUserProfileResponse.parse({
    id: user.id,
    replitUserId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: user.role,
    hospitalId: user.hospitalId ?? null,
    doctorId,
  }));
});

router.patch("/users/profile", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const currentRole = req.user.role;
  const updateData: Partial<typeof usersTable.$inferInsert> = {};

  if (parsed.data.role !== undefined) {
    if (currentRole !== "super_admin") {
      res.status(403).json({ error: "Only super_admin can change roles" });
      return;
    }
    updateData.role = parsed.data.role;
  }

  if (parsed.data.hospitalId !== undefined) {
    if (currentRole !== "super_admin" && currentRole !== "hospital_admin") {
      res.status(403).json({ error: "Only admin users can change hospitalId" });
      return;
    }
    updateData.hospitalId = parsed.data.hospitalId;
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No updatable fields provided" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, req.user.id))
    .returning();

  let doctorId: number | null = updated.doctorId ?? null;
  if (!doctorId) {
    const [doc] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, updated.id)).limit(1);
    if (doc) doctorId = doc.id;
  }

  res.json(UpdateUserProfileResponse.parse({
    id: updated.id,
    replitUserId: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    profileImageUrl: updated.profileImageUrl,
    role: updated.role,
    hospitalId: updated.hospitalId ?? null,
    doctorId,
  }));
});

export default router;
