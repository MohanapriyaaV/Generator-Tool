import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    quotationNo: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    s3Url: { type: String, required: true },
    quotationFrom: { type: String, required: true },
    quotationFor: { type: String, required: true },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model("Quotation", quotationSchema);
