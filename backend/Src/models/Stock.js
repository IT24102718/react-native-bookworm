import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      unique: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isFinite,
        message: "Quantity must be a number",
      },
    },
    reorderLevel: {
      type: Number,
      min: 0,
      default: 5,
    },
    supplierName: {
      type: String,
      trim: true,
      default: "",
    },
    lastRestockedDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

stockSchema.path("quantity").validate(function (value) {
  return Number.isFinite(value) && value >= 0;
}, "Quantity cannot be negative");

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;
