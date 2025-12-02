import { ProformaInvoice } from "../models/proforma_invoice_model.js";
import { getCurrentFinancialYear, extractFinancialYear, extractSequenceNumber } from "../utils/financialYear.js";

// Save a new proforma invoice
export const createProformaInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      referenceNo,
      projectName,
      fromAddress,
      billToAddress,
      totalAmount,
      s3Url,
      fullInvoiceData,
    } = req.body;

    // Validate required fields
    if (!invoiceNumber || !invoiceDate || !totalAmount) {
      return res.status(400).json({ 
        error: "Missing required fields: invoiceNumber, invoiceDate, and totalAmount are required" 
      });
    }

    if (!fromAddress || !fromAddress.companyName) {
      return res.status(400).json({ 
        error: "From address with company name is required" 
      });
    }

    const proformaInvoice = new ProformaInvoice({
      invoiceNumber,
      invoiceDate,
      referenceNo: referenceNo || "",
      projectName: projectName || "",
      fromAddress: {
        companyName: fromAddress.companyName || "",
        street: fromAddress.street || "",
        apartment: fromAddress.apartment || "",
        city: fromAddress.city || "",
        zipCode: fromAddress.zipCode || "",
        country: fromAddress.country || "",
        state: fromAddress.state || "",
        pan: fromAddress.pan || fromAddress.PAN || "",
        gstin: fromAddress.gstin || fromAddress.GSTIN || "",
      },
      billToAddress: billToAddress ? {
        clientName: billToAddress.clientName || "",
        companyName: billToAddress.companyName || "",
        street: billToAddress.street || "",
        apartment: billToAddress.apartment || "",
        city: billToAddress.city || "",
        zipCode: billToAddress.zipCode || "",
        country: billToAddress.country || "",
        state: billToAddress.state || "",
        pan: billToAddress.pan || billToAddress.PAN || "",
        gstin: billToAddress.gstin || billToAddress.GSTIN || "",
        phoneNumber: billToAddress.phoneNumber || billToAddress.phone || "",
      } : {},
      totalAmount,
      s3Url: s3Url || "",
      fullInvoiceData: fullInvoiceData || {},
    });

    await proformaInvoice.save();
    
    // Log to verify PAN, GSTIN, and phoneNumber are saved
    console.log('✅ Proforma Invoice saved:', {
      invoiceNumber: proformaInvoice.invoiceNumber,
      fromAddress: {
        pan: proformaInvoice.fromAddress.pan,
        gstin: proformaInvoice.fromAddress.gstin
      },
      billToAddress: {
        pan: proformaInvoice.billToAddress?.pan,
        gstin: proformaInvoice.billToAddress?.gstin,
        phoneNumber: proformaInvoice.billToAddress?.phoneNumber
      }
    });
    
    res.status(201).json({ 
      message: "Proforma invoice saved successfully", 
      proformaInvoice 
    });
  } catch (err) {
    console.error("Error creating proforma invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch all proforma invoices
export const getProformaInvoices = async (req, res) => {
  try {
    const invoices = await ProformaInvoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    console.error("Error fetching proforma invoices:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch one proforma invoice by ID
export const getProformaInvoiceById = async (req, res) => {
  try {
    const invoice = await ProformaInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Proforma invoice not found" });
    }
    res.json(invoice);
  } catch (err) {
    console.error("Error fetching proforma invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch proforma invoice by reference number
export const getProformaInvoiceByReferenceNo = async (req, res) => {
  try {
    const { referenceNo } = req.params;
    const invoice = await ProformaInvoice.findOne({ referenceNo: referenceNo });
    if (!invoice) {
      return res.status(404).json({ message: "Proforma invoice not found with this reference number" });
    }
    res.json(invoice);
  } catch (err) {
    console.error("Error fetching proforma invoice by reference number:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update a proforma invoice
export const updateProformaInvoice = async (req, res) => {
  try {
    const invoice = await ProformaInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: "Proforma invoice not found" });
    }
    res.json({ 
      message: "Proforma invoice updated successfully", 
      invoice 
    });
  } catch (err) {
    console.error("Error updating proforma invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a proforma invoice
export const deleteProformaInvoice = async (req, res) => {
  try {
    const invoice = await ProformaInvoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Proforma invoice not found" });
    }
    res.json({ message: "Proforma invoice deleted successfully" });
  } catch (err) {
    console.error("Error deleting proforma invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get next proforma invoice number
export const getNextProformaInvoiceNumber = async (req, res) => {
  try {
    const financialYear = getCurrentFinancialYear();
    const prefix = 'PI';
    
    // Get all proforma invoices for the current financial year
    const allInvoices = await ProformaInvoice.find();
    const currentYearNumbers = allInvoices
      .map(inv => inv.invoiceNumber || inv.fullInvoiceData?.invoiceNumber || '')
      .filter(num => {
        const year = extractFinancialYear(num);
        return year === financialYear && num.startsWith(prefix);
      });
    
    // Extract sequence numbers and find the highest
    const sequenceNumbers = currentYearNumbers
      .map(num => extractSequenceNumber(num))
      .filter(num => num !== null);
    
    const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    const nextSequence = maxSequence + 1;
    const paddedSequence = nextSequence.toString().padStart(4, '0');
    
    const invoiceNumber = `${prefix}${financialYear}${paddedSequence}`;
    
    res.json({ invoiceNumber });
  } catch (err) {
    console.error("Error generating proforma invoice number:", err);
    res.status(500).json({ error: err.message });
  }
};

