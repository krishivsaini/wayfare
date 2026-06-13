import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash"),
  CLIENT_ORIGIN: z.string().url(),
  COOKIE_DOMAIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
