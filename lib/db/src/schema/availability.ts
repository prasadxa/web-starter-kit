import { pgTable, serial, integer, text, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const availabilityTable = pgTable("availability", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  date: date("date").notNull(),
  timeSlots: text("time_slots").array().notNull().default([]),
}, (table) => [
  unique("availability_doctor_date_unique").on(table.doctorId, table.date),
]);

export const insertAvailabilitySchema = createInsertSchema(availabilityTable).omit({ id: true });
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availabilityTable.$inferSelect;
