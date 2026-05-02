import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  title: String,
  quantity: Number,
  price: Number,
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 500 },
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled"],
      default: "pending",
    },
    shippingAddress: {
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: "Sri Lanka" },
    },
    paymentMethod: { type: String, default: "cash" },
  },
  { timestamps: true }
);

orderSchema.statics.generateOrderNumber = async function () {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^ORD-${dateStr}-`)
  }).sort({ orderNumber: -1 });

  let sequence = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  return `ORD-${dateStr}-${String(sequence).padStart(4, "0")}`;
};

const Order = mongoose.model("Order", orderSchema);

export default Order;
