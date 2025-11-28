import { PurchaseOrder } from "../models/purchase_order_model.js";
import { Counter } from "../models/counter_model.js";

// Helper function to generate next PO number
const generateNextPoNumber = async () => {
  try {
    // First, check if counter exists
    let counter = await Counter.findById("PO");
    
    if (!counter) {
      // Initialize counter to 0 so first increment gives 1 (VIS_PO_0001)
      counter = await Counter.create({ _id: "PO", sequence_value: 0 });
    }
    
    // Now increment and get the next number
    // This will give 1 on first call (0 + 1 = 1), then 2, 3, etc.
    counter = await Counter.findByIdAndUpdate(
      { _id: "PO" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    
    // Counter will now have sequence_value: 1 for first call, 2 for second, etc.
    const poNumber = `VIS_PO_${String(counter.sequence_value).padStart(4, '0')}`;
    return poNumber;
  } catch (err) {
    console.error("Error generating PO number:", err);
    throw new Error("Failed to generate PO number");
  }
};

// Save a new purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    const {
      poNumber,
      poDate,
      totalAmount,
      referenceNumber,
      projectName,
      billToAddress,
      shipToAddress,
      s3Url,
      fullPurchaseOrderData,
    } = req.body;

    if (!poDate || totalAmount === undefined) {
      return res.status(400).json({ error: "Missing required fields: poDate, totalAmount" });
    }

    // Auto-generate PO number if not provided
    const finalPoNumber = poNumber || await generateNextPoNumber();

    const purchaseOrder = new PurchaseOrder({
      poNumber: finalPoNumber,
      poDate,
      referenceNumber: referenceNumber || "",
      projectName: projectName || "",
      billToAddress: billToAddress || {},
      shipToAddress: shipToAddress || {},
      totalAmount,
      s3Url: s3Url || "",
      fullPurchaseOrderData: fullPurchaseOrderData || {},
    });

    await purchaseOrder.save();
    res.status(201).json({ message: "Purchase order saved successfully", purchaseOrder });
  } catch (err) {
    console.error("Error creating purchase order:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get next PO number (for frontend to display in form)
export const getNextPoNumber = async (req, res) => {
  try {
    const poNumber = await generateNextPoNumber();
    res.json({ poNumber });
  } catch (err) {
    console.error("Error fetching next PO number:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch all purchase orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    console.error("Error fetching purchase orders:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch one purchase order by ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    res.json(po);
  } catch (err) {
    console.error("Error fetching purchase order:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update a purchase order
export const updatePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    res.json({ message: "Purchase order updated successfully", purchaseOrder: po });
  } catch (err) {
    console.error("Error updating purchase order:", err);
    res.status(500).json({ error: err.message });
  }
};
