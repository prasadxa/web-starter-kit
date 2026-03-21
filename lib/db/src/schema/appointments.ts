import { pgTable, serial, integer, text, date, timestamp, pgEnum, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const appointmentStatusEnum = pgEnum("appointment_status", ["booked", "cancelled", "completed", "pending"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const consultationTypeEnum = pgEnum("consultation_type", ["offline", "online"]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  hospitalId: integer("hospital_id").notNull(),
  date: date("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  hasReview: boolean("has_review").notNull().default(false),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentId: text("payment_id"),
  stripeSessionId: text("stripe_session_id"),
  consultationType: consultationTypeEnum("consultation_type").notNull().default("offline"),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("appointments_no_double_book_idx").on(table.doctorId, table.date, table.timeSlot).where(sql`${table.status} IN ('booked', 'pending')`),
]);

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, hasReview: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
