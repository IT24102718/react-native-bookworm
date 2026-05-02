import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
      default: null,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    stockQuantity: {
      type: Number,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "Stock quantity must be an integer",
      },
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5,
      validate: {
        validator: Number.isInteger,
        message: "Low stock threshold must be an integer",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

bookSchema.virtual("stockStatus").get(function () {
  if (this.stockQuantity === 0) {
    return "out_of_stock";
  }

  if (this.stockQuantity <= this.lowStockThreshold) {
    return "low_stock";
  }

  return "in_stock";
});

bookSchema.set("toJSON", { virtuals: true });
bookSchema.set("toObject", { virtuals: true });

const Book = mongoose.model("Book", bookSchema);

export default Book;