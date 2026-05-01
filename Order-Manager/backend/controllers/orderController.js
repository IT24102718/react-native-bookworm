const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Inventory = require('../models/Inventory');
const Book = require('../models/Book');

// Helper: deduct stock
const deductStock = async (bookId, quantity, userId) => {
  const inventory = await Inventory.findOne({ bookId });
  if (!inventory) throw new Error('Inventory not found');
  if (inventory.quantity < quantity) throw new Error(`Insufficient stock`);
  inventory.quantity -= quantity;
  await inventory.save();
};

// Helper: restore stock
const restoreStock = async (bookId, quantity, userId) => {
  let inventory = await Inventory.findOne({ bookId });
  if (!inventory) {
    inventory = new Inventory({ bookId, quantity: 0 });
  }
  inventory.quantity += quantity;
  await inventory.save();
};

// @desc    Create order (No authentication required)
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, userId, items } = req.body;
    
    // Use provided userId or a default one
    const userIdToUse = userId || 'default_user_123';
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }

    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        bookId: item.bookId,
        title: item.title,
        quantity: item.quantity,
        price: item.price
      });
    }

    const tax = subtotal * 0.05;
    const shippingCost = 500;
    const totalAmount = subtotal + tax + shippingCost;
    const orderNumber = await Order.generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      userId: userIdToUse,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      shippingAddress: shippingAddress || {
        street: 'Default Street',
        city: 'Default City',
        postalCode: '00000'
      },
      paymentMethod: paymentMethod || 'cash',
      status: 'pending'
    });

    res.status(201).json({ success: true, data: order, message: 'Order placed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (No authentication required)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order by ID (No authentication required)
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order (No authentication required)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order already cancelled' });
    }
    
    order.status = 'cancelled';
    await order.save();
    res.json({ success: true, data: order, message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (No authentication required)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    order.status = status;
    await order.save();
    
    res.json({ success: true, data: order, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete order (No authentication required)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    await order.deleteOne();
    
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};