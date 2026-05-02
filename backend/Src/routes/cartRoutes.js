import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import {
  addToCart,
  getMyCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// All cart routes require authentication
router.post("/", protectRoute, addToCart);
router.get("/", protectRoute, getMyCart);
router.put("/:bookId", protectRoute, updateCartItemQuantity);
router.delete("/:bookId", protectRoute, removeCartItem);
router.delete("/", protectRoute, clearCart);

export default router;
