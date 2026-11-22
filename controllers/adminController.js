import User from "../models/User.js";
import PalmScan from "../models/PalmScan.js";
import PalmReport from "../models/PalmReport.js";
import ApiUsage from "../models/ApiUsage.js";

// GET /api/admin/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalScans, totalReports, apiUsage] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      PalmScan.countDocuments(),
      PalmReport.countDocuments(),
      ApiUsage.aggregate([
        { $group: { _id: "$service", totalTokens: { $sum: "$tokensUsed" }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ success: true, stats: { totalUsers, activeUsers, totalScans, totalReports, apiUsage } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;

    const query = search ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);

    res.json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/scans
export const getScans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const scans = await PalmScan.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await PalmScan.countDocuments();
    res.json({ success: true, scans, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/reports
export const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const reports = await PalmReport.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await PalmReport.countDocuments();
    res.json({ success: true, reports, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/api-usage
export const getApiUsage = async (req, res, next) => {
  try {
    const usage = await ApiUsage.find().populate("user", "name email").sort({ createdAt: -1 }).limit(100);
    const summary = await ApiUsage.aggregate([
      { $group: { _id: "$service", totalTokens: { $sum: "$tokensUsed" }, count: { $sum: 1 }, errors: { $sum: { $cond: ["$success", 0, 1] } } } },
    ]);
    res.json({ success: true, usage, summary });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/settings
export const updateSettings = async (req, res, next) => {
  try {
    // Settings stored in DB — placeholder for SystemSettings model
    res.json({ success: true, message: "Settings updated", settings: req.body });
  } catch (error) {
    next(error);
  }
};
