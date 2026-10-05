import { type Request, type Response, type NextFunction } from "express";
import { type ZodSchema } from "zod";

/**
 * Validates `req.body` against the provided Zod schema.
 * Replaces req.body with the parsed (coerced) output on success.
 * Returns 400 with flattened Zod errors on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Request body validation failed",
          code:    "VALIDATION_ERROR",
          details: result.error.flatten(),
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates `req.query` against the provided Zod schema.
 * Attaches the parsed result to `res.locals.validatedQuery` on success.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: "Query string validation failed",
          code:    "VALIDATION_ERROR",
          details: result.error.flatten(),
        },
      });
      return;
    }
    // Store on res.locals to avoid augmenting the global Request type
    res.locals["validatedQuery"] = result.data;
    next();
  };
}
