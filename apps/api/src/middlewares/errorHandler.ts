import { type Request, type Response, type NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/** Structured application error. Carries an HTTP status and a machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
    // Restore correct prototype chain when transpiling to ES5 / CJS
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/** Express 4-argument error handler — must be registered last. */
export function errorHandler(
  err:   unknown,
  _req:  Request,
  res:   Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error:   { message: err.message, code: err.code },
    });
    return;
  }

  // Unexpected error — log at error level and return a generic 500
  logger.error(err, "Unhandled error");

  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      code:    "INTERNAL_ERROR",
      // Only expose internals outside production
      ...(env.NODE_ENV !== "production" && {
        details: err instanceof Error ? err.message : String(err),
      }),
    },
  });
}
