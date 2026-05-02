import express from "express";
import { protectAdmin } from "../middleware/auth.middleware.js";
import {
  createStock,
  deleteStock,
  getAllStock,
  getLowStockItems,
  getStockById,
  updateStock,
} from "../controllers/stockController.js";

const router = express.Router();

router.post("/", protectAdmin, createStock);
router.get("/", getAllStock);
router.get("/alerts/low", getLowStockItems);
router.get("/:id", getStockById);
router.put("/:id", protectAdmin, updateStock);
router.delete("/:id", protectAdmin, deleteStock);

export default router;