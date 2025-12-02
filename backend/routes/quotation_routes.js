import express from "express";
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  getNextQuotationNumber,
} from "../controllers/quotation_controller.js";

const router = express.Router();

router.get("/next-quotation-number", getNextQuotationNumber); // Get next quotation number
router.post("/", createQuotation);   // Save quotation
router.get("/", getQuotations);      // Fetch all quotations
router.get("/:id", getQuotationById); // Fetch single quotation
router.put("/:id", updateQuotation); // Update quotation

export default router;
