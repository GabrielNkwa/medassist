import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, radiologyAnalysesTable, symptomConsultationsTable, dosageCalculationsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [radiologyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(radiologyAnalysesTable);

  const [symptomsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(symptomConsultationsTable);

  const [dosageCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dosageCalculationsTable);

  const recentRadiology = await db
    .select({ createdAt: radiologyAnalysesTable.createdAt, imageType: radiologyAnalysesTable.imageType })
    .from(radiologyAnalysesTable)
    .orderBy(desc(radiologyAnalysesTable.createdAt))
    .limit(3);

  const recentSymptoms = await db
    .select({ createdAt: symptomConsultationsTable.createdAt, symptoms: symptomConsultationsTable.symptoms })
    .from(symptomConsultationsTable)
    .orderBy(desc(symptomConsultationsTable.createdAt))
    .limit(3);

  const recentDosage = await db
    .select({ createdAt: dosageCalculationsTable.createdAt, drugName: dosageCalculationsTable.drugName })
    .from(dosageCalculationsTable)
    .orderBy(desc(dosageCalculationsTable.createdAt))
    .limit(3);

  const recentActivity = [
    ...recentRadiology.map((r) => ({
      type: "radiology",
      description: `Radiology analysis: ${r.imageType}`,
      createdAt: r.createdAt.toISOString(),
    })),
    ...recentSymptoms.map((s) => ({
      type: "symptoms",
      description: `Symptom consultation: ${s.symptoms.slice(0, 60)}${s.symptoms.length > 60 ? "..." : ""}`,
      createdAt: s.createdAt.toISOString(),
    })),
    ...recentDosage.map((d) => ({
      type: "dosage",
      description: `Dose calculation: ${d.drugName}`,
      createdAt: d.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  res.json({
    totalRadiologyAnalyses: radiologyCount?.count ?? 0,
    totalSymptomConsultations: symptomsCount?.count ?? 0,
    totalDosageCalculations: dosageCount?.count ?? 0,
    recentActivity,
  });
});

export default router;
