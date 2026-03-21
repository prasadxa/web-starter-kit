import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, doctorsTable, hospitalsTable, appointmentsTable, reviewsTable, departmentsTable } from "@workspace/db";
import {
  GetAdminAnalyticsResponse,
  GetAdminUsersResponse,
  UpdateAdminUserBody,
  UpdateAdminUserResponse,
} from "@workspace/api-zod";
import { eq, sql, desc, and } from "drizzle-orm";

const router: IRouter = Router();

function requireSuperAdmin(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  if (req.user.role !== "super_admin") {
    res.status(403).json({ error: "Forbidden: super_admin role required" });
    return false;
  }
  return true;
}

router.get("/admin/analytics", async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  const [totalHospitals] = await db.select({ count: sql<number>`count(*)::int` }).from(hospitalsTable);
  const [totalDoctors] = await db.select({ count: sql<number>`count(*)::int` }).from(doctorsTable);
  const [totalPatients] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "patient"));
  const [totalAppointments] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable);
  const [pendingHospitals] = await db.select({ count: sql<number>`count(*)::int` }).from(hospitalsTable).where(eq(hospitalsTable.approved, false));

  const [bookedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(eq(appointmentsTable.status, "booked"));
  const [cancelledCount] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(eq(appointmentsTable.status, "cancelled"));
  const [completedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(eq(appointmentsTable.status, "completed"));
  const [pendingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(eq(appointmentsTable.status, "pending"));

  const topDoctorRows = await db
    .select({
      doctor: doctorsTable,
      user: usersTable,
      hospital: hospitalsTable,
      department: departmentsTable,
    })
    .from(doctorsTable)
    .leftJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .leftJoin(hospitalsTable, eq(doctorsTable.hospitalId, hospitalsTable.id))
    .leftJoin(departmentsTable, eq(doctorsTable.departmentId, departmentsTable.id))
    .orderBy(desc(doctorsTable.averageRating))
    .limit(5);

  const topDoctors = topDoctorRows.map(r => ({
    ...r.doctor,
    firstName: r.user?.firstName ?? null,
    lastName: r.user?.lastName ?? null,
    profileImageUrl: r.user?.profileImageUrl ?? null,
    email: r.user?.email ?? null,
    hospitalName: r.hospital?.name ?? null,
    departmentName: r.department?.name ?? null,
    nextAvailableSlot: null,
    isTopRated: r.doctor.averageRating >= 4.5 && r.doctor.totalReviews >= 10,
  }));

  const recentAppointmentRows = await db
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
    .orderBy(desc(appointmentsTable.createdAt))
    .limit(10);

  const recentAppointments = recentAppointmentRows.map(r => ({
    ...r.appointment,
    doctorFirstName: r.doctorUser?.firstName ?? null,
    doctorLastName: r.doctorUser?.lastName ?? null,
    doctorProfileImageUrl: r.doctorUser?.profileImageUrl ?? null,
    doctorSpecialization: r.doctor?.specialization ?? null,
    hospitalName: r.hospital?.name ?? null,
    departmentName: r.department?.name ?? null,
    patientFirstName: null,
    patientLastName: null,
  }));

  res.json(GetAdminAnalyticsResponse.parse({
    totalHospitals: totalHospitals.count,
    totalDoctors: totalDoctors.count,
    totalPatients: totalPatients.count,
    totalAppointments: totalAppointments.count,
    pendingHospitalApprovals: pendingHospitals.count,
    appointmentsByStatus: {
      booked: bookedCount.count,
      cancelled: cancelledCount.count,
      completed: completedCount.count,
      pending: pendingCount.count,
    },
    topDoctors,
    recentAppointments,
  }));
});

router.get("/admin/users", async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  const users = await db.select().from(usersTable);
  const mapped = users.map(u => ({
    id: u.id,
    replitUserId: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    profileImageUrl: u.profileImageUrl,
    role: u.role,
    hospitalId: u.hospitalId ?? null,
    doctorId: u.doctorId ?? null,
  }));

  res.json(GetAdminUsersResponse.parse(mapped));
});

router.patch("/admin/users", async (req: Request, res: Response) => {
  if (!requireSuperAdmin(req, res)) return;

  const parsed = UpdateAdminUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = { role: parsed.data.role };
  if (parsed.data.hospitalId !== undefined) updateData.hospitalId = parsed.data.hospitalId;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, parsed.data.userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateAdminUserResponse.parse({
    id: updated.id,
    replitUserId: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    profileImageUrl: updated.profileImageUrl,
    role: updated.role,
    hospitalId: updated.hospitalId ?? null,
    doctorId: updated.doctorId ?? null,
  }));
});

export default router;
