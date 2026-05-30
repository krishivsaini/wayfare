import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/**
 * Returns 404 (not 400) for invalid ObjectIds — same response as
 * "valid id but not yours", so we don't leak ID-format info.
 */
export function validateObjectId(paramName: string = "id") {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!mongoose.isValidObjectId(value)) {
      return res.status(404).json({ error: "Trip not found" });
    }
    next();
  };
}
