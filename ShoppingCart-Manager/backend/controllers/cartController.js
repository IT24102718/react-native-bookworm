const Cart = require('../models/Cart');

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { bookId, title, price, quantity = 1, coverImage } = req.body;
    
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });
    
    const existingItem = cart.items.find(item => item.bookId === bookId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ bookId, title, price, quantity, coverImage: coverImage || '' });
    }
    
    await cart.save();
    res.json({ success: true, data: cart, message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id });
    
    const item = cart.items.find(item => item.bookId === bookId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.bookId !== bookId);
    } else {
      item.quantity = quantity;
    }
    
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { bookId } = req.params;
    const cart = await Cart.findOne({ userId: req.user.id });
    cart.items = cart.items.filter(item => item.bookId !== bookId);
    await cart.save();
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};