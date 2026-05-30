import mongoose, { Schema, Document, Types } from "mongoose";

export type BudgetTier = "low" | "medium" | "high";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface IActivity {
  id: string;
  title: string;
  description: string;
  timeOfDay: TimeOfDay;
  estCostUsd: number;
  reasoning: string;
  confidence: number;
}

export interface IDay {
  dayNumber: number;
  activities: IActivity[];
}

export interface IBudget {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  total: number;
  currency: "USD";
}

export interface IHotel {
  name: string;
  tier: "budget" | "mid" | "luxury";
  reasoning: string;
}

export interface IHistoryEntry {
  version: number;
  changeType: "create" | "edit-activity-delete" | "edit-activity-add" | "regen-day";
  meta?: Record<string, unknown>;
  timestamp: Date;
}

export interface ITrip extends Document {
  userId: Types.ObjectId;
  destination: string;
  numDays: number;
  budgetTier: BudgetTier;
  interests: string[];
  itinerary: { days: IDay[] };
  budget: IBudget;
  hotels: IHotel[];
  version: number;
  history: IHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  timeOfDay: { type: String, enum: ["morning", "afternoon", "evening"], required: true },
  estCostUsd: { type: Number, required: true, min: 0 },
  reasoning: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
}, { _id: false });

const DaySchema = new Schema<IDay>({
  dayNumber: { type: Number, required: true, min: 1 },
  activities: { type: [ActivitySchema], default: [] },
}, { _id: false });

const BudgetSchema = new Schema<IBudget>({
  flights: { type: Number, required: true },
  accommodation: { type: Number, required: true },
  food: { type: Number, required: true },
  activities: { type: Number, required: true },
  total: { type: Number, required: true },
  currency: { type: String, default: "USD" },
}, { _id: false });

const HotelSchema = new Schema<IHotel>({
  name: { type: String, required: true },
  tier: { type: String, enum: ["budget", "mid", "luxury"], required: true },
  reasoning: { type: String, required: true },
}, { _id: false });

const HistoryEntrySchema = new Schema<IHistoryEntry>({
  version: { type: Number, required: true },
  changeType: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const TripSchema = new Schema<ITrip>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  destination: { type: String, required: true, trim: true },
  numDays: { type: Number, required: true, min: 1, max: 30 },
  budgetTier: { type: String, enum: ["low", "medium", "high"], required: true },
  interests: { type: [String], default: [] },
  itinerary: {
    days: { type: [DaySchema], default: [] },
  },
  budget: { type: BudgetSchema, required: true },
  hotels: { type: [HotelSchema], default: [] },
  version: { type: Number, default: 1 },
  history: { type: [HistoryEntrySchema], default: [] },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

TripSchema.index({ userId: 1, createdAt: -1 });

export const Trip = mongoose.model<ITrip>("Trip", TripSchema);
