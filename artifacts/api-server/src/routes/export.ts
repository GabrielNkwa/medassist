import { Router } from "express";
import PDFDocument from "pdfkit";
import { db } from "@workspace/db";
import {
  radiologyAnalysesTable,
  symptomConsultationsTable,
  dosageCalculationsTable,
} from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router = Router();

const PRIMARY = "#1d6f8f";
const DARK = "#1a2332";
const MUTED = "#6b7280";
const LIGHT_BG = "#f8fafc";
const BORDER = "#dde3ea";
const WARN = "#b91c1c";

function drawHRule(doc: PDFKit.PDFDocument, y: number) {
  doc
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .strokeColor(BORDER)
    .lineWidth(0.5)
    .stroke();
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, icon: string) {
  const top = doc.y + 10;
  doc
    .rect(50, top, doc.page.width - 100, 26)
    .fill(PRIMARY);
  doc
    .fontSize(11)
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .text(`${icon}  ${title}`, 60, top + 7, { lineBreak: false });
  doc.moveDown(0.2);
  doc.y = top + 32;
}

function badge(
  doc: PDFKit.PDFDocument,
  label: string,
  x: number,
  y: number,
  color: string = PRIMARY,
) {
  const w = doc.widthOfString(label) + 12;
  doc.rect(x, y - 2, w, 16).fill(color + "22");
  doc
    .fontSize(8)
    .fillColor(color)
    .font("Helvetica-Bold")
    .text(label, x + 6, y, { lineBreak: false });
}

function kv(
  doc: PDFKit.PDFDocument,
  key: string,
  value: string | null | undefined,
  opts: { color?: string; bold?: boolean } = {},
) {
  if (!value) return;
  doc
    .fontSize(9)
    .fillColor(MUTED)
    .font("Helvetica-Bold")
    .text(`${key}: `, { continued: true, lineBreak: false });
  doc
    .fontSize(9)
    .fillColor(opts.color ?? DARK)
    .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
    .text(value);
}

