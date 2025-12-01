import express from "express";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  getNextPoNumber,
} from "../controllers/purchase_order_controller.js";

const router = express.Router();

router.get("/next-po-number", getNextPoNumber); // Get next PO number
router.post("/", createPurchaseOrder); // Save purchase order
router.get("/", getPurchaseOrders); // Fetch all
router.get("/:id", getPurchaseOrderById); // Fetch single
router.put("/:id", updatePurchaseOrder); // Update

export default router;
