import express from "express";
import { protect } from "../middleware/auth.js";
import { getReports, getReportById, deleteReport, downloadReport } from "../controllers/reportController.js";

const router = express.Router();

router.use(protect);
router.get("/", getReports);
router.get("/:id/download", downloadReport);
router.get("/:id", getReportById);
router.delete("/:id", deleteReport);

export default router;
