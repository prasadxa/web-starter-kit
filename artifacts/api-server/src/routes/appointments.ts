import { Router, type IRouter, type Request, type Response } from "express";
import { db, appointmentsTable, doctorsTable, usersTable, hospitalsTable, departmentsTable, availabilityTable } from "@workspace/db";
import {
  GetAppointmentsResponse,
  GetAppointmentResponse,
  CreateAppointmentBody,
  UpdateAppointmentBody,
} from "@workspace/api-zod";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

function serializeDates<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serializeDates) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      result[key] = serializeDates((obj as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return obj;
}

router.get("/appointments", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userId = req.user.id;
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { status, doctorId, hospitalId, page = "1", limit = "10" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  const role = user[0].role;
  const conditions: ReturnType<typeof eq>[] = [];

  if (role === "patient") {
    conditions.push(eq(appointmentsTable.patientId, userId));
  } else if (role === "doctor") {
    const doctor = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, userId)).limit(1);
    if (doctor[0]) conditions.push(eq(appointmentsTable.doctorId, doctor[0].id));
  } else if (role === "hospital_admin" && user[0].hospitalId) {
    conditions.push(eq(appointmentsTable.hospitalId, user[0].hospitalId));
  }

  if (status) conditions.push(eq(appointmentsTable.status, status as "booked" | "cancelled" | "completed" | "pending"));
  if (doctorId) conditions.push(eq(appointmentsTable.doctorId, parseInt(doctorId)));
  if (hospitalId) conditions.push(eq(appointmentsTable.hospitalId, parseInt(hospitalId)));

  const rows = await db
    .select({
      appointment: appointmentsTable,
      doctor: doctorsTable,
      doctorUser: usersTable,
      hospital: hospitalsTable,
      department: departmentsTable,
    })
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .leftJoin(hospitalsTable, eq(appointmentsTable.hospitalId, hospitalsTable.id))
    .leftJoin(departmentsTable, eq(doctorsTable.departmentId, departmentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(appointmentsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const mapped = rows.map(r => ({
    ...r.appointment,
    doctorFirstName: r.doctorUser?.firstName ?? null,
    doctorLastName: r.doctorUser?.lastName ?? null,
    doctorProfileImageUrl: r.doctorUser?.profileImageUrl ?? null,
    doctorSpecialization: r.doctor?.specialization ?? null,
    hospitalName: r.hospital?.name ?? null,
    departmentName: r.department?.name ?? null,
    patientFirstName: null as string | null,
    patientLastName: null as string | null,
  }));

  if (role !== "patient") {
    const patientIds = [...new Set(rows.map(r => r.appointment.patientId))];
    if (patientIds.length > 0) {
      const patients = await db.select().from(usersTable).where(sql`${usersTable.id} = ANY(${patientIds})`);
      const patientMap = new Map(patients.map(p => [p.id, p]));
      for (const m of mapped) {
        const p = patientMap.get(m.patientId);
        m.patientFirstName = p?.firstName ?? null;
        m.patientLastName = p?.lastName ?? null;
      }
    }
  }

  res.json(GetAppointmentsResponse.parse(serializeDates({ appointments: mapped, total: count, page: pageNum, limit: limitNum })));
});

router.post("/appointments", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const { doctorId, hospitalId, date, timeSlot, notes } = parsed.data;

  const existing = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, doctorId),
        eq(appointmentsTable.date, date),
        eq(appointmentsTable.timeSlot, timeSlot),
        eq(appointmentsTable.status, "booked"),
      )
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "This time slot is already booked" });
    return;
  }

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      patientId: req.user.id,
      doctorId,
      hospitalId,
      date,
      timeSlot,
      notes: notes ?? null,
      status: "booked",
    })
    .returning();

  res.status(201).json(appointment);
});

router.get("/appointments/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = parseInt(req.params.id);

  const [row] = await db
    .select({
      appointment: appointmentsTable,
      doctor: doctorsTable,
      doctorUser: usersTable,
      hospital: hospitalsTable,
      department: departmentsTable,
    })
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .leftJoin(hospitalsTable, eq(appointmentsTable.hospitalId, hospitalsTable.id))
    .leftJoin(departmentsTable, eq(doctorsTable.departmentId, departmentsTable.id))
    .where(eq(appointmentsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(GetAppointmentResponse.parse(serializeDates({
    ...row.appointment,
    doctorFirstName: row.doctorUser?.firstName ?? null,
    doctorLastName: row.doctorUser?.lastName ?? null,
    doctorProfileImageUrl: row.doctorUser?.profileImageUrl ?? null,
    doctorSpecialization: row.doctor?.specialization ?? null,
    hospitalName: row.hospital?.name ?? null,
    departmentName: row.department?.name ?? null,
    patientFirstName: null,
    patientLastName: null,
  })));
});

router.patch("/appointments/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = parseInt(req.params.id);
  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const [existing] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (parsed.data.date && parsed.data.timeSlot && parsed.data.date !== existing.date || parsed.data.timeSlot !== existing.timeSlot) {
    const conflict = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.doctorId, existing.doctorId),
          eq(appointmentsTable.date, parsed.data.date || existing.date),
          eq(appointmentsTable.timeSlot, parsed.data.timeSlot || existing.timeSlot),
          eq(appointmentsTable.status, "booked"),
        )
      )
      .limit(1);
    if (conflict.length > 0 && conflict[0].id !== id) {
      res.status(409).json({ error: "This time slot is already booked" });
      return;
    }
  }

  const [updated] = await db
    .update(appointmentsTable)
    .set(parsed.data)
    .where(eq(appointmentsTable.id, id))
    .returning();

  res.json(updated);
});

export default router;
