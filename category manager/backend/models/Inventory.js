const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    history: [
      {
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changeType: {
          type: String,
          enum: ["add", "deduct", "set", "restore"],
        },
        quantityChanged: Number,
        reason: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Virtual: is this item low stock?
inventorySchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});

module.exports = mongoose.model("Inventory", inventorySchema);