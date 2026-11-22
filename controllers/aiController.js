import PalmFeature from "../models/PalmFeature.js";
import PalmReport from "../models/PalmReport.js";
import PalmScan from "../models/PalmScan.js";
import { ChatSession, ChatMessage } from "../models/Chat.js";
import ApiUsage from "../models/ApiUsage.js";
import { generatePalmReading, chatWithAI } from "../services/openaiService.js";

// POST /api/ai/palm-reading
export const generateReading = async (req, res, next) => {
  try {
    const { scanId, reportType = "general", language } = req.body;
    const lang = language || req.user.language || "en";

    const scan = await PalmScan.findOne({ _id: scanId, user: req.user._id });
    if (!scan) return res.status(404).json({ success: false, message: "Scan not found" });

    const features = await PalmFeature.findOne({ scan: scanId });
    if (!features) return res.status(400).json({ success: false, message: "Palm features not analyzed yet" });

    const { content, tokensUsed, model } = await generatePalmReading(features, reportType, lang, req.user._id);

    const report = await PalmReport.create({
      scan: scan._id,
      user: req.user._id,
      features: features._id,
      language: lang,
      reportType,
      ...content,
      tokensUsed,
      model,
    });

    scan.report = report._id;
    await scan.save();

    res.status(201).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/chat
export const chat = async (req, res, next) => {
  try {
    const { message, sessionId, language } = req.body;
    const lang = language || req.user.language || "en";

    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
    }
    if (!session) {
      session = await ChatSession.create({ user: req.user._id, language: lang });
    }

    // Save user message
    await ChatMessage.create({ session: session._id, user: req.user._id, role: "user", content: message });

    // Get last 10 messages for context
    const history = await ChatMessage.find({ session: session._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const messages = history.reverse().map((m) => ({ role: m.role, content: m.content }));

    const { content: reply, tokensUsed } = await chatWithAI(messages, null, lang, req.user._id);

    const assistantMsg = await ChatMessage.create({
      session: session._id,
      user: req.user._id,
      role: "assistant",
      content: reply,
      tokensUsed,
    });

    session.totalTokens += tokensUsed;
    session.messageCount += 2;
    await session.save();

    res.json({ success: true, reply, sessionId: session._id, message: assistantMsg });
  } catch (error) {
    next(error);
  }
};

// GET /api/ai/usage
export const getUsage = async (req, res, next) => {
  try {
    const usage = await ApiUsage.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$service", totalTokens: { $sum: "$tokensUsed" }, count: { $sum: 1 } } },
    ]);
    res.json({ success: true, usage });
  } catch (error) {
    next(error);
  }
};
