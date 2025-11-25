import { PurchaseOrder } from "../models/purchase_order_model.js";

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

    if (!poNumber || !poDate || totalAmount === undefined) {
      return res.status(400).json({ error: "Missing required fields: poNumber, poDate, totalAmount" });
    }

    const purchaseOrder = new PurchaseOrder({
      poNumber,
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
