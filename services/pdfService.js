import PDFDocument from "pdfkit";

/**
 * Generates a bilingual (EN/HI) palmistry report PDF as a Buffer.
 * No hardcoded content — everything comes from the report object.
 */
export const generatePalmReportPDF = (report, language = "en") => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const isHindi = language === "hi";
    const colors = { primary: "#641A78", gold: "#D9A441", text: "#35243B", light: "#F5EAF7" };

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill(colors.primary);
    doc.fillColor("white")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(isHindi ? "हस्तरेखा विश्लेषण रिपोर्ट" : "Palmistry Analysis Report", 50, 25, { align: "center" });

    doc.fontSize(10)
      .font("Helvetica")
      .text(isHindi ? "Bhawishya Dwar — SAVITRAM Foundation द्वारा" : "By Bhawishya Dwar — SAVITRAM Foundation", 50, 55, { align: "center" });

    doc.moveDown(4);

    // ── Report Meta ──────────────────────────────────────────────────────────
    doc.fillColor(colors.gold).fontSize(11).font("Helvetica-Bold")
      .text(isHindi ? "रिपोर्ट विवरण" : "Report Details", { underline: true });
    doc.moveDown(0.3);

    const meta = [
      [isHindi ? "शीर्षक" : "Title", report.title || (isHindi ? "हस्तरेखा रिपोर्ट" : "Palm Reading Report")],
      [isHindi ? "रिपोर्ट प्रकार" : "Report Type", report.reportType || "general"],
      [isHindi ? "भाषा" : "Language", isHindi ? "हिंदी" : "English"],
      [isHindi ? "AI विश्वास स्तर" : "AI Confidence", report.confidenceLevel ? `${report.confidenceLevel}%` : "N/A"],
      [isHindi ? "दिनांक" : "Date", new Date(report.createdAt).toLocaleDateString(isHindi ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })],
    ];

    meta.forEach(([label, value]) => {
      doc.fillColor(colors.primary).fontSize(9).font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.fillColor(colors.text).font("Helvetica").text(value || "—");
    });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(colors.gold).lineWidth(1).stroke();
    doc.moveDown(0.8);

    // ── Summary ──────────────────────────────────────────────────────────────
    if (report.summary) {
      doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold")
        .text(isHindi ? "सारांश" : "Executive Summary");
      doc.moveDown(0.3);
      doc.fillColor(colors.text).fontSize(10).font("Helvetica")
        .text(report.summary, { lineGap: 4 });
      doc.moveDown(0.8);
    }

    // ── Detailed Interpretation ───────────────────────────────────────────────
    if (report.detailedInterpretation) {
      doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold")
        .text(isHindi ? "विस्तृत व्याख्या" : "Detailed Interpretation");
      doc.moveDown(0.3);
      doc.fillColor(colors.text).fontSize(10).font("Helvetica")
        .text(report.detailedInterpretation, { lineGap: 4 });
      doc.moveDown(0.8);
    }

    // ── Sections ─────────────────────────────────────────────────────────────
    const sectionLabels = {
      en: {
        lifeReading: "Life Line & Vitality",
        loveRelationships: "Heart Line & Relationships",
        careerProfessional: "Head & Fate Line — Career",
        financialOutlook: "Wealth & Financial Tendencies",
        personalityAnalysis: "Personality & Mount Analysis",
      },
      hi: {
        lifeReading: "जीवन रेखा और जीवन शक्ति",
        loveRelationships: "हृदय रेखा और संबंध",
        careerProfessional: "मस्तिष्क और भाग्य रेखा — करियर",
        financialOutlook: "धन और वित्तीय प्रवृत्तियां",
        personalityAnalysis: "व्यक्तित्व और पर्वत विश्लेषण",
      },
    };

    if (report.sections) {
      const labels = sectionLabels[language] || sectionLabels.en;
      Object.entries(report.sections).forEach(([key, value]) => {
        if (!value || value === "Not clearly visible in this scan") return;
        doc.fillColor(colors.gold).fontSize(11).font("Helvetica-Bold")
          .text(`✦ ${labels[key] || key}`);
        doc.moveDown(0.2);
        doc.fillColor(colors.text).fontSize(10).font("Helvetica")
          .text(value, { lineGap: 4 });
        doc.moveDown(0.7);
      });
    }

    // ── Positive Observations ─────────────────────────────────────────────────
    if (report.positiveObservations?.length > 0) {
      doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold")
        .text(isHindi ? "शुभ संकेत और शक्तियां" : "Key Strengths & Auspicious Signs");
      doc.moveDown(0.3);
      report.positiveObservations.forEach((obs) => {
        doc.fillColor(colors.gold).fontSize(10).font("Helvetica-Bold").text("• ", { continued: true });
        doc.fillColor(colors.text).font("Helvetica").text(obs, { lineGap: 3 });
      });
      doc.moveDown(0.8);
    }

    // ── Reflection Points ─────────────────────────────────────────────────────
    if (report.reflectionPoints?.length > 0) {
      doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold")
        .text(isHindi ? "चिंतन बिंदु" : "Mindful Reflection Points");
      doc.moveDown(0.3);
      report.reflectionPoints.forEach((pt) => {
        doc.fillColor(colors.primary).fontSize(10).font("Helvetica-Bold").text("◆ ", { continued: true });
        doc.fillColor(colors.text).font("Helvetica").text(pt, { lineGap: 3 });
      });
      doc.moveDown(0.8);
    }

    // ── Disclaimer ────────────────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(colors.gold).lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    const disclaimer = report.disclaimer ||
      (isHindi
        ? "यह पारंपरिक हस्तरेखा शास्त्र पर आधारित व्याख्या है, मनोरंजन और आत्म-चिंतन के लिए। यह वैज्ञानिक भविष्यवाणी नहीं है।"
        : "This is a traditional palmistry interpretation for entertainment and self-reflection. Not a scientific prediction.");
    doc.fillColor("#888888").fontSize(8).font("Helvetica-Oblique")
      .text(`✦ ${disclaimer}`, { align: "center", lineGap: 3 });

    doc.end();
  });
};
