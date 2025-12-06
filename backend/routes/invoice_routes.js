import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber,
} from "../controllers/invoice_controller.js";

const router = express.Router();

router.get("/next-invoice-number", getNextInvoiceNumber); // Get next invoice number
router.post("/", createInvoice);        // Save invoice
router.get("/", getInvoices);            // Fetch all invoices
router.get("/:id", getInvoiceById);      // Fetch single invoice
router.put("/:id", updateInvoice);       // Update invoice
router.delete("/:id", deleteInvoice);   // Delete invoice

export default router;

