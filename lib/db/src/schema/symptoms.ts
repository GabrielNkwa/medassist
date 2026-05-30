import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const symptomConsultationsTable = pgTable("symptom_consultations", {
  id: serial("id").primaryKey(),
  patientAge: integer("patient_age").notNull(),
  patientSex: text("patient_sex").notNull(),
  symptoms: text("symptoms").notNull(),
  duration: text("duration"),
  medicalHistory: text("medical_history"),
  vitals: text("vitals"),
  diagnosis: text("diagnosis").notNull(),
  differentials: text("differentials").notNull(),
  recommendedTests: text("recommended_tests").notNull(),
  treatment: text("treatment").notNull(),
  urgency: text("urgency").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSymptomConsultationSchema = createInsertSchema(symptomConsultationsTable).omit({ id: true, createdAt: true });
export type InsertSymptomConsultation = z.infer<typeof insertSymptomConsultationSchema>;
export type SymptomConsultation = typeof symptomConsultationsTable.$inferSelect;
