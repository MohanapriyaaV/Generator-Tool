import { PurchaseOrder } from "../models/purchase_order_model.js";
import { Counter } from "../models/counter_model.js";

// Helper function to extract numeric part from PO number
const extractPoNumber = (poNumber) => {
  if (!poNumber || typeof poNumber !== 'string') return null;
  // Match VIS_PO_ followed by digits (case insensitive)
  const match = poNumber.match(/VIS_PO_(\d+)/i);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
};

// Helper function to sync counter with PO number (updates counter to match or exceed the PO number)
const syncCounterWithPoNumber = async (poNumber) => {
  try {
    const numericValue = extractPoNumber(poNumber);
    if (numericValue === null || numericValue < 1) return;
    
    let counter = await Counter.findById("PO");
    
    if (!counter) {
      counter = await Counter.create({ _id: "PO", sequence_value: numericValue });
      return;
    }
    
    // Update counter if the PO number is higher than current counter
    if (numericValue >= counter.sequence_value) {
      counter.sequence_value = numericValue;
      await counter.save();
    }
  } catch (err) {
    console.error("Error syncing counter with PO number:", err);
    // Don't throw - this is a best-effort sync
  }
};

// Helper function to generate next PO number based on existing records
const generateNextPoNumber = async () => {
  try {
    // Get all existing purchase orders
    const allPOs = await PurchaseOrder.find();
    
    console.log(`[PO Number Generation] Found ${allPOs.length} existing PO records`);
    
    // Extract PO numbers and filter valid ones
    const existingNumbers = allPOs
      .map(po => {
        const num = po.poNumber || po.fullPurchaseOrderData?.poNumber || '';
        return num;
      })
      .filter(num => {
        if (!num || typeof num !== 'string') return false;
        const upperNum = num.toUpperCase();
        return upperNum.startsWith('VIS_PO_');
      });
    
    console.log(`[PO Number Generation] Valid PO numbers found:`, existingNumbers);
    
    // Extract numeric parts and find the highest
    const sequenceNumbers = existingNumbers
      .map(num => {
        const extracted = extractPoNumber(num);
        console.log(`[PO Number Generation] Extracted from "${num}":`, extracted);
        return extracted;
      })
      .filter(num => num !== null && num > 0);
    
    console.log(`[PO Number Generation] Sequence numbers:`, sequenceNumbers);
    
    // Find the maximum sequence number
    const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
    
    console.log(`[PO Number Generation] Max sequence found: ${maxSequence}`);
    
    // Next sequence number
    const nextSequence = maxSequence + 1;
    const paddedSequence = nextSequence.toString().padStart(4, '0');
    
    const poNumber = `VIS_PO_${paddedSequence}`;
    
    console.log(`[PO Number Generation] Generated next PO number: ${poNumber}`);
    
    // Sync counter with the max sequence found (for future reference, but don't increment yet)
    await syncCounterWithMaxSequence(maxSequence);
    
    return poNumber;
  } catch (err) {
    console.error("Error generating PO number:", err);
    throw new Error("Failed to generate PO number");
  }
};

// Helper function to sync counter with max sequence (without incrementing)
const syncCounterWithMaxSequence = async (maxSequence) => {
  try {
    if (maxSequence < 0) return;
    
    let counter = await Counter.findById("PO");
    
    if (!counter) {
      counter = await Counter.create({ _id: "PO", sequence_value: maxSequence });
      console.log(`[PO Counter] Created new counter with value: ${maxSequence}`);
      return;
    }
    
    // Always sync counter to match database max (not just if higher)
    // This ensures counter stays in sync with actual database records
    if (maxSequence !== counter.sequence_value) {
      console.log(`[PO Counter] Updating counter from ${counter.sequence_value} to ${maxSequence}`);
      counter.sequence_value = maxSequence;
      await counter.save();
    }
  } catch (err) {
    console.error("Error syncing counter with max sequence:", err);
    // Don't throw - this is a best-effort sync
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
    let finalPoNumber = poNumber;
    
    if (!finalPoNumber) {
      // Generate next number based on existing records
      finalPoNumber = await generateNextPoNumber();
    }
    
    // Sync counter when saving to ensure sequential numbering
    // This updates the counter to match the saved PO number
    await syncCounterWithPoNumber(finalPoNumber);

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
    const { poNumber } = req.body;
    
    // Sync counter if PO number was manually edited
    if (poNumber) {
      await syncCounterWithPoNumber(poNumber);
    }
    
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    res.json({ message: "Purchase order updated successfully", purchaseOrder: po });
  } catch (err) {
    console.error("Error updating purchase order:", err);
    res.status(500).json({ error: err.message });
  }
};
