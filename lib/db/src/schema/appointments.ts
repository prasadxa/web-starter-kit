import { pgTable, serial, integer, text, date, timestamp, pgEnum, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const appointmentStatusEnum = pgEnum("appointment_status", ["booked", "cancelled", "completed", "pending"]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  hospitalId: integer("hospital_id").notNull(),
  date: date("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  status: appointmentStatusEnum("status").notNull().default("booked"),
  notes: text("notes"),
  hasReview: boolean("has_review").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("appointments_no_double_book_idx").on(table.doctorId, table.date, table.timeSlot).where(sql`${table.status} = 'booked'`),
]);

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, hasReview: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
