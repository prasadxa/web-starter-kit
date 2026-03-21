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

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error" });
    return;
  }

  const { doctorId, appointmentId, rating, comment } = parsed.data;

  if (appointmentId) {
    const existing = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.appointmentId, appointmentId))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Review already submitted for this appointment" });
      return;
    }
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      patientId: req.user.id,
      doctorId,
      appointmentId: appointmentId ?? null,
      rating,
      comment: comment ?? null,
    })
    .returning();

  if (appointmentId) {
    await db
      .update(appointmentsTable)
      .set({ hasReview: true })
      .where(eq(appointmentsTable.id, appointmentId));
  }

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

export default router;
