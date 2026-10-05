import express, { type Request, type Response } from "express";
import helmet      from "helmet";
import cors        from "cors";
import compression from "compression";
import { env }            from "./config/env.js";
import { globalLimiter }  from "./middlewares/rateLimiter.js";
import { requestLogger }  from "./middlewares/requestLogger.js";
import { errorHandler }   from "./middlewares/errorHandler.js";
import { geocodeCache, calendarCache } from "./utils/cache.js";
import apiRouter          from "./routes/index.js";

const app: express.Application = express();

// Trust reverse proxy (Fly.io) for express-rate-limit & X-Forwarded-For IP resolution
app.set("trust proxy", 1);



// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// ── Performance ───────────────────────────────────────────────────────────────
app.use(compression() as express.RequestHandler);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Structured request logging ─────────────────────────────────────────────────
app.use(requestLogger);

// ── Body parsing (16 KB cap prevents oversized payload attacks) ────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/healthz", (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const toMb = (bytes: number) => Math.round(bytes / 1_048_576 * 100) / 100;

  res.json({
    status:    "ok",
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMb:  toMb(mem.heapUsed),
      heapTotalMb: toMb(mem.heapTotal),
      rssMb:       toMb(mem.rss),
    },
    cache: {
      geocodeEntries:  geocodeCache.keys().length,
      calendarEntries: calendarCache.keys().length,
    },
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/v1", apiRouter);

// ── 404 fallthrough ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: "Route not found", code: "NOT_FOUND" },
  });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

export default app;
