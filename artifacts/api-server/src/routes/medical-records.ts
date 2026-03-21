import { Router, type IRouter, type Request, type Response } from "express";
import { db, medicalRecordsTable, doctorsTable, appointmentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

function serializeRecord(r: typeof medicalRecordsTable.$inferSelect) {
  return {
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

router.get("/medical-records", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const patientId = req.user.id;

  const records = await db
    .select()
    .from(medicalRecordsTable)
    .where(eq(medicalRecordsTable.patientId, patientId))
    .orderBy(desc(medicalRecordsTable.createdAt));

  res.json(records.map(serializeRecord));
});

router.post("/medical-records", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const role = req.user.role;
  const { patientId, title, description, fileUrl, fileType, diagnosis, prescription, appointmentId, recordType } = req.body;

  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  let resolvedPatientId: string;
  let doctorId: number | null = null;

  if (role === "patient") {
    resolvedPatientId = req.user.id;
  } else if (role === "doctor") {
    if (!patientId) {
      res.status(400).json({ error: "patientId is required for doctors" });
      return;
    }
    const [doc] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, req.user.id)).limit(1);
    if (!doc) {
      res.status(403).json({ error: "Doctor profile not found" });
      return;
    }
    doctorId = doc.id;
    const [appt] = await db.select().from(appointmentsTable)
      .where(and(eq(appointmentsTable.doctorId, doc.id), eq(appointmentsTable.patientId, patientId)))
      .limit(1);
    if (!appt) {
      res.status(403).json({ error: "No appointment relationship with this patient" });
      return;
    }
    resolvedPatientId = patientId;
  } else {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [record] = await db
    .insert(medicalRecordsTable)
    .values({
      patientId: resolvedPatientId,
      doctorId,
      appointmentId: appointmentId ?? null,
      title,
      description: description ?? null,
      fileUrl: fileUrl ?? null,
      fileType: fileType ?? null,
      diagnosis: diagnosis ?? null,
      prescription: prescription ?? null,
    })
    .returning();

  res.status(201).json(serializeRecord(record));
});

export default router;
