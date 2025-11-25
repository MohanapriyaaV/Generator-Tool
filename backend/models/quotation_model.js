import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    quotationNo: { type: String, required: true },
    quotationDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    referenceNo: { type: String, unique: true, sparse: true },
    projectName: { type: String, default: "" },
    
    // From Address (Quotation From) - granular fields
    fromAddress: {
      companyName: { type: String, required: true },
      street: { type: String, default: "" },
      apartment: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      countryCode: { type: String, default: "" },
      stateCode: { type: String, default: "" },
      city: { type: String, default: "" },
      pan: { type: String, default: "" },
      gstin: { type: String, default: "" },
      // Keep address for backward compatibility
      address: { type: String, default: "" },
    },
    
    // To Address (Quotation For) - granular fields
    toAddress: {
      personName: { type: String, default: "" },
      companyName: { type: String, default: "" },
      street: { type: String, default: "" },
      apartment: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      countryCode: { type: String, default: "" },
      stateCode: { type: String, default: "" },
      city: { type: String, default: "" },
      // Keep address for backward compatibility
      address: { type: String, default: "" },
    },
    
    // Optional: S3 URL if PDF is uploaded
    s3Url: { type: String, default: "" },
    
    // Store full quotation data as JSON for future reference
    fullQuotationData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model("Quotation", quotationSchema);