router.get("/export/patient-history", async (req, res) => {
  try {
    const [radiology, symptoms, dosage] = await Promise.all([
      db
        .select()
        .from(radiologyAnalysesTable)
        .orderBy(desc(radiologyAnalysesTable.createdAt))
        .limit(50),
      db
        .select()
        .from(symptomConsultationsTable)
        .orderBy(desc(symptomConsultationsTable.createdAt))
        .limit(50),
      db
        .select()
        .from(dosageCalculationsTable)
        .orderBy(desc(dosageCalculationsTable.createdAt))
        .limit(50),
    ]);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: "MedAssist Patient History Report",
        Author: "MedAssist Clinical Decision Support",
        Subject: "Clinical Summary Export",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="medassist-history-${Date.now()}.pdf"`,
    );
    doc.pipe(res);

    const pageW = doc.page.width - 100;
    const generatedAt = new Date().toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    });

    doc
      .rect(50, 50, pageW, 72)
      .fill(DARK);

    doc
      .fontSize(22)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text("MedAssist", 65, 62, { lineBreak: false });

    doc
      .fontSize(10)
      .fillColor("#94a3b8")
      .font("Helvetica")
      .text("Clinical Decision Support", 65, 87);

    doc
      .fontSize(9)
      .fillColor("#cbd5e1")
      .font("Helvetica")
      .text(`Patient History Report  •  Generated ${generatedAt}`, 65, 103);

    doc.y = 138;

    doc
      .rect(50, doc.y, pageW, 32)
      .fill(LIGHT_BG);
    const summaryY = doc.y + 8;
    const col = pageW / 3;

    const counts = [
      { label: "Radiology Analyses", val: radiology.length },
      { label: "Symptom Consultations", val: symptoms.length },
      { label: "Dosage Calculations", val: dosage.length },
    ];
    counts.forEach((c, i) => {
      doc
        .fontSize(14)
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .text(String(c.val), 50 + col * i + 12, summaryY, {
          lineBreak: false,
        });
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .font("Helvetica")
        .text(c.label, 50 + col * i + 30, summaryY + 2, { lineBreak: false });
    });

    doc.y = summaryY + 40;
    drawHRule(doc, doc.y);
    doc.moveDown(1);

    if (radiology.length > 0) {
      sectionHeader(doc, "Radiology Analyses", "⬤");

      radiology.forEach((r, idx) => {
        if (doc.y > 680) doc.addPage();

        const cardTop = doc.y + 4;
        doc
          .rect(50, cardTop, pageW, 10)
          .fill(LIGHT_BG);

        doc
          .fontSize(10)
          .fillColor(DARK)
          .font("Helvetica-Bold")
          .text(`Analysis #${idx + 1}`, 56, cardTop + 1);

        const dateStr = new Date(r.createdAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        doc
          .fontSize(8)
          .fillColor(MUTED)
          .font("Helvetica")
          .text(dateStr, 56, cardTop + 12);

        if (r.patientAge || r.patientSex) {
          const info = [r.patientAge ? `Age: ${r.patientAge}` : null, r.patientSex ?? null]
            .filter(Boolean)
            .join("  •  ");
          doc
            .fontSize(8)
            .fillColor(MUTED)
            .font("Helvetica")
            .text(info, { continued: false });
        }

        doc.moveDown(0.3);
        badge(doc, r.confidence ?? "unknown", 56, doc.y);
        doc.moveDown(1.2);

        kv(doc, "Impression", r.impression, { bold: true, color: DARK });
        kv(doc, "Findings", r.findings);
        kv(doc, "Recommendations", r.recommendations);
        if (r.clinicalNotes) kv(doc, "Clinical Notes", r.clinicalNotes);

        doc.moveDown(0.5);
        drawHRule(doc, doc.y);
        doc.moveDown(0.6);
      });
    }

    if (symptoms.length > 0) {
      if (doc.y > 600) doc.addPage();
      doc.moveDown(0.5);
      sectionHeader(doc, "Symptom Consultations", "⬤");

      symptoms.forEach((s, idx) => {
        if (doc.y > 680) doc.addPage();

        const cardTop = doc.y + 4;
        doc
          .rect(50, cardTop, pageW, 10)
          .fill(LIGHT_BG);

        doc
          .fontSize(10)
          .fillColor(DARK)
          .font("Helvetica-Bold")
          .text(`Consultation #${idx + 1}`, 56, cardTop + 1);

        const dateStr = new Date(s.createdAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        doc
          .fontSize(8)
          .fillColor(MUTED)
          .font("Helvetica")
          .text(dateStr, 56, cardTop + 12);

        doc
          .fontSize(8)
          .fillColor(MUTED)
          .font("Helvetica")
          .text(`Age: ${s.patientAge}  •  Sex: ${s.patientSex}`);

        doc.moveDown(0.2);

        const urgencyColor =
          s.urgency?.toLowerCase().includes("high") ||
          s.urgency?.toLowerCase().includes("emergency")
            ? WARN
            : s.urgency?.toLowerCase().includes("medium") ||
                s.urgency?.toLowerCase().includes("moderate")
              ? "#d97706"
              : "#16a34a";
        badge(doc, s.urgency ?? "unknown", 56, doc.y, urgencyColor);
        doc.moveDown(1.2);

        kv(doc, "Diagnosis", s.diagnosis, { bold: true, color: DARK });
        kv(doc, "Symptoms", s.symptoms);
        kv(doc, "Differentials", s.differentials);
        kv(doc, "Treatment Plan", s.treatment);
        kv(doc, "Recommended Tests", s.recommendedTests);
        if (s.duration) kv(doc, "Duration", s.duration);

        doc.moveDown(0.5);
        drawHRule(doc, doc.y);
        doc.moveDown(0.6);
      });
    }

    if (dosage.length > 0) {
      if (doc.y > 600) doc.addPage();
      doc.moveDown(0.5);
      sectionHeader(doc, "Dosage Calculations", "⬤");

      dosage.forEach((d, idx) => {
        if (doc.y > 680) doc.addPage();

        const cardTop = doc.y + 4;
        doc
          .rect(50, cardTop, pageW, 10)
          .fill(LIGHT_BG);

        doc
          .fontSize(10)
          .fillColor(DARK)
          .font("Helvetica-Bold")
          .text(`Calculation #${idx + 1} — ${d.drugName}`, 56, cardTop + 1);

        const dateStr = new Date(d.createdAt).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        doc
          .fontSize(8)
          .fillColor(MUTED)
          .font("Helvetica")
          .text(dateStr, 56, cardTop + 12);

        doc
          .fontSize(8)
          .fillColor(MUTED)
          .font("Helvetica")
          .text(
            `Type: ${d.patientType.replace("_", " ")}` +
              (d.patientWeight ? `  •  Weight: ${d.patientWeight} kg` : "") +
              (d.patientAge ? `  •  Age: ${d.patientAge}` : ""),
          );

        doc.moveDown(0.3);
        kv(doc, "Dose", d.recommendedDose, { bold: true, color: PRIMARY });
        kv(doc, "Route", d.route);
        kv(doc, "Frequency", d.frequency);
        if (d.adjustments) kv(doc, "Adjustments", d.adjustments);
        if (d.warnings) kv(doc, "Warnings", d.warnings, { color: WARN });
        if (d.indication) kv(doc, "Indication", d.indication);

        doc.moveDown(0.5);
        drawHRule(doc, doc.y);
        doc.moveDown(0.6);
      });
    }

    const totalPages = (doc.bufferedPageRange().count + doc.bufferedPageRange().start);
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor(MUTED)
        .font("Helvetica")
        .text(
          `MedAssist Clinical Export  •  Page ${i - range.start + 1} of ${range.count}  •  For clinical use only`,
          50,
          doc.page.height - 35,
          { align: "center", width: pageW },
        );
    }

    doc.end();
  } catch (err) {
    req.log.error(err, "PDF export failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
});

export default router;
