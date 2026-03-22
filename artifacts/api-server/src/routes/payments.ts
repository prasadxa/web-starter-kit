import { Router, type IRouter, type Request, type Response } from "express";
import { db, appointmentsTable, doctorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createNotification } from "./notifications";
import crypto from "crypto";

interface CashfreeOrderResponse {
  order_id: string;
  payment_session_id: string;
  order_status: string;
  cf_order_id: number;
  message?: string;
}

const router: IRouter = Router();

const CASHFREE_API_BASE = process.env.CASHFREE_ENV === "production"
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

const CASHFREE_API_VERSION = "2023-08-01";

router.post("/payments/create-order", async (req: Request, res: Response) => {
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
  const amount = doctor?.consultationFee ? Number(doctor.consultationFee) : 50;

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  try {
    if (!appId || !secretKey) {
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
        demo: true,
        message: "Payment marked as paid (Cashfree not configured). Appointment confirmed.",
      });
      return;
    }

    const orderId = `order_${appointmentId}_${Date.now()}`;

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: req.user.id,
        customer_name: req.user.firstName
          ? `${req.user.firstName} ${req.user.lastName || ""}`.trim()
          : "Patient",
        customer_email: req.user.email || "patient@medibook.app",
        customer_phone: "9999999999",
      },
      order_meta: {
        return_url: `${req.headers.origin || `https://${req.headers.host}`}/api/payments/callback?order_id={order_id}`,
      },
      order_note: `Doctor Appointment #${appointmentId}`,
    };

    const response = await fetch(`${CASHFREE_API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": CASHFREE_API_VERSION,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json() as CashfreeOrderResponse;

    if (!response.ok) {
      console.error("Cashfree order creation failed:", data);
      res.status(500).json({ error: "Failed to create payment order", details: data.message || data });
      return;
    }

    await db
      .update(appointmentsTable)
      .set({ cashfreeOrderId: orderId } as any)
      .where(eq(appointmentsTable.id, appointmentId));

    res.json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderAmount: amount,
      orderCurrency: "INR",
      environment: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox",
    });
  } catch (err) {
    console.error("Payment order error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.get("/payments/callback", async (req: Request, res: Response) => {
  const { order_id } = req.query;

  if (!order_id || typeof order_id !== "string") {
    res.redirect("/dashboard?payment=failed");
    return;
  }

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    res.redirect("/dashboard?payment=success");
    return;
  }

  try {
    const response = await fetch(`${CASHFREE_API_BASE}/orders/${order_id}`, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": CASHFREE_API_VERSION,
      },
    });

    const data = await response.json() as CashfreeOrderResponse;
    const orderStatus = data.order_status;

    const [appt] = await db
      .select()
      .from(appointmentsTable)
      .where(eq((appointmentsTable as any).cashfreeOrderId, order_id));

    if (appt && orderStatus === "PAID") {
      await db
        .update(appointmentsTable)
        .set({
          paymentStatus: "paid",
          paymentId: data.cf_order_id ? String(data.cf_order_id) : order_id,
          status: "booked",
        })
        .where(eq(appointmentsTable.id, appt.id));

      await createNotification(
        appt.patientId,
        "payment_received",
        "Payment Confirmed",
        `Your appointment #${appt.id} has been confirmed and payment received.`,
        "/dashboard"
      );

      res.redirect(`/dashboard?payment=success&appointmentId=${appt.id}`);
    } else if (appt) {
      res.redirect(`/dashboard?payment=failed&appointmentId=${appt.id}`);
    } else {
      res.redirect("/dashboard?payment=failed");
    }
  } catch (err) {
    console.error("Payment callback error:", err);
    res.redirect("/dashboard?payment=failed");
  }
});

router.post("/payments/verify", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { orderId } = req.body;
  if (!orderId) {
    res.status(400).json({ error: "orderId is required" });
    return;
  }

  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    res.json({ status: "PAID", demo: true });
    return;
  }

  try {
    const response = await fetch(`${CASHFREE_API_BASE}/orders/${orderId}`, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": CASHFREE_API_VERSION,
      },
    });

    const data = await response.json() as CashfreeOrderResponse;

    if (data.order_status === "PAID") {
      const [appt] = await db
        .select()
        .from(appointmentsTable)
        .where(eq((appointmentsTable as any).cashfreeOrderId, orderId));

      if (appt && appt.paymentStatus !== "paid") {
        await db
          .update(appointmentsTable)
          .set({
            paymentStatus: "paid",
            paymentId: data.cf_order_id ? String(data.cf_order_id) : orderId,
            status: "booked",
          })
          .where(eq(appointmentsTable.id, appt.id));

        await createNotification(
          appt.patientId,
          "payment_received",
          "Payment Confirmed",
          `Your appointment #${appt.id} has been confirmed and payment received.`,
          "/dashboard"
        );
      }
    }

    res.json({ status: data.order_status, orderId: data.order_id });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

router.post("/payments/webhook", async (req: Request, res: Response) => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secretKey) {
    res.json({ received: true });
    return;
  }

  try {
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    const signature = req.headers["x-webhook-signature"] as string;

    if (signature && secretKey && timestamp) {
      const rawBody = JSON.stringify(req.body);
      const signatureData = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", secretKey)
        .update(signatureData)
        .digest("base64");

      if (signature !== expectedSignature) {
        console.error("Webhook signature mismatch");
        res.status(400).json({ error: "Invalid signature" });
        return;
      }
    }

    const eventType = req.body.type;
    const orderData = req.body.data?.order;

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" && orderData) {
      const orderId = orderData.order_id;
      const [appt] = await db
        .select()
        .from(appointmentsTable)
        .where(eq((appointmentsTable as any).cashfreeOrderId, orderId));

      if (appt && appt.paymentStatus !== "paid") {
        await db
          .update(appointmentsTable)
          .set({
            paymentStatus: "paid",
            paymentId: String(orderData.cf_order_id || orderId),
            status: "booked",
          })
          .where(eq(appointmentsTable.id, appt.id));

        await createNotification(
          appt.patientId,
          "payment_received",
          "Payment Confirmed",
          `Your appointment #${appt.id} has been confirmed and payment received.`,
          "/dashboard"
        );
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).json({ error: "Webhook failed" });
  }
});

export default router;
