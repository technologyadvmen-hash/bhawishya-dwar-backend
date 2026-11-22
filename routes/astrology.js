import express from "express";
import { protect } from "../middleware/auth.js";
import { getHoroscope, getBirthChartReport, getNumerologyReport, getCompatibilityReport, getHistory } from "../controllers/astrologyController.js";

const router = express.Router();

router.use(protect);
router.post("/horoscope", getHoroscope);
router.post("/birth-chart", getBirthChartReport);
router.post("/numerology", getNumerologyReport);
router.post("/compatibility", getCompatibilityReport);
router.get("/history", getHistory);

export default router;
