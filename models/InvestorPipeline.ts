import mongoose, { Schema, type Document, type Model } from "mongoose";
import { DEFAULT_INVESTOR_STATUSES } from "./Investor";

export interface IInvestorPipeline extends Document {
  key: string;
  statuses: string[];
  waves: string[];
}

const PipelineSchema = new Schema<IInvestorPipeline>({
  key: { type: String, unique: true, default: "default" },
  statuses: { type: [String], default: [...DEFAULT_INVESTOR_STATUSES] },
  waves: { type: [String], default: ["First wave", "Second wave", "Impact"] },
}, { timestamps: true });

const InvestorPipeline: Model<IInvestorPipeline> = mongoose.models.InvestorPipeline ?? mongoose.model<IInvestorPipeline>("InvestorPipeline", PipelineSchema);
export default InvestorPipeline;
