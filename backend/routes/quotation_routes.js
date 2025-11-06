import express from "express";
import {
  createQuotation,
  getQuotations,
  getQuotationById,
} from "../controllers/quotation_controller.js";

const router = express.Router();

router.post("/", createQuotation);   // Save quotation
router.get("/", getQuotations);      // Fetch all quotations
router.get("/:id", getQuotationById); // Fetch single quotation

export default router;
