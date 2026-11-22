import mongoose from "mongoose";

const lineSchema = new mongoose.Schema({
  detected: { type: Boolean, default: false },
  confidence: { type: Number, min: 0, max: 100, default: 0 },
  description: { type: String },
  coordinates: { type: [[Number]] },
}, { _id: false });

const palmFeatureSchema = new mongoose.Schema(
  {
    scan: { type: mongoose.Schema.Types.ObjectId, ref: "PalmScan", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lifeLine: lineSchema,
    heartLine: lineSchema,
    headLine: lineSchema,
    fateLine: lineSchema,
    sunLine: lineSchema,
    mercuryLine: lineSchema,
    mounts: {
      venus: { type: String },
      jupiter: { type: String },
      saturn: { type: String },
      apollo: { type: String },
      mercury: { type: String },
      mars: { type: String },
      moon: { type: String },
    },
    palmShape: { type: String, enum: ["square", "rectangular", "oval", "spatulate", "unknown"], default: "unknown" },
    fingerProportions: {
      index: { type: String },
      middle: { type: String },
      ring: { type: String },
      little: { type: String },
      thumb: { type: String },
    },
    overallConfidence: { type: Number, min: 0, max: 100, default: 0 },
    rawAnalysis: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("PalmFeature", palmFeatureSchema);
