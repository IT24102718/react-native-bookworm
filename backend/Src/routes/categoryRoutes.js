import express from "express";
import protectRoute, { protectAdmin } from "../middleware/auth.middleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getBooksByCategory,
  getCategoryById,
  updateCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", protectRoute, getAllCategories);
router.get("/:id", protectRoute, getCategoryById);
router.get("/:id/books", protectRoute, getBooksByCategory);

router.post("/", protectAdmin, createCategory);
router.put("/:id", protectAdmin, updateCategory);
router.delete("/:id", protectAdmin, deleteCategory);

export default router;