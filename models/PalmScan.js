import mongoose from "mongoose";

const palmScanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    s3Key: { type: String, required: true },
    handType: { type: String, enum: ["left", "right"], required: true },
    status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
    features: { type: mongoose.Schema.Types.ObjectId, ref: "PalmFeature" },
    report: { type: mongoose.Schema.Types.ObjectId, ref: "PalmReport" },
    imageQuality: { type: Number, min: 0, max: 100 },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

palmScanSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("PalmScan", palmScanSchema);
