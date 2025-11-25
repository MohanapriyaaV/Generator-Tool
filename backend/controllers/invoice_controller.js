import { Invoice } from "../models/invoice_model.js";

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

