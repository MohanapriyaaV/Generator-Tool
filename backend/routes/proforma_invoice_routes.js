import express from "express";
import {
  createProformaInvoice,
  getProformaInvoices,
  getProformaInvoiceById,
  updateProformaInvoice,
  deleteProformaInvoice,
  getProformaInvoiceByReferenceNo,
  getNextProformaInvoiceNumber,
} from "../controllers/proforma_invoice_controller.js";

const router = express.Router();

router.get("/next-invoice-number", getNextProformaInvoiceNumber); // Get next proforma invoice number
router.post("/", createProformaInvoice);        // Save proforma invoice
router.get("/", getProformaInvoices);            // Fetch all proforma invoices
router.get("/by-reference/:referenceNo", getProformaInvoiceByReferenceNo); // Fetch by reference number
router.get("/:id", getProformaInvoiceById);      // Fetch single proforma invoice
router.put("/:id", updateProformaInvoice);       // Update proforma invoice
router.delete("/:id", deleteProformaInvoice);   // Delete proforma invoice

export default router;

