import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Chat" },
    type: { type: String, enum: ["palmistry", "astrology", "general"], default: "general" },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    relatedScan: { type: mongoose.Schema.Types.ObjectId, ref: "PalmScan" },
    relatedReport: { type: mongoose.Schema.Types.ObjectId, ref: "PalmReport" },
    isActive: { type: Boolean, default: true },
    totalTokens: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const chatMessageSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: "ChatSession", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ session: 1, createdAt: 1 });

export const ChatSession = mongoose.model("ChatSession", chatSessionSchema);
export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
