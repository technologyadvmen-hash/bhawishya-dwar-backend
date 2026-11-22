import PalmReport from "../models/PalmReport.js";
import AstrologyReport from "../models/AstrologyReport.js";
import { deleteFromS3 } from "../services/s3Service.js";

// GET /api/reports
export const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { type } = req.query; // 'palm' or 'astrology'

    let palmReports = [], astrologyReports = [], total = 0;

    if (!type || type === "palm") {
      palmReports = await PalmReport.find({ user: req.user._id })
        .populate("scan", "handType imageUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      palmReports = palmReports.map((r) => ({ ...r, reportCategory: "palm" }));
    }

    if (!type || type === "astrology") {
      astrologyReports = await AstrologyReport.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      astrologyReports = astrologyReports.map((r) => ({ ...r, reportCategory: "astrology" }));
    }

    const reports = [...palmReports, ...astrologyReports].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ success: true, reports, pagination: { page, limit } });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/:id
export const getReportById = async (req, res, next) => {
  try {
    let report = await PalmReport.findOne({ _id: req.params.id, user: req.user._id }).populate("scan features");
    if (!report) {
      report = await AstrologyReport.findOne({ _id: req.params.id, user: req.user._id });
    }
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reports/:id
export const deleteReport = async (req, res, next) => {
  try {
    const report = await PalmReport.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    if (report.pdfS3Key) await deleteFromS3(report.pdfS3Key);
    await report.deleteOne();

    res.json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    next(error);
  }
};
