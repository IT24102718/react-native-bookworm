import mongoose from "mongoose";
import Review from "../models/Review.js";
import Book from "../models/Book.js";

export const recalculateBookRatingStats = async (bookId) => {
  try {
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      console.log("Invalid bookId for rating stats:", bookId);
      return;
    }

    const stats = await Review.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
      {
        $group: {
          _id: "$bookId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats[0]?.averageRating || 0;
    const totalReviews = stats[0]?.totalReviews || 0;

    const updated = await Book.findByIdAndUpdate(
      bookId,
      { averageRating, totalReviews },
      { new: true }
    );

    if (!updated) {
      console.log("Book not found for stats update:", bookId);
    }
  } catch (error) {
    console.error("Error recalculating book rating stats:", error.message);
  }
};