import mongoose from "mongoose";
import Review from "../models/Review.js";
import Book from "../models/Book.js";
import { recalculateBookRatingStats } from "../lib/reviewStats.js";

export const createReview = async (req, res) => {
  try {
    const { rating, comment, reviewText, bookId } = req.body;

    if (!bookId || rating === undefined || rating === null) {
      return res.status(400).json({ message: "Book and rating are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User authentication required" });
    }

    const existingReview = await Review.findOne({ userId: req.user._id, bookId });
    if (existingReview) {
      return res.status(409).json({ message: "You have already reviewed this book" });
    }

    const normalizedComment = typeof comment === "string" ? comment.trim() : "";
    const normalizedReviewText = typeof reviewText === "string" ? reviewText.trim() : "";

    const newReview = new Review({
      rating: parsedRating,
      reviewText: normalizedReviewText,
      comment: normalizedComment,
      bookId,
      userId: req.user._id,
    });

    await newReview.save();
    
    try {
      await recalculateBookRatingStats(bookId);
    } catch (statsError) {
      console.log("Warning: Could not update book stats:", statsError.message);
    }

    const populatedReview = await Review.findById(newReview._id)
      .populate("userId", "username profileImage")
      .populate("bookId", "title image");

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error("Error creating review:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "You have already reviewed this book" });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [reviews, totalReviews, stats] = await Promise.all([
      Review.find({ bookId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username profileImage"),
      Review.countDocuments({ bookId }),
      Review.aggregate([
        { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
        {
          $group: {
            _id: "$bookId",
            averageRating: { $avg: "$rating" },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      reviews,
      currentPage: page,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      averageRating: stats[0]?.averageRating || 0,
      totalRatings: stats[0]?.totalRatings || 0,
    });
  } catch (error) {
    console.log("Error getting book reviews", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const review = await Review.findById(id)
      .populate("userId", "username profileImage")
      .populate("bookId", "title image");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.log("Error getting review", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, reviewText } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can edit only your own review" });
    }

    if (rating !== undefined && rating !== null) {
      const parsedRating = Number(rating);
      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = parsedRating;
    }

    if (reviewText !== undefined) {
      if (typeof reviewText !== "string") {
        return res.status(400).json({ message: "Review text must be a string" });
      }
      review.reviewText = reviewText.trim();
    }

    if (comment !== undefined) {
      if (typeof comment !== "string") {
        return res.status(400).json({ message: "Review title must be a string" });
      }
      review.comment = comment.trim();
    }

    await review.save();
    await recalculateBookRatingStats(review.bookId);

    const updatedReview = await Review.findById(review._id)
      .populate("userId", "username profileImage")
      .populate("bookId", "title image");

    res.json(updatedReview);
  } catch (error) {
    console.log("Error updating review", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can delete only your own review" });
    }

    const bookId = review.bookId;
    await review.deleteOne();
    await recalculateBookRatingStats(bookId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.log("Error deleting review", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBookReviewSummary = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const summary = await Review.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
      {
        $group: {
          _id: "$bookId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const distributionRows = await Review.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    distributionRows.forEach((row) => {
      const star = Number(row._id);
      if (star >= 1 && star <= 5) {
        ratingDistribution[star] = row.count;
      }
    });

    res.json({
      averageRating: summary[0]?.averageRating || 0,
      totalReviews: summary[0]?.totalReviews || 0,
      ratingDistribution,
    });
  } catch (error) {
    console.log("Error getting review summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("bookId", "title image")
      .populate("userId", "username profileImage");

    res.json(reviews);
  } catch (error) {
    console.log("Error getting user reviews", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
