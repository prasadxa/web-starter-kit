import { Router, type IRouter, type Request, type Response } from "express";
import { db, hospitalsTable } from "@workspace/db";
import {
  GetHospitalsResponse,
  GetHospitalResponse,
  CreateHospitalBody,
  UpdateHospitalBody,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function serializeHospital(h: typeof hospitalsTable.$inferSelect) {
  return {
    ...h,
    createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
  };
}

router.get("/hospitals", async (req: Request, res: Response) => {
  const isAdmin = req.isAuthenticated() && (req.user.role === "super_admin" || req.user.role === "hospital_admin");

  let approvedFilter: boolean | undefined;
  if (isAdmin && req.query.approved !== undefined) {
    approvedFilter = req.query.approved === "true" || req.query.approved === "1";
  } else if (!isAdmin) {
    approvedFilter = true;
  }

  const rows = approvedFilter !== undefined
    ? await db.select().from(hospitalsTable).where(eq(hospitalsTable.approved, approvedFilter))
    : await db.select().from(hospitalsTable);
  res.json(rows.map(serializeHospital));
});

router.post("/hospitals", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const role = req.user.role;
  if (role !== "super_admin" && role !== "hospital_admin") {
    res.status(403).json({ error: "Only admin users can create hospitals" });
    return;
  }
  const parsed = CreateHospitalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const insertData = { ...parsed.data };
  if (role !== "super_admin") {
    delete (insertData as Record<string, unknown>).approved;
  }
  const [hospital] = await db.insert(hospitalsTable).values(insertData).returning();
  res.status(201).json(hospital);
});

router.get("/hospitals/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, id));
  if (!hospital) {
    res.status(404).json({ error: "Hospital not found" });
    return;
  }
  res.json(serializeHospital(hospital));
});

router.patch("/hospitals/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = parseInt(String(req.params.id));
  const role = req.user.role;
  const canEdit =
    role === "super_admin" ||
    (role === "hospital_admin" && req.user.hospitalId === id);
  if (!canEdit) {
    res.status(403).json({ error: "Forbidden: insufficient permissions" });
    return;
  }
  const parsed = UpdateHospitalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const safeUpdate = { ...parsed.data };
  if (role !== "super_admin") {
    delete (safeUpdate as Record<string, unknown>).approved;
  }
  const [hospital] = await db.update(hospitalsTable).set(safeUpdate).where(eq(hospitalsTable.id, id)).returning();
  if (!hospital) {
    res.status(404).json({ error: "Hospital not found" });
    return;
  }
  res.json(hospital);
});

export default router;
