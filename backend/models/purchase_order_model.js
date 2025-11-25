import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true },
    poDate: { type: Date, required: true },
    referenceNumber: { type: String, default: "" },
    projectName: { type: String, default: "" },

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

    // Ship To Address
    shipToAddress: {
      clientName: { type: String, default: "" },
      companyName: { type: String, default: "" },
      street: { type: String, default: "" },
      apartment: { type: String, default: "" },
      city: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      phoneNumber: { type: String, default: "" },
    },

    // Total Amount
    totalAmount: { type: Number, required: true },

    s3Url: { type: String, default: "" },

    // Store full PO data
    fullPurchaseOrderData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
