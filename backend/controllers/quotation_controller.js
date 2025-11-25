import { Quotation } from "../models/quotation_model.js";

// Save a new quotation
export const createQuotation = async (req, res) => {
  try {
    const {
      quotationNo,
      quotationDate,
      totalAmount,
      referenceNo,
      projectName,
      fromAddress,
      toAddress,
      s3Url,
      fullQuotationData,
    } = req.body;

    // Validate required fields
    if (!quotationNo || !quotationDate || !totalAmount) {
      return res.status(400).json({ 
        error: "Missing required fields: quotationNo, quotationDate, and totalAmount are required" 
      });
    }

    if (!fromAddress || !fromAddress.companyName) {
      return res.status(400).json({ 
        error: "From address with company name is required" 
      });
    }

    // Check if referenceNo already exists (if provided)
    if (referenceNo) {
      const existingQuotation = await Quotation.findOne({ referenceNo });
      if (existingQuotation) {
        return res.status(400).json({ 
          error: `Reference number ${referenceNo} already exists. Please use a different reference number.` 
        });
      }
    }

    const quotation = new Quotation({
      quotationNo,
      quotationDate,
      totalAmount,
      referenceNo: referenceNo || "",
      projectName: projectName || "",
      fromAddress: {
        companyName: fromAddress.companyName || "",
        street: fromAddress.street || "",
        apartment: fromAddress.apartment || "",
        zipCode: fromAddress.zipCode || "",
        countryCode: fromAddress.countryCode || "",
        stateCode: fromAddress.stateCode || "",
        city: fromAddress.city || "",
        pan: fromAddress.pan || "",
        gstin: fromAddress.gstin || "",
        // Keep address for backward compatibility
        address: fromAddress.address || "",
      },
      toAddress: toAddress ? {
        personName: toAddress.personName || "",
        companyName: toAddress.companyName || "",
        street: toAddress.street || "",
        apartment: toAddress.apartment || "",
        zipCode: toAddress.zipCode || "",
        countryCode: toAddress.countryCode || "",
        stateCode: toAddress.stateCode || "",
        city: toAddress.city || "",
        // Keep address for backward compatibility
        address: toAddress.address || "",
      } : {},
      s3Url: s3Url || "",
      fullQuotationData: fullQuotationData || {},
    });

    await quotation.save();
    res.status(201).json({ message: "Quotation saved successfully", quotation });
  } catch (err) {
    console.error("Error creating quotation:", err);
    // Handle duplicate key error for referenceNo
    if (err.code === 11000 && err.keyPattern?.referenceNo) {
      return res.status(400).json({ 
        error: `Reference number already exists. Please use a different reference number.` 
      });
    }
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

// Update a quotation
export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    res.json({ 
      message: "Quotation updated successfully", 
      quotation 
    });
  } catch (err) {
    console.error("Error updating quotation:", err);
    res.status(500).json({ error: err.message });
  }
};
