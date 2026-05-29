import { Router, Request, Response, NextFunction, CookieOptions } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { SignupInputSchema, LoginInputSchema } from "../shared/schemas";
import { validate } from "../middleware/validate";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

const router = Router();

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};

function signToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

router.post("/signup", validate(SignupInputSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = signToken({ id: user.id, email: user.email });

    res.cookie("token", token, cookieOptions);
    res.status(201).json({ data: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/login", validate(LoginInputSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: user.id, email: user.email });
    res.cookie("token", token, cookieOptions);
    res.json({ data: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, (_req: Request, res: Response) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ data: { ok: true } });
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  const { user } = req as AuthedRequest;
  res.json({ data: { id: user.id, email: user.email } });
});

export default router;
