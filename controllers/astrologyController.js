import AstrologyReport from "../models/AstrologyReport.js";
import { getBirthChart, getNumerology, getHoroscopeData, getCompatibility } from "../services/astrologyService.js";
import { generateHoroscopeReading } from "../services/openaiService.js";

// POST /api/astrology/horoscope
export const getHoroscope = async (req, res, next) => {
  try {
    const { zodiacSign, period = "daily", day, month, year, hour, min, lat, lon, tzone } = req.body;
    if (!zodiacSign) return res.status(400).json({ success: false, message: "zodiacSign is required" });

    const birthDetails = day && lat ? { day: +day, month: +month, year: +year, hour: +(hour || 0), min: +(min || 0), lat: +lat, lon: +lon, tzone: +(tzone || 5.5) } : null;

    // Get real planetary data if birth details provided
    const horoscopeData = await getHoroscopeData(zodiacSign.toLowerCase(), birthDetails, req.user._id);

    // Generate AI reading using real data
    const reading = await generateHoroscopeReading(
      { ...horoscopeData, period },
      req.user.language || "en",
      req.user._id
    );

    const report = await AstrologyReport.create({
      user: req.user._id,
      type: period,
      zodiacSign,
      language: req.user.language || "en",
      content: { ...reading.content, rawData: horoscopeData },
    });

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// POST /api/astrology/birth-chart
export const getBirthChartReport = async (req, res, next) => {
  try {
    const { day, month, year, hour, min, lat, lon, tzone } = req.body;
    if (!day || !month || !year || !lat || !lon)
      return res.status(400).json({ success: false, message: "day, month, year, lat, lon are required" });

    const birthDetails = { day: +day, month: +month, year: +year, hour: +(hour || 0), min: +(min || 0), lat: +lat, lon: +lon, tzone: +(tzone || 5.5) };

    const data = await getBirthChart(birthDetails, req.user._id);

    const report = await AstrologyReport.create({
      user: req.user._id,
      type: "birth_chart",
      language: req.user.language || "en",
      birthDetails: { dateOfBirth: `${day}/${month}/${year}`, latitude: lat, longitude: lon, timezone: tzone || 5.5 },
      content: data,
    });

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// POST /api/astrology/numerology
export const getNumerologyReport = async (req, res, next) => {
  try {
    const { day, month, year, name } = req.body;
    if (!day || !month || !year || !name)
      return res.status(400).json({ success: false, message: "day, month, year, name are required" });

    const data = await getNumerology({ day: +day, month: +month, year: +year, name }, req.user._id);

    const report = await AstrologyReport.create({
      user: req.user._id,
      type: "planetary",
      language: req.user.language || "en",
      content: data,
    });

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// POST /api/astrology/compatibility
export const getCompatibilityReport = async (req, res, next) => {
  try {
    const data = await getCompatibility(req.body, req.user._id);
    const report = await AstrologyReport.create({
      user: req.user._id,
      type: "compatibility",
      language: req.user.language || "en",
      content: data,
    });
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// GET /api/astrology/history
export const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const reports = await AstrologyReport.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await AstrologyReport.countDocuments({ user: req.user._id });
    res.json({ success: true, reports, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
};
