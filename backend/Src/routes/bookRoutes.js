import express from "express";
import protectRoute, { protectAdmin } from "../middleware/auth.middleware.js";
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  updateBook,
} from "../controllers/bookController.js";

const router = express.Router();

router.get("/", protectRoute, getAllBooks);
router.get("/:id", protectRoute, getBookById);

router.post("/", protectAdmin, createBook);
router.put("/:id", protectAdmin, updateBook);
router.delete("/:id", protectAdmin, deleteBook);

export default router;