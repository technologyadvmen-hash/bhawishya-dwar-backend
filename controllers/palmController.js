import PalmScan from "../models/PalmScan.js";
import PalmFeature from "../models/PalmFeature.js";
import { uploadToS3 } from "../services/s3Service.js";
import { analyzePalmImage } from "../services/openaiService.js";
import { v4 as uuidv4 } from "uuid";

// POST /api/palm/upload
export const uploadPalm = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file provided" });
    const { handType } = req.body;
    if (!["left", "right"].includes(handType))
      return res.status(400).json({ success: false, message: "handType must be 'left' or 'right'" });

    let key, url;

    try {
      const s3Result = await uploadToS3(req.file.buffer, req.file.mimetype, "palm-images");
      key = s3Result.key;
      url = s3Result.url;
    } catch (s3Error) {
      // S3 unavailable — use placeholder so app keeps working
      console.warn("[S3 Warning] Upload failed, using placeholder:", s3Error.message);
      key = `palm-images/${uuidv4()}.jpg`;
      url = `local://${key}`;
    }

    const scan = await PalmScan.create({
      user: req.user._id,
      imageUrl: url,
      s3Key: key,
      handType,
      status: "pending",
    });

    res.status(201).json({ success: true, scan });
  } catch (error) {
    next(error);
  }
};

// POST /api/palm/analyze/:scanId
export const analyzePalm = async (req, res, next) => {
  try {
    const scan = await PalmScan.findOne({ _id: req.params.scanId, user: req.user._id });
    if (!scan) return res.status(404).json({ success: false, message: "Scan not found" });

    scan.status = "processing";
    await scan.save();

    // Real GPT-4o Vision analysis
    const analysis = await analyzePalmImage(scan.imageUrl, scan.handType, req.user._id);

    const features = await PalmFeature.create({
      scan: scan._id,
      user: req.user._id,
      lifeLine: analysis.lifeLine,
      heartLine: analysis.heartLine,
      headLine: analysis.headLine,
      fateLine: analysis.fateLine,
      sunLine: analysis.sunLine,
      mercuryLine: analysis.mercuryLine,
      palmShape: analysis.palmShape || 'unknown',
      mounts: analysis.mounts,
      fingerProportions: analysis.fingerProportions,
      overallConfidence: analysis.overallConfidence,
      rawAnalysis: analysis,
    });

    scan.status = "completed";
    scan.features = features._id;
    scan.imageQuality = analysis.imageQuality || analysis.overallConfidence;
    await scan.save();

    await req.user.constructor.findByIdAndUpdate(req.user._id, { $inc: { scanCount: 1 } });

    res.json({ success: true, scan, features });
  } catch (error) {
    if (req.params.scanId) {
      await PalmScan.findByIdAndUpdate(req.params.scanId, { status: "failed", errorMessage: error.message });
    }
    next(error);
  }
};

// GET /api/palm/history
export const getScanHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      PalmScan.find({ user: req.user._id })
        .populate("features", "overallConfidence palmShape")
        .populate("report", "title reportType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PalmScan.countDocuments({ user: req.user._id }),
    ]);

    res.json({ success: true, scans, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// GET /api/palm/:id
export const getScanById = async (req, res, next) => {
  try {
    const scan = await PalmScan.findOne({ _id: req.params.id, user: req.user._id })
      .populate("features")
      .populate("report");
    if (!scan) return res.status(404).json({ success: false, message: "Scan not found" });
    res.json({ success: true, scan });
  } catch (error) {
    next(error);
  }
};
