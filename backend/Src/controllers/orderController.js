import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Stock from "../models/Stock.js";
import Book from "../models/Book.js";
import { validateBookStockForRequest } from "../lib/stockValidation.js";

// Helper: deduct stock
const deductStock = async (bookId, quantity) => {
  const stockRecord = await Stock.findOne({ bookId });
  if (!stockRecord) throw new Error("Stock record not found");
  if (stockRecord.quantity < quantity) throw new Error("Insufficient stock");
  stockRecord.quantity -= quantity;
  await stockRecord.save();
};

// Helper: restore stock
const restoreStock = async (bookId, quantity) => {
  let stockRecord = await Stock.findOne({ bookId });
  if (!stockRecord) {
    stockRecord = new Stock({ bookId, quantity: 0 });
  }
  stockRecord.quantity += quantity;
  await stockRecord.save();
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, items } = req.body;
    const userId = req.user._id;

    // Update user's default address if shippingAddress is provided
    if (shippingAddress) {
      req.user.address = {
        street: shippingAddress.street || req.user.address?.street,
        city: shippingAddress.city || req.user.address?.city,
        postalCode: shippingAddress.postalCode || req.user.address?.postalCode,
        country: shippingAddress.country || req.user.address?.country || "Sri Lanka",
      };
      await req.user.save();
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items provided" });
    }

    let subtotal = 0;
    const orderItems = [];

    // First validate stock for all items
    for (const item of items) {
      await validateBookStockForRequest(item.bookId, item.quantity, {
        requireStockRecord: false,
      });
    }

    for (const item of items) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        bookId: item.bookId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      });

      // Deduct stock
      await deductStock(item.bookId, item.quantity);
    }

    const tax = subtotal * 0.05;
    const shippingCost = 500;
    const totalAmount = subtotal + tax + shippingCost;
    const orderNumber = await Order.generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      userId,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      shippingAddress: shippingAddress || {
        street: "Default Street",
        city: "Default City",
        postalCode: "00000",
      },
      paymentMethod: paymentMethod || "cash",
      status: "pending",
    });

    // Optionally clear user's cart if that's expected
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    res.status(201).json({ 
      success: true, 
      data: order, 
      message: "Order placed",
      userAddress: req.user.address 
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("userId", "name email");
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow admin or the order creator to view it
    if (order.userId._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to view this order" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Error in getOrderById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.userId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this order" });
    }

    if (order.status === "delivered" || order.status === "completed") {
      return res.status(400).json({ success: false, message: "Delivered or completed orders cannot be cancelled" });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Order already cancelled" });
    }

    order.status = "cancelled";
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await restoreStock(item.bookId, item.quantity);
    }

    res.json({ success: true, data: order, message: "Order cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"];

    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (status === "cancelled" && order.status !== "cancelled") {
      // Restore stock
      for (const item of order.items) {
        await restoreStock(item.bookId, item.quantity);
      }
    } else if (order.status === "cancelled" && status !== "cancelled") {
      // Re-deduct stock if un-cancelling
      for (const item of order.items) {
        await deductStock(item.bookId, item.quantity);
      }
    }

    order.status = status;
    await order.save();

    res.json({ success: true, data: order, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete order (user confirms receipt)
// @route   PUT /api/orders/:id/complete
// @access  Private
export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (order.status === "completed") {
      return res.status(400).json({ success: false, message: "Order already completed" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot complete a cancelled order" });
    }

    order.status = "completed";
    await order.save();

    res.json({ success: true, data: order, message: "Order marked as completed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await order.deleteOne();

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
