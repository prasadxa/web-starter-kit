import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  hospitalId: integer("hospital_id").notNull(),
  departmentId: integer("department_id").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  experience: integer("experience").notNull().default(0),
  consultationFee: real("consultation_fee").notNull().default(0),
  averageRating: real("average_rating").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  bio: text("bio"),
  specialization: text("specialization"),
  qualification: text("qualification"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true, averageRating: true, totalReviews: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
