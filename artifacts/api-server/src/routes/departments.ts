import { Router, type IRouter, type Request, type Response } from "express";
import { db, departmentsTable } from "@workspace/db";
import { CreateDepartmentBody, GetDepartmentsResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/departments", async (req: Request, res: Response) => {
  const departments = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  res.json(GetDepartmentsResponse.parse(departments));
});

router.post("/departments", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const [dept] = await db.insert(departmentsTable).values(parsed.data).returning();
  res.status(201).json(dept);
});

export default router;
