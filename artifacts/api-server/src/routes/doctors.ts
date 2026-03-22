import { Router, type IRouter, type Request, type Response } from "express";
import { db, doctorsTable, usersTable, hospitalsTable, departmentsTable, availabilityTable, reviewsTable } from "@workspace/db";
import {
  GetDoctorsResponse,
  GetDoctorResponse,
  CreateDoctorBody,
  UpdateDoctorBody,
  GetDoctorReviewsResponse,
  GetDoctorAvailabilityResponse,
  SetDoctorAvailabilityBody,
} from "@workspace/api-zod";
import { eq, and, sql, like, gte, lte, desc, asc, inArray } from "drizzle-orm";

const router: IRouter = Router();

function calcScore(rating: number, reviews: number, hasAvailability: boolean): number {
  const reviewScore = reviews > 0 ? Math.log(reviews) * 0.3 : 0;
  const availScore = hasAvailability ? 0.1 : 0;
  return rating * 0.6 + reviewScore + availScore;
}

router.get("/doctors", async (req: Request, res: Response) => {
  const {
    departmentId,
    hospitalId,
    sort,
    search,
    minRating,
    maxFee,
    availableToday,
    page = "1",
    limit = "12",
  } = req.query as Record<string, string>;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 12;
  const offset = (pageNum - 1) * limitNum;

  const isAdmin = req.isAuthenticated() && (req.user.role === "super_admin" || req.user.role === "hospital_admin");

  const conditions: ReturnType<typeof eq>[] = [];
  if (departmentId) conditions.push(eq(doctorsTable.departmentId, parseInt(departmentId)));
  if (hospitalId) conditions.push(eq(doctorsTable.hospitalId, parseInt(hospitalId)));
  if (minRating) conditions.push(sql`${doctorsTable.averageRating} >= ${parseFloat(minRating)}` as ReturnType<typeof eq>);
  if (maxFee) conditions.push(sql`${doctorsTable.consultationFee} <= ${parseFloat(maxFee)}` as ReturnType<typeof eq>);
  if (!isAdmin) conditions.push(eq(hospitalsTable.approved, true));

  const doctorRows = await db
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
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const today = new Date().toISOString().split("T")[0];
  const doctorIds = doctorRows.map(r => r.doctor.id);

  let availMap: Map<number, string | null> = new Map();
  if (doctorIds.length > 0) {
    const avails = await db
      .select()
      .from(availabilityTable)
      .where(
        and(
          inArray(availabilityTable.doctorId, doctorIds),
          sql`${availabilityTable.date} >= ${today}`
        )
      )
      .orderBy(availabilityTable.date);

    for (const a of avails) {
      if (!availMap.has(a.doctorId) && a.timeSlots && a.timeSlots.length > 0) {
        availMap.set(a.doctorId, `${a.date} ${a.timeSlots[0]}`);
      }
    }
  }

  let filtered = doctorRows;

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(r =>
      (r.user?.firstName?.toLowerCase().includes(s)) ||
      (r.user?.lastName?.toLowerCase().includes(s)) ||
      (r.doctor.specialization?.toLowerCase().includes(s)) ||
      (r.department?.name?.toLowerCase().includes(s))
    );
  }

  if (availableToday === "true") {
    const todayAvailDoctorIds = new Set<number>();
    const todayAvails = await db
      .select()
      .from(availabilityTable)
      .where(and(
        inArray(availabilityTable.doctorId, doctorIds),
        eq(availabilityTable.date, today)
      ));
    for (const a of todayAvails) {
      if (a.timeSlots && a.timeSlots.length > 0) todayAvailDoctorIds.add(a.doctorId);
    }
    filtered = filtered.filter(r => todayAvailDoctorIds.has(r.doctor.id));
  }

  const mapped = filtered.map(r => ({
    ...r.doctor,
    firstName: r.doctor.firstName ?? r.user?.firstName ?? null,
    lastName: r.doctor.lastName ?? r.user?.lastName ?? null,
    profileImageUrl: r.user?.profileImageUrl ?? null,
    email: r.user?.email ?? null,
    hospitalName: r.hospital?.name ?? null,
    departmentName: r.department?.name ?? null,
    nextAvailableSlot: availMap.get(r.doctor.id) ?? null,
    isTopRated: r.doctor.averageRating >= 4.5 && r.doctor.totalReviews >= 10,
  }));

  if (sort === "rating") {
    mapped.sort((a, b) => b.averageRating - a.averageRating);
  } else if (sort === "reviews") {
    mapped.sort((a, b) => b.totalReviews - a.totalReviews);
  } else if (sort === "availability") {
    mapped.sort((a, b) => (a.nextAvailableSlot ? 0 : 1) - (b.nextAvailableSlot ? 0 : 1));
  } else {
    mapped.sort((a, b) => {
      const scoreA = calcScore(a.averageRating, a.totalReviews, !!a.nextAvailableSlot);
      const scoreB = calcScore(b.averageRating, b.totalReviews, !!b.nextAvailableSlot);
      return scoreB - scoreA;
    });
  }

  const total = mapped.length;
  const paginated = mapped.slice(offset, offset + limitNum);

  res.json({ doctors: paginated, total, page: pageNum, limit: limitNum });
});

