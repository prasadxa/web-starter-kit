import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicalRecordsTable = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  doctorId: integer("doctor_id"),
  appointmentId: integer("appointment_id"),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  diagnosis: text("diagnosis"),
  prescription: text("prescription"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecordsTable).omit({ id: true, createdAt: true });
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecordsTable.$inferSelect;
