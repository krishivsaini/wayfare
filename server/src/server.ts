import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/auth.js";
import tripsRouter from "./routes/trips.js";
import { errorHandler } from "./middleware/errorHandler.js";

export async function buildApp() {
  await connectDB();
  const app = express();

  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth", authRouter);
  app.use("/trips", tripsRouter);

  app.use(errorHandler);

  return app;
}
