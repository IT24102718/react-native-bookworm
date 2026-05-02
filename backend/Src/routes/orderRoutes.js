import express from "express";
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  deleteOrder,
  completeOrder,
} from "../controllers/orderController.js";
import protectRoute, { protectAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, createOrder);
router.get("/", protectRoute, protectAdmin, getAllOrders);
router.get("/myorders", protectRoute, getMyOrders);
router.get("/:id", protectRoute, getOrderById);
router.put("/:id/cancel", protectRoute, cancelOrder);
router.put("/:id/complete", protectRoute, completeOrder);
router.put("/:id/status", protectRoute, protectAdmin, updateOrderStatus);
router.delete("/:id", protectRoute, protectAdmin, deleteOrder);

export default router;
