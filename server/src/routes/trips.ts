import { Router, Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import {
  CreateTripInputSchema,
  RegenerateDayInputSchema,
  AddActivityInputSchema,
} from "../shared/schemas.js";
import { Trip } from "../models/Trip.js";
import { generateTrip } from "../agent/generateTrip.js";
import { regenerateDay } from "../agent/regenerateDay.js";
import { suggestHotels } from "../agent/suggestHotels.js";
import { buildTripPdf } from "../services/pdfExport.js";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthedRequest;
    const trips = await Trip.find({ userId: user.id }).sort({ createdAt: -1 });
    res.json({ data: trips });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requireAuth,
  validate(CreateTripInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthedRequest;
      const input = req.body;

      const generated = await generateTrip(input);

      const trip = await Trip.create({
        userId: user.id,
        destination: input.destination,
        numDays: input.numDays,
        budgetTier: input.budgetTier,
        interests: input.interests,
        itinerary: { days: generated.days },
        budget: generated.budget,
        hotels: generated.hotels,
        version: 1,
        history: [{ version: 1, changeType: "create", timestamp: new Date() }],
      });

      res.status(201).json({ data: trip });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", requireAuth, validateObjectId("id"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthedRequest;
    const trip = await Trip.findOne({ _id: req.params.id, userId: user.id });
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json({ data: trip });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:id/export",
  requireAuth,
  validateObjectId("id"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthedRequest;
      const trip = await Trip.findOne({ _id: req.params.id, userId: user.id });
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      // <destination>-<numDays>day-itinerary.pdf — lowercased, spaces→hyphens, non-ASCII stripped
      const safeName = `${trip.destination}-${trip.numDays}day-itinerary`
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\x00-\x7F]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/-+/g, "-");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);

      const doc = buildTripPdf(trip);
      doc.pipe(res);
      doc.end();
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", requireAuth, validateObjectId("id"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user } = req as AuthedRequest;
    const result = await Trip.findOneAndDelete({ _id: req.params.id, userId: user.id });
    if (!result) return res.status(404).json({ error: "Trip not found" });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/days/:dayNumber/regenerate",
  requireAuth,
  validateObjectId("id"),
  validate(RegenerateDayInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthedRequest;
      const tripId = req.params.id;
      const dayNumber = Number(req.params.dayNumber);

      const trip = await Trip.findOne({ _id: tripId, userId: user.id });
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const dayIndex = trip.itinerary.days.findIndex(d => d.dayNumber === dayNumber);
      if (dayIndex === -1) return res.status(400).json({ error: "Invalid day number" });

      const regen = await regenerateDay({
        destination: trip.destination,
        budgetTier: trip.budgetTier,
        interests: trip.interests,
        numDays: trip.numDays,
        dayNumber,
        currentDays: trip.itinerary.days,
        budget: trip.budget,
        userInstruction: req.body.userInstruction,
      });

      trip.itinerary.days[dayIndex].activities = regen.activities;
      trip.version += 1;
      trip.history.push({
        version: trip.version,
        changeType: "regen-day",
        meta: { dayNumber, withinBudget: regen.budgetCheck.withinBudget },
        timestamp: new Date(),
      });
      await trip.save();

      // Keep the { data: T } envelope the client's request() helper unwraps,
      // and map budgetCheck to the client BudgetCheck shape { remaining, usedByDay, ok }.
      res.json({
        data: {
          trip,
          budgetCheck: {
            usedByDay: regen.budgetCheck.regeneratedCostUsd,
            remaining: regen.budgetCheck.remainingBudgetUsd - regen.budgetCheck.regeneratedCostUsd,
            ok: regen.budgetCheck.withinBudget,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id/days/:dayNumber/activities/:activityId",
  requireAuth,
  validateObjectId("id"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthedRequest;
      const dayNumber = Number(req.params.dayNumber);
      const { activityId } = req.params;

      const trip = await Trip.findOne({ _id: req.params.id, userId: user.id });
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const day = trip.itinerary.days.find(d => d.dayNumber === dayNumber);
      if (!day) return res.status(400).json({ error: "Invalid day number" });

      const before = day.activities.length;
      day.activities = day.activities.filter(a => a.id !== activityId);
      if (day.activities.length === before) {
        return res.status(404).json({ error: "Activity not found" });
      }

      trip.version += 1;
      trip.history.push({
        version: trip.version,
        changeType: "edit-activity-delete",
        meta: { dayNumber, activityId },
        timestamp: new Date(),
      });
      await trip.save();

      res.json({ data: trip });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/days/:dayNumber/activities",
  requireAuth,
  validateObjectId("id"),
  validate(AddActivityInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthedRequest;
      const dayNumber = Number(req.params.dayNumber);

      if (req.body.dayNumber !== dayNumber) {
        return res.status(400).json({ error: "Day number mismatch between URL and body" });
      }

      const trip = await Trip.findOne({ _id: req.params.id, userId: user.id });
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const day = trip.itinerary.days.find(d => d.dayNumber === dayNumber);
      if (!day) return res.status(400).json({ error: "Invalid day number" });

      const activity = { ...req.body.activity, id: nanoid(10) };
      day.activities.push(activity);

      trip.version += 1;
      trip.history.push({
        version: trip.version,
        changeType: "edit-activity-add",
        meta: { dayNumber, activityId: activity.id },
        timestamp: new Date(),
      });
      await trip.save();

      res.status(201).json({ data: trip });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/hotels/refresh",
  requireAuth,
  validateObjectId("id"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthedRequest;
      const trip = await Trip.findOne({ _id: req.params.id, userId: user.id });
      if (!trip) return res.status(404).json({ error: "Trip not found" });

      const hotels = await suggestHotels(trip.destination, trip.budgetTier);
      trip.hotels = hotels;
      await trip.save();

      res.json({ data: trip });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
