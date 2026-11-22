import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { getDashboard, getUsers, getScans, getReports, getApiUsage, updateSettings } from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("admin", "superadmin"));
router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/scans", getScans);
router.get("/reports", getReports);
router.get("/api-usage", getApiUsage);
router.put("/settings", authorize("superadmin"), updateSettings);

export default router;
