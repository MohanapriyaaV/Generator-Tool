// require("dotenv").config();
import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import quotationRoutes from "./routes/quotation_routes.js";
import proformaInvoiceRoutes from "./routes/proforma_invoice_routes.js";
import invoiceRoutes from "./routes/invoice_routes.js";
import uploadS3 from "./routes/uploadS3.js";
import purchaseOrderRoutes from "./routes/purchase_order_routes.js";

dotenv.config();
// ✅ Establish DB connection
connectDB(); 

const app = express();

// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/quotations", quotationRoutes);
app.use("/api/proforma-invoices", proformaInvoiceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/upload", uploadS3);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));