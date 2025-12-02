import { Invoice } from "../models/invoice_model.js";
import { getCurrentFinancialYear, extractFinancialYear, extractSequenceNumber } from "../utils/financialYear.js";

// Save a new invoice
export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      referenceNo,
      projectName,
      fromAddress,
      toAddress,
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

    const invoice = new Invoice({
      invoiceNumber,
      invoiceDate,
      referenceNo: referenceNo || "",
      projectName: projectName || "",
      fromAddress: {
        companyName: fromAddress.companyName || "",
        address: fromAddress.address || "",
        gst: fromAddress.gst || "",
      },
      toAddress: toAddress ? {
        name: toAddress.name || "",
        address: toAddress.address || "",
      } : {},
      totalAmount,
      s3Url: s3Url || "",
      fullInvoiceData: fullInvoiceData || {},
    });

    await invoice.save();
    res.status(201).json({ 
      message: "Invoice saved successfully", 
      invoice 
    });
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch all invoices
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch one invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json(invoice);
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update an invoice
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json({ 
      message: "Invoice updated successfully", 
      invoice 
    });
  } catch (err) {
    console.error("Error updating invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete an invoice
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error("Error deleting invoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get next invoice number
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const financialYear = getCurrentFinancialYear();
    const prefix = 'INV';
    
    // Get all invoices for the current financial year
    const allInvoices = await Invoice.find();
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
    console.error("Error generating invoice number:", err);
    res.status(500).json({ error: err.message });
  }
};