router.post("/doctors", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const role = req.user.role;
  if (role !== "super_admin" && role !== "hospital_admin") {
    res.status(403).json({ error: "Only admin users can create doctors" });
    return;
  }
  const parsed = CreateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  if (role === "hospital_admin") {
    if (!req.user.hospitalId || parsed.data.hospitalId !== req.user.hospitalId) {
      res.status(403).json({ error: "Hospital admins can only create doctors for their own hospital" });
      return;
    }
  }
  const targetUser = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.userId)).limit(1);
  if (!targetUser[0]) {
    res.status(404).json({ error: "User not found for the given userId" });
    return;
  }

  const [doctor] = await db.insert(doctorsTable).values(parsed.data).returning();

  await db
    .update(usersTable)
    .set({
      role: "doctor",
      doctorId: doctor.id,
      hospitalId: doctor.hospitalId,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, doctor.userId));

  const hospital = await db.select().from(hospitalsTable).where(eq(hospitalsTable.id, doctor.hospitalId)).limit(1);
  const department = await db.select().from(departmentsTable).where(eq(departmentsTable.id, doctor.departmentId)).limit(1);
  res.status(201).json({
    ...doctor,
    firstName: targetUser[0]?.firstName ?? null,
    lastName: targetUser[0]?.lastName ?? null,
    profileImageUrl: targetUser[0]?.profileImageUrl ?? null,
    email: targetUser[0]?.email ?? null,
    hospitalName: hospital[0]?.name ?? null,
    departmentName: department[0]?.name ?? null,
    nextAvailableSlot: null,
    isTopRated: false,
  });
});

router.get("/doctors/:id", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));

  const [row] = await db
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
    .where(eq(doctorsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const avail = await db
    .select()
    .from(availabilityTable)
    .where(and(eq(availabilityTable.doctorId, id), sql`${availabilityTable.date} >= ${today}`))
    .orderBy(availabilityTable.date)
    .limit(1);

  const nextSlot = avail[0] && avail[0].timeSlots?.length > 0
    ? `${avail[0].date} ${avail[0].timeSlots[0]}`
    : null;

  const reviews = await db
    .select({
      review: reviewsTable,
      patient: usersTable,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.patientId, usersTable.id))
    .where(eq(reviewsTable.doctorId, id))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(5);

  const recentReviews = reviews.map(r => ({
    ...r.review,
    createdAt: r.review.createdAt instanceof Date ? r.review.createdAt.toISOString() : r.review.createdAt,
    patientFirstName: r.patient?.firstName ?? null,
    patientLastName: r.patient?.lastName ?? null,
    patientProfileImageUrl: r.patient?.profileImageUrl ?? null,
  }));

  res.json({
    ...row.doctor,
    firstName: row.doctor.firstName ?? row.user?.firstName ?? null,
    lastName: row.doctor.lastName ?? row.user?.lastName ?? null,
    profileImageUrl: row.user?.profileImageUrl ?? null,
    email: row.user?.email ?? null,
    hospitalName: row.hospital?.name ?? null,
    departmentName: row.department?.name ?? null,
    nextAvailableSlot: nextSlot,
    isTopRated: row.doctor.averageRating >= 4.5 && row.doctor.totalReviews >= 10,
    recentReviews,
  });
});

