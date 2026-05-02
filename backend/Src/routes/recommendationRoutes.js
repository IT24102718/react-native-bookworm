import express from "express";
import {
  getTopRatedBooks,
  getMostReviewedBooks,
} from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/top-rated", getTopRatedBooks);
router.get("/most-reviewed", getMostReviewedBooks);

export default router;
