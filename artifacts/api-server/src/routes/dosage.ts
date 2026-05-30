import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, dosageCalculationsTable, drugsTable } from "@workspace/db";
import {
  CreateDosageCalculationBody,
  GetDosageCalculationParams,
  DeleteDosageCalculationParams,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router: IRouter = Router();

router.get("/dosage/calculations", async (_req, res): Promise<void> => {
  const calculations = await db
    .select()
    .from(dosageCalculationsTable)
    .orderBy(desc(dosageCalculationsTable.createdAt));
  res.json(calculations);
});

router.post("/dosage/calculations", async (req, res): Promise<void> => {
  const parsed = CreateDosageCalculationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { drugName, patientType, patientWeight, patientAge, indication, specialConditions } = parsed.data;

  const patientTypeLabels: Record<string, string> = {
    pediatric: "Pediatric patient",
    adult: "Adult patient",
    pregnant: "Pregnant patient",
    renal_impairment: "Patient with renal impairment",
    hepatic_impairment: "Patient with hepatic impairment",
    elderly: "Elderly patient (>65 years)",
  };

  const systemPrompt = `You are an expert clinical pharmacist AI. Provide accurate, evidence-based medication dosing recommendations. Always include safety warnings and contraindications. Base recommendations on current clinical guidelines.`;

  const userPrompt = `Calculate the appropriate dose for the following:

Drug: ${drugName}
Patient type: ${patientTypeLabels[patientType] ?? patientType}
${patientWeight ? `Weight: ${patientWeight} kg` : ""}
${patientAge ? `Age: ${patientAge} ${patientType === "pediatric" ? "months/years" : "years"}` : ""}
${indication ? `Indication: ${indication}` : ""}
${specialConditions ? `Special conditions/comorbidities: ${specialConditions}` : ""}

Provide dosing information in the following JSON format exactly:
{
  "recommendedDose": "Specific dose with units (e.g., 10 mg/kg or 500 mg)",
  "frequency": "Dosing frequency (e.g., every 8 hours, twice daily)",
  "route": "Route of administration (e.g., oral, IV, IM)",
  "duration": "Typical treatment duration",
  "warnings": "Key warnings, contraindications, and monitoring requirements",
  "adjustments": "Dose adjustments based on patient factors (renal/hepatic/age/weight)"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  let aiResult = {
    recommendedDose: "",
    frequency: "",
    route: "",
    duration: "",
    warnings: "",
    adjustments: "",
  };

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResult = JSON.parse(jsonMatch[0]);
    } else {
      aiResult.recommendedDose = "See notes";
      aiResult.frequency = "Per clinical judgment";
      aiResult.route = "Per clinical judgment";
      aiResult.duration = "Per clinical judgment";
      aiResult.warnings = content;
      aiResult.adjustments = "Consult pharmacist.";
    }
  } catch {
    aiResult.recommendedDose = "See notes";
    aiResult.frequency = "Per clinical judgment";
    aiResult.route = "Per clinical judgment";
    aiResult.duration = "Per clinical judgment";
    aiResult.warnings = content;
    aiResult.adjustments = "Consult pharmacist.";
  }

  const [calculation] = await db
    .insert(dosageCalculationsTable)
    .values({
      drugName,
      patientType,
      patientWeight: patientWeight ?? null,
      patientAge: patientAge ?? null,
      indication: indication ?? null,
      specialConditions: specialConditions ?? null,
      recommendedDose: aiResult.recommendedDose,
      frequency: aiResult.frequency,
      route: aiResult.route,
      duration: aiResult.duration,
      warnings: aiResult.warnings,
      adjustments: aiResult.adjustments,
    })
    .returning();

  res.status(201).json(calculation);
});

router.get("/dosage/calculations/:id", async (req, res): Promise<void> => {
  const params = GetDosageCalculationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [calc] = await db
    .select()
    .from(dosageCalculationsTable)
    .where(eq(dosageCalculationsTable.id, params.data.id));
  if (!calc) {
    res.status(404).json({ error: "Calculation not found" });
    return;
  }
  res.json(calc);
});

router.delete("/dosage/calculations/:id", async (req, res): Promise<void> => {
  const params = DeleteDosageCalculationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(dosageCalculationsTable)
    .where(eq(dosageCalculationsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Calculation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/dosage/drugs", async (_req, res): Promise<void> => {
  const drugs = await db.select().from(drugsTable).orderBy(drugsTable.name);
  res.json(drugs);
});

export default router;
