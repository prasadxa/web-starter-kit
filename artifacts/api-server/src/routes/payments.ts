import { Router, type IRouter, type Request, type Response } from "express";
import { db, appointmentsTable, doctorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createNotification } from "./notifications";

const router: IRouter = Router();

router.post("/payments/create-session", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { appointmentId } = req.body;
  if (!appointmentId) {
    res.status(400).json({ error: "appointmentId is required" });
    return;
  }

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, appointmentId));
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (appt.patientId !== req.user.id) {
    res.status(403).json({ error: "Not your appointment" });
    return;
  }

  if (appt.paymentStatus === "paid") {
    res.status(400).json({ error: "Already paid" });
    return;
  }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, appt.doctorId));
  const amount = doctor?.consultationFee ? Math.round(Number(doctor.consultationFee) * 100) : 5000;

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      await db
        .update(appointmentsTable)
        .set({ paymentStatus: "paid", status: "booked" })
        .where(eq(appointmentsTable.id, appointmentId));

      await createNotification(
        appt.patientId,
        "payment_received",
        "Payment Confirmed",
        `Your appointment #${appointmentId} has been confirmed.`,
        "/dashboard"
      );

      res.json({
        sessionId: `demo_session_${appointmentId}`,
        url: "",
        demo: true,
        message: "Payment marked as paid (Stripe not configured). Appointment confirmed.",
      });
      return;
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Doctor Appointment #${appointmentId}`,
              description: `Consultation on ${appt.date} at ${appt.timeSlot}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/dashboard?payment=success&appointmentId=${appointmentId}`,
      cancel_url: `${origin}/dashboard?payment=cancelled&appointmentId=${appointmentId}`,
      metadata: { appointmentId: String(appointmentId) },
    });

    await db
      .update(appointmentsTable)
      .set({ stripeSessionId: session.id })
      .where(eq(appointmentsTable.id, appointmentId));

    res.json({ sessionId: session.id, url: session.url || "" });
  } catch (err) {
    console.error("Payment session error:", err);
    res.status(500).json({ error: "Failed to create payment session" });
  }
});

router.post("/payments/webhook", async (req: Request, res: Response) => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      res.json({ received: true });
      return;
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      res.status(400).json({ error: "Missing signature or webhook secret" });
      return;
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const appointmentId = parseInt(session.metadata?.appointmentId);

      if (appointmentId) {
        await db
          .update(appointmentsTable)
          .set({
            paymentStatus: "paid",
            paymentId: session.payment_intent,
            status: "booked",
          })
          .where(eq(appointmentsTable.id, appointmentId));

        const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, appointmentId));
        if (appt) {
          await createNotification(
            appt.patientId,
            "payment_received",
            "Payment Confirmed",
            `Your appointment #${appointmentId} has been confirmed and payment received.`,
            "/dashboard"
          );
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).json({ error: "Webhook failed" });
  }
});

export default router;
