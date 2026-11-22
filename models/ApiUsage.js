import mongoose from "mongoose";

const apiUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service: { type: String, enum: ["openai", "astrology", "s3", "google_places"], required: true },
    endpoint: { type: String },
    tokensUsed: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

apiUsageSchema.index({ service: 1, createdAt: -1 });
apiUsageSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("ApiUsage", apiUsageSchema);
