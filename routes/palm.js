import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.js";
import { uploadPalm, analyzePalm, getScanHistory, getScanById } from "../controllers/palmController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

const router = express.Router();

router.use(protect);
router.post("/upload", upload.single("palm"), uploadPalm);
router.post("/analyze/:scanId", analyzePalm);
router.get("/history", getScanHistory);
router.get("/:id", getScanById);

export default router;
