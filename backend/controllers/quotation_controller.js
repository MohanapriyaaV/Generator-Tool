import { Quotation } from "../models/quotation_model.js";

// Save a new quotation
export const createQuotation = async (req, res) => {
  try {
    const quotation = new Quotation(req.body);
    await quotation.save();
    res.status(201).json({ message: "Quotation saved successfully", quotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch all quotations
export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch one quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ message: "Quotation not found" });
    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
