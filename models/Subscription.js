import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    interval: { type: String, enum: ["monthly", "yearly", "lifetime"], default: "monthly" },
    features: {
      scanLimit: { type: Number, default: 3 },
      chatLimit: { type: Number, default: 10 },
      pdfReports: { type: Boolean, default: false },
      astrologyAccess: { type: Boolean, default: false },
      detailedReports: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    status: { type: String, enum: ["active", "expired", "cancelled", "pending"], default: "active" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    scansUsed: { type: Number, default: 0 },
    chatsUsed: { type: Number, default: 0 },
    paymentId: { type: String },
    autoRenew: { type: Boolean, default: false },
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1 });

export const Plan = mongoose.model("Plan", planSchema);
export const Subscription = mongoose.model("Subscription", subscriptionSchema);
