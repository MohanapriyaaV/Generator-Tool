import express from "express";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
} from "../controllers/purchase_order_controller.js";

const router = express.Router();

router.post("/", createPurchaseOrder); // Save purchase order
router.get("/", getPurchaseOrders); // Fetch all
router.get("/:id", getPurchaseOrderById); // Fetch single
router.put("/:id", updatePurchaseOrder); // Update

export default router;
