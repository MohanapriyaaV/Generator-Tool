import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    referenceNo: { type: String, default: "" },
    projectName: { type: String, default: "" },
    
    // From Address (Invoice From)
    fromAddress: {
      companyName: { type: String, required: true },
      address: { type: String, default: "" },
      gst: { type: String, default: "" },
    },
    
    // To Address (Customer/Shipping To)
    toAddress: {
      name: { type: String, default: "" },
      address: { type: String, default: "" },
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

export const Invoice = mongoose.model("Invoice", invoiceSchema);

