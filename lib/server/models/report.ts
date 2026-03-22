import {
  model,
  models,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

const reportSchema = new Schema(
  {
    userId: { type: String, index: true },
    runId: { type: String, required: true, index: true },
    vendor: { type: String, required: true },
    score: { type: Number, required: true },
    risks: { type: [String], default: [] },
    fixes: { type: [String], default: [] },
    steps: { type: [Schema.Types.Mixed], default: [] },
    summary: { type: String, default: "" },
    details: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

export type ReportDocument = InferSchemaType<typeof reportSchema>;

export const Report: Model<ReportDocument> =
  (models.Report as Model<ReportDocument>) ||
  model<ReportDocument>("Report", reportSchema);

