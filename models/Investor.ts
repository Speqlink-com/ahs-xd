import mongoose, { Schema, type Document, type Model } from "mongoose";

export const DEFAULT_INVESTOR_STATUSES = [
  "Not contacted", "Researching", "Contacted", "Meeting scheduled", "Follow-up required",
] as const;

export interface IInvestorEvent {
  kind: "created" | "status" | "call" | "correspondence" | "meeting" | "follow-up" | "note" | "opportunity";
  at: Date;
  actor: mongoose.Types.ObjectId;
  actorName: string;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  outcome?: string;
  scheduledFor?: Date;
  meetingStage?: "scheduled" | "completed";
}

export interface IInvestor extends Document {
  name: string;
  organization: string;
  wave: string;
  status: string;
  priority: "Low" | "Medium" | "High";
  manager: mongoose.Types.ObjectId | null;
  contactEmail: string;
  contactPhone: string;
  investmentFocus: string;
  notes: string;
  nextAction: string;
  nextFollowUp: Date | null;
  lastContacted: Date | null;
  lastUpdatedBy: mongoose.Types.ObjectId;
  lastUpdatedByName: string;
  events: IInvestorEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IInvestorEvent>({
  kind: { type: String, enum: ["created", "status", "call", "correspondence", "meeting", "follow-up", "note", "opportunity"], required: true },
  at: { type: Date, required: true },
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  actorName: { type: String, required: true },
  previousStatus: String,
  newStatus: String,
  remarks: String,
  outcome: String,
  scheduledFor: Date,
  meetingStage: { type: String, enum: ["scheduled", "completed"] },
}, { _id: true });

const InvestorSchema = new Schema<IInvestor>({
  name: { type: String, required: true, trim: true },
  organization: { type: String, default: "", trim: true },
  wave: { type: String, required: true, trim: true },
  status: { type: String, required: true, trim: true, default: DEFAULT_INVESTOR_STATUSES[0] },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  manager: { type: Schema.Types.ObjectId, ref: "User", default: null },
  contactEmail: { type: String, default: "", trim: true },
  contactPhone: { type: String, default: "", trim: true },
  investmentFocus: { type: String, default: "", trim: true },
  notes: { type: String, default: "", trim: true },
  nextAction: { type: String, default: "", trim: true },
  nextFollowUp: { type: Date, default: null },
  lastContacted: { type: Date, default: null },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lastUpdatedByName: { type: String, required: true },
  events: { type: [EventSchema], default: [] },
}, { timestamps: true });

InvestorSchema.index({ name: 1 });
InvestorSchema.index({ status: 1, wave: 1, priority: 1 });
InvestorSchema.index({ manager: 1, updatedAt: -1 });
InvestorSchema.index({ nextFollowUp: 1 });

const Investor: Model<IInvestor> = mongoose.models.Investor ?? mongoose.model<IInvestor>("Investor", InvestorSchema);
export default Investor;
