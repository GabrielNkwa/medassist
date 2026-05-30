import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, symptomConsultationsTable } from "@workspace/db";
import {
  CreateSymptomConsultationBody,
  GetSymptomConsultationParams,
  DeleteSymptomConsultationParams,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router: IRouter = Router();

router.get("/symptoms/consultations", async (_req, res): Promise<void> => {
  const consultations = await db
    .select()
    .from(symptomConsultationsTable)
    .orderBy(desc(symptomConsultationsTable.createdAt));
  res.json(consultations);
});

router.post("/symptoms/consultations", async (req, res): Promise<void> => {
  const parsed = CreateSymptomConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { patientAge, patientSex, symptoms, duration, medicalHistory, vitals } = parsed.data;

  const systemPrompt = `You are an expert clinical decision support AI. Analyze patient symptoms and provide evidence-based diagnostic assistance. Use standard medical terminology and always recommend clinical correlation.`;

  const userPrompt = `Patient presentation:
- Age: ${patientAge}
- Sex: ${patientSex}
- Chief complaint / symptoms: ${symptoms}
${duration ? `- Duration: ${duration}` : ""}
${medicalHistory ? `- Medical history: ${medicalHistory}` : ""}
${vitals ? `- Vitals: ${vitals}` : ""}

Provide a structured clinical assessment in the following JSON format exactly:
{
  "diagnosis": "Most likely diagnosis with brief rationale",
  "differentials": "2-4 differential diagnoses with brief reasoning for each, separated by semicolons",
  "recommendedTests": "Recommended investigations, separated by semicolons",
  "treatment": "Initial management plan and treatment approach",
  "urgency": "Emergency/Urgent/Semi-urgent/Routine - with brief reasoning"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  let aiResult = {
    diagnosis: "",
    differentials: "",
    recommendedTests: "",
    treatment: "",
    urgency: "",
  };

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResult = JSON.parse(jsonMatch[0]);
    } else {
      aiResult.diagnosis = content;
      aiResult.differentials = "Clinical evaluation required.";
      aiResult.recommendedTests = "Basic workup recommended.";
      aiResult.treatment = "Clinical correlation advised.";
      aiResult.urgency = "Semi-urgent";
    }
  } catch {
    aiResult.diagnosis = content;
    aiResult.differentials = "Clinical evaluation required.";
    aiResult.recommendedTests = "Basic workup recommended.";
    aiResult.treatment = "Clinical correlation advised.";
    aiResult.urgency = "Semi-urgent";
  }

  const [consultation] = await db
    .insert(symptomConsultationsTable)
    .values({
      patientAge,
      patientSex,
      symptoms,
      duration: duration ?? null,
      medicalHistory: medicalHistory ?? null,
      vitals: vitals ?? null,
      diagnosis: aiResult.diagnosis,
      differentials: aiResult.differentials,
      recommendedTests: aiResult.recommendedTests,
      treatment: aiResult.treatment,
      urgency: aiResult.urgency,
    })
    .returning();

  res.status(201).json(consultation);
});

router.get("/symptoms/consultations/:id", async (req, res): Promise<void> => {
  const params = GetSymptomConsultationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [consultation] = await db
    .select()
    .from(symptomConsultationsTable)
    .where(eq(symptomConsultationsTable.id, params.data.id));
  if (!consultation) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  res.json(consultation);
});

router.delete("/symptoms/consultations/:id", async (req, res): Promise<void> => {
  const params = DeleteSymptomConsultationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(symptomConsultationsTable)
    .where(eq(symptomConsultationsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
