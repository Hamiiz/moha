import { type Request, type Response, type NextFunction } from "express";
import { env } from "../config/env.js";

/**
 * Verifies that incoming request carries a valid Bearer token matching INSTRUCTOR_PIN or JWT token.
 * Rejects unauthorized requests with 401 Unauthorized.
 */
export function requireInstructorAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { message: "Instructor authentication token required", code: "UNAUTHORIZED" },
    });
    return;
  }

  const token = authHeader.split(" ")[1]?.trim();
  const validToken = `token-${env.INSTRUCTOR_PIN}`;

  if (token !== env.INSTRUCTOR_PIN && token !== validToken) {
    res.status(401).json({
      success: false,
      error: { message: "Invalid or expired instructor token", code: "UNAUTHORIZED" },
    });
    return;
  }

  next();
}
