import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dosageCalculationsTable = pgTable("dosage_calculations", {
  id: serial("id").primaryKey(),
  drugName: text("drug_name").notNull(),
  patientType: text("patient_type").notNull(),
  patientWeight: real("patient_weight"),
  patientAge: real("patient_age"),
  indication: text("indication"),
  specialConditions: text("special_conditions"),
  recommendedDose: text("recommended_dose").notNull(),
  frequency: text("frequency").notNull(),
  route: text("route").notNull(),
  duration: text("duration").notNull(),
  warnings: text("warnings").notNull(),
  adjustments: text("adjustments").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const drugsTable = pgTable("drugs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  commonIndications: text("common_indications").notNull(),
});

export const insertDosageCalculationSchema = createInsertSchema(dosageCalculationsTable).omit({ id: true, createdAt: true });
export type InsertDosageCalculation = z.infer<typeof insertDosageCalculationSchema>;
export type DosageCalculation = typeof dosageCalculationsTable.$inferSelect;

export const insertDrugSchema = createInsertSchema(drugsTable).omit({ id: true });
export type InsertDrug = z.infer<typeof insertDrugSchema>;
export type Drug = typeof drugsTable.$inferSelect;
