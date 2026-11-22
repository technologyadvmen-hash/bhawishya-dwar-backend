import mongoose from "mongoose";

const astrologyReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "birth_chart", "compatibility", "planetary"],
      required: true,
    },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    zodiacSign: { type: String },
    birthDetails: {
      dateOfBirth: { type: String },
      timeOfBirth: { type: String },
      placeOfBirth: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      timezone: { type: Number },
    },
    content: { type: mongoose.Schema.Types.Mixed },
    pdfUrl: { type: String },
    pdfS3Key: { type: String },
    apiProvider: { type: String, default: "astrologyapi" },
  },
  { timestamps: true }
);

astrologyReportSchema.index({ user: 1, type: 1, createdAt: -1 });

export default mongoose.model("AstrologyReport", astrologyReportSchema);
