import express from "express";
import { protect } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { generateReading, chat, getUsage } from "../controllers/aiController.js";

const router = express.Router();

router.use(protect);
router.post("/palm-reading", aiLimiter, generateReading);
router.post("/chat", aiLimiter, chat);
router.get("/usage", getUsage);

export default router;
