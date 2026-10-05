import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV:             z.enum(["development", "production", "test"]).default("development"),
  PORT:                 z.coerce.number().int().positive().default(3000),

  // Google Calendar service account
  GOOGLE_CLIENT_EMAIL:  z.string().email().optional(),
  GOOGLE_PRIVATE_KEY:   z.string().optional(),
  GOOGLE_CALENDAR_ID:   z.string().optional(),

  // Instructor base coordinate (default: Toronto Downtown)
  BASE_LAT:             z.coerce.number().default(43.6532),
  BASE_LNG:             z.coerce.number().default(-79.3832),

  // Working hours (24-hour, local Toronto time)
  WORK_START_HOUR:      z.coerce.number().int().min(0).max(23).default(9),
  WORK_END_HOUR:        z.coerce.number().int().min(0).max(23).default(18),

  // CORS
  CORS_ORIGIN:          z.string().default("*"),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌  Invalid environment variables:\n", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env: Env = parsed.data;
