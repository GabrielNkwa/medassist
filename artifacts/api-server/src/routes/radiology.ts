import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, radiologyAnalysesTable } from "@workspace/db";
import {
  CreateRadiologyAnalysisBody,
  GetRadiologyAnalysisParams,
  DeleteRadiologyAnalysisParams,
} from "@workspace/api-zod";
import { openai } from "../lib/openai";

const router: IRouter = Router();

router.get("/radiology/analyses", async (_req, res): Promise<void> => {
  const analyses = await db
    .select()
    .from(radiologyAnalysesTable)
    .orderBy(desc(radiologyAnalysesTable.createdAt));
  res.json(analyses);
});

router.post("/radiology/analyses", async (req, res): Promise<void> => {
  const parsed = CreateRadiologyAnalysisBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64, imageType, patientAge, patientSex, clinicalNotes } = parsed.data;

  const patientContext = [
    patientAge ? `Patient age: ${patientAge}` : null,
    patientSex ? `Patient sex: ${patientSex}` : null,
    clinicalNotes ? `Clinical notes: ${clinicalNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are an expert radiologist AI assistant. Analyze the provided medical image and provide a structured clinical report. Be precise, thorough, and use standard radiological terminology. Always include appropriate clinical caveats.`;

  const userPrompt = `Please analyze this medical imaging study and provide a structured report.
${patientContext ? `\nPatient information:\n${patientContext}` : ""}

Provide your response in the following JSON format exactly:
{
  "findings": "Detailed description of all findings observed in the image",
  "impression": "Concise summary of key findings and their clinical significance",
  "recommendations": "Suggested follow-up imaging, clinical correlation, or management",
  "confidence": "High/Moderate/Low - with brief explanation"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1500,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageType};base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";
  let aiResult = { findings: "", impression: "", recommendations: "", confidence: "" };
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      aiResult = JSON.parse(jsonMatch[0]);
    } else {
      aiResult.findings = content;
      aiResult.impression = "See findings above.";
      aiResult.recommendations = "Clinical correlation recommended.";
      aiResult.confidence = "Moderate";
    }
  } catch {
    aiResult.findings = content;
    aiResult.impression = "See findings above.";
    aiResult.recommendations = "Clinical correlation recommended.";
    aiResult.confidence = "Moderate";
  }

  const [analysis] = await db
    .insert(radiologyAnalysesTable)
    .values({
      imageBase64,
      imageType,
      patientAge: patientAge ?? null,
      patientSex: patientSex ?? null,
      clinicalNotes: clinicalNotes ?? null,
      findings: aiResult.findings,
      impression: aiResult.impression,
      recommendations: aiResult.recommendations,
      confidence: aiResult.confidence,
    })
    .returning();

  res.status(201).json(analysis);
});

router.get("/radiology/analyses/:id", async (req, res): Promise<void> => {
  const params = GetRadiologyAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [analysis] = await db
    .select()
    .from(radiologyAnalysesTable)
    .where(eq(radiologyAnalysesTable.id, params.data.id));
  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.json(analysis);
});

router.delete("/radiology/analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteRadiologyAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(radiologyAnalysesTable)
    .where(eq(radiologyAnalysesTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/radiology/stats", async (_req, res): Promise<void> => {
  const total = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(radiologyAnalysesTable);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(radiologyAnalysesTable)
    .where(sql`${radiologyAnalysesTable.createdAt} >= ${weekAgo}`);

  const byType = await db
    .select({
      imageType: radiologyAnalysesTable.imageType,
      count: sql<number>`count(*)::int`,
    })
    .from(radiologyAnalysesTable)
    .groupBy(radiologyAnalysesTable.imageType);

  res.json({
    total: total[0]?.count ?? 0,
    thisWeek: thisWeek[0]?.count ?? 0,
    byType,
  });
});

export default router;
