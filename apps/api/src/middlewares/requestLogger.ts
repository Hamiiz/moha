import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * Structured HTTP request/response logger.
 * Logs method, url, status code, and response time for every request.
 * Health-check requests (/healthz) are silently dropped to reduce log noise.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  const { method, url } = req;

  res.on("finish", () => {
    // Suppress health-check polling from logs
    if (url === "/healthz") return;

    const ms      = Number(process.hrtime.bigint() - start) / 1e6; // ns → ms
    const { statusCode } = res;
    const entry   = { method, url, statusCode, ms: Math.round(ms * 10) / 10 };

    if (statusCode >= 500)      logger.error(entry, "http");
    else if (statusCode >= 400) logger.warn(entry,  "http");
    else                        logger.info(entry,  "http");
  });

  next();
}

