import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const radiologyAnalysesTable = pgTable("radiology_analyses", {
  id: serial("id").primaryKey(),
  imageBase64: text("image_base64").notNull(),
  imageType: text("image_type").notNull(),
  patientAge: integer("patient_age"),
  patientSex: text("patient_sex"),
  clinicalNotes: text("clinical_notes"),
  findings: text("findings").notNull(),
  impression: text("impression").notNull(),
  recommendations: text("recommendations").notNull(),
  confidence: text("confidence").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRadiologyAnalysisSchema = createInsertSchema(radiologyAnalysesTable).omit({ id: true, createdAt: true });
export type InsertRadiologyAnalysis = z.infer<typeof insertRadiologyAnalysisSchema>;
export type RadiologyAnalysis = typeof radiologyAnalysesTable.$inferSelect;
