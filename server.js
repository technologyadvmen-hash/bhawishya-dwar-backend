import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

// Routes
import authRoutes from "./routes/auth.js";
import palmRoutes from "./routes/palm.js";
import aiRoutes from "./routes/ai.js";
import reportRoutes from "./routes/reports.js";
import astrologyRoutes from "./routes/astrology.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*splat", cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(globalLimiter);

// Health check
app.get("/", (req, res) => res.json({ success: true, message: "SAVITRAM Foundation – Bhawishya Dwar Backend Running", version: "1.0.0" }));
app.get("/api/health", (req, res) => res.json({ success: true, status: "healthy", timestamp: new Date() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/palm", palmRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/astrology", astrologyRoutes);
app.use("/api/admin", adminRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 SAVITRAM Foundation – Bhawishya Dwar Backend running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});

export default app;
