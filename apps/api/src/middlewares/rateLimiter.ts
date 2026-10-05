import rateLimit from "express-rate-limit";

const rateLimitResponse = (message: string) => ({
  success: false,
  error:   { message, code: "RATE_LIMIT_EXCEEDED" },
});

/** Applied globally — 100 req / 15 min per IP. */
export const globalLimiter = rateLimit({
  windowMs:       15 * 60 * 1_000,
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        rateLimitResponse("Too many requests, please try again later."),
});

/** Applied to mutation endpoints — 10 req / 1 min per IP. */
export const strictLimiter = rateLimit({
  windowMs:       60 * 1_000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        rateLimitResponse("Too many requests on this endpoint."),
});
