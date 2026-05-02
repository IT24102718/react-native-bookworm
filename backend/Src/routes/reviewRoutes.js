import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import {
  createReview,
  getReviewsByBook,
  getReviewById,
  updateReview,
  deleteReview,
  getBookReviewSummary,
  getUserReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", protectRoute, createReview);

router.get("/book/:bookId/summary", getBookReviewSummary);
router.get("/book/:bookId", getReviewsByBook);

router.get("/user", protectRoute, getUserReviews);
router.get("/:id", getReviewById);

router.put("/:id", protectRoute, updateReview);

router.delete("/:id", protectRoute, deleteReview);

export default router;