router.patch("/doctors/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = parseInt(String(req.params.id));
  const role = req.user.role;

  const [targetDoctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id)).limit(1);
  if (!targetDoctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  if (role === "hospital_admin") {
    if (targetDoctor.hospitalId !== req.user.hospitalId) {
      res.status(403).json({ error: "Forbidden: doctor does not belong to your hospital" });
      return;
    }
  } else if (role === "doctor") {
    const [ownDoc] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, req.user.id)).limit(1);
    if (!ownDoc || ownDoc.id !== id) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }
  } else if (role !== "super_admin") {
    res.status(403).json({ error: "Forbidden: insufficient permissions" });
    return;
  }
  const parsed = UpdateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }
  const [doctor] = await db.update(doctorsTable).set(parsed.data).where(eq(doctorsTable.id, id)).returning();
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }
  res.json({ ...doctor, isTopRated: doctor.averageRating >= 4.5 && doctor.totalReviews >= 10 });
});

router.get("/doctors/:id/reviews", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const reviews = await db
    .select({
      review: reviewsTable,
      patient: usersTable,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.patientId, usersTable.id))
    .where(eq(reviewsTable.doctorId, id))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(reviewsTable)
    .where(eq(reviewsTable.doctorId, id));

  const mapped = reviews.map(r => ({
    ...r.review,
    createdAt: r.review.createdAt instanceof Date ? r.review.createdAt.toISOString() : r.review.createdAt,
    patientFirstName: r.patient?.firstName ?? null,
    patientLastName: r.patient?.lastName ?? null,
    patientProfileImageUrl: r.patient?.profileImageUrl ?? null,
  }));

  res.json({ reviews: mapped, total: count, page, limit });
});

router.get("/doctors/:id/availability", async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  const today = new Date().toISOString().split("T")[0];
  const start = startDate || today;

  const conditions = [eq(availabilityTable.doctorId, id)];
  if (start) conditions.push(sql`${availabilityTable.date} >= ${start}` as ReturnType<typeof eq>);
  if (endDate) conditions.push(sql`${availabilityTable.date} <= ${endDate}` as ReturnType<typeof eq>);

  const avails = await db
    .select()
    .from(availabilityTable)
    .where(and(...conditions))
    .orderBy(availabilityTable.date);

  res.json(avails.map(a => ({
    ...a,
    date: typeof a.date === 'object' && a.date !== null ? String(a.date).split('T')[0] : String(a.date),
  })));
});

router.post("/doctors/:id/availability", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const id = parseInt(String(req.params.id));
  const role = req.user.role;

  const [targetDoctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id)).limit(1);
  if (!targetDoctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  if (role === "hospital_admin") {
    if (targetDoctor.hospitalId !== req.user.hospitalId) {
      res.status(403).json({ error: "Forbidden: doctor does not belong to your hospital" });
      return;
    }
  } else if (role === "doctor") {
    const [ownDoc] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, req.user.id)).limit(1);
    if (!ownDoc || ownDoc.id !== id) {
      res.status(403).json({ error: "Forbidden: cannot manage this doctor's availability" });
      return;
    }
  } else if (role !== "super_admin") {
    res.status(403).json({ error: "Forbidden: cannot manage this doctor's availability" });
    return;
  }
  const parsed = SetDoctorAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const [avail] = await db
    .insert(availabilityTable)
    .values({ doctorId: id, date: parsed.data.date, timeSlots: parsed.data.timeSlots })
    .onConflictDoUpdate({
      target: [availabilityTable.doctorId, availabilityTable.date],
      set: { timeSlots: parsed.data.timeSlots },
    })
    .returning();

  res.json(avail);
});

export default router;
