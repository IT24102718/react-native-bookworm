import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
