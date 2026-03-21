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

router.get("/hospitals", async (req: Request, res: Response) => {
  let query = db.select().from(hospitalsTable);
  const approved = req.query.approved;
  if (approved !== undefined) {
    const rows = await db.select().from(hospitalsTable).where(eq(hospitalsTable.approved, approved === "true"));
    res.json(GetHospitalsResponse.parse(rows));
    return;
  }
  const rows = await query;
  res.json(GetHospitalsResponse.parse(rows));
});

router.post("/hospitals", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.user.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can create hospitals" });
    return;
  }
  const parsed = CreateHospitalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const [hospital] = await db.insert(hospitalsTable).values(parsed.data).returning();
  res.status(201).json(hospital);
});

router.get("/hospitals/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const [hospital] = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, id));
  if (!hospital) {
    res.status(404).json({ error: "Hospital not found" });
    return;
  }
  res.json(GetHospitalResponse.parse(hospital));
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
