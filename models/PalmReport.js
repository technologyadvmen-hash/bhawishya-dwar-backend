import mongoose from "mongoose";

const palmReportSchema = new mongoose.Schema(
  {
    scan: { type: mongoose.Schema.Types.ObjectId, ref: "PalmScan", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    features: { type: mongoose.Schema.Types.ObjectId, ref: "PalmFeature" },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    reportType: {
      type: String,
      enum: ["life", "love", "career", "finance", "personality", "general"],
      default: "general",
    },
    title: { type: String },
    summary: { type: String },
    detailedInterpretation: { type: String },
    positiveObservations: [{ type: String }],
    reflectionPoints: [{ type: String }],
    sections: {
      lifeReading: { type: String },
      loveRelationships: { type: String },
      careerProfessional: { type: String },
      financialOutlook: { type: String },
      personalityAnalysis: { type: String },
    },
    confidenceLevel: { type: Number, min: 0, max: 100 },
    disclaimer: { type: String },
    pdfUrl: { type: String },
    pdfS3Key: { type: String },
    tokensUsed: { type: Number, default: 0 },
    model: { type: String },
  },
  { timestamps: true }
);

palmReportSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("PalmReport", palmReportSchema);
