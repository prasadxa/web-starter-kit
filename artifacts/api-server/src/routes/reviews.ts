import { Router, type IRouter, type Request, type Response } from "express";
import { db, reviewsTable, doctorsTable, appointmentsTable, usersTable } from "@workspace/db";
import { CreateReviewBody } from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.post("/reviews", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role !== "patient") {
    res.status(403).json({ error: "Only patients can submit reviews" });
    return;
  }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const { doctorId, appointmentId, rating, comment } = parsed.data;

  if (!appointmentId) {
    res.status(400).json({ error: "appointmentId is required to submit a review" });
    return;
  }

  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, appointmentId))
    .limit(1);

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (appt.patientId !== req.user.id) {
    res.status(403).json({ error: "You can only review your own appointments" });
    return;
  }

  if (appt.doctorId !== doctorId) {
    res.status(400).json({ error: "Appointment does not match the specified doctor" });
    return;
  }

  if (appt.status !== "completed") {
    res.status(400).json({ error: "You can only review completed appointments" });
    return;
  }

  if (appt.hasReview) {
    res.status(409).json({ error: "Review already submitted for this appointment" });
    return;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      patientId: req.user.id,
      doctorId,
      appointmentId,
      rating,
      comment: comment ?? null,
      verifiedPatient: true,
    })
    .returning();

  await db
    .update(appointmentsTable)
    .set({ hasReview: true })
    .where(eq(appointmentsTable.id, appointmentId));

  const [stats] = await db
    .select({
      avg: sql<number>`avg(rating)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.doctorId, doctorId));

  await db
    .update(doctorsTable)
    .set({
      averageRating: stats.avg || 0,
      totalReviews: stats.count || 0,
    })
    .where(eq(doctorsTable.id, doctorId));

  const patient = await db.select().from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);

  res.status(201).json({
    ...review,
    patientFirstName: patient[0]?.firstName ?? null,
    patientLastName: patient[0]?.lastName ?? null,
    patientProfileImageUrl: patient[0]?.profileImageUrl ?? null,
  });
});

router.patch("/reviews/:id/reply", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.user.role !== "doctor") {
    res.status(403).json({ error: "Only doctors can reply to reviews" });
    return;
  }

  const reviewId = parseInt(String(req.params.id));
  const { reply } = req.body;

  if (!reply || typeof reply !== "string") {
    res.status(400).json({ error: "Reply text is required" });
    return;
  }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
  if (!review) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  const [doc] = await db.select().from(doctorsTable).where(eq(doctorsTable.userId, req.user.id)).limit(1);
  if (!doc || doc.id !== review.doctorId) {
    res.status(403).json({ error: "You can only reply to reviews on your own profile" });
    return;
  }

  const [updated] = await db
    .update(reviewsTable)
    .set({ doctorReply: reply, doctorReplyAt: new Date() })
    .where(eq(reviewsTable.id, reviewId))
    .returning();

  const patient = await db.select().from(usersTable).where(eq(usersTable.id, updated.patientId)).limit(1);

  res.json({
    ...updated,
    createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
    doctorReplyAt: updated.doctorReplyAt instanceof Date ? updated.doctorReplyAt.toISOString() : updated.doctorReplyAt,
    patientFirstName: patient[0]?.firstName ?? null,
    patientLastName: patient[0]?.lastName ?? null,
    patientProfileImageUrl: patient[0]?.profileImageUrl ?? null,
  });
});

export default router;
