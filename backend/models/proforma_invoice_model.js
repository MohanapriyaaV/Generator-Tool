import mongoose from "mongoose";

const proformaInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    referenceNo: { type: String, default: "" },
    projectName: { type: String, default: "" },
    
    // From Address (Invoice From)
    fromAddress: {
      companyName: { type: String, required: true },
      street: { type: String, default: "" },
      apartment: { type: String, default: "" },
      city: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      pan: { type: String, default: "" },
      gstin: { type: String, default: "" },
    },
    
    // Bill To Address
    billToAddress: {
      clientName: { type: String, default: "" },
      companyName: { type: String, default: "" },
      street: { type: String, default: "" },
      apartment: { type: String, default: "" },
      city: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      pan: { type: String, default: "" },
      gstin: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
    },
    
    // Total Amount
    totalAmount: { type: Number, required: true },
    
    // Optional: S3 URL if PDF is uploaded
    s3Url: { type: String, default: "" },
    
    // Store full invoice data as JSON for future reference
    fullInvoiceData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const ProformaInvoice = mongoose.model("ProformaInvoice", proformaInvoiceSchema);

