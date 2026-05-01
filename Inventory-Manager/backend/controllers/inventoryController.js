const Inventory = require("../models/Inventory");

// GET /api/inventory — get all inventory
exports.getAllInventory = async (req, res) => {
  try {
    const items = await Inventory.find().populate("bookId", "title author");
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/inventory/:bookId — get stock for one book
exports.getStockByBook = async (req, res) => {
  try {
    const item = await Inventory.findOne({ bookId: req.params.bookId }).populate(
      "bookId", "title author"
    );
    if (!item) return res.status(404).json({ message: "Inventory record not found" });
    res.status(200).json({
      ...item.toObject(),
      isLowStock: item.isLowStock,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/inventory — create inventory record
exports.createInventory = async (req, res) => {
  try {
    const { bookId, quantity, lowStockThreshold } = req.body;
    const existing = await Inventory.findOne({ bookId });
    if (existing)
      return res.status(400).json({ message: "Inventory already exists for this book" });

    const item = await Inventory.create({
      bookId,
      quantity: quantity || 0,
      lowStockThreshold: lowStockThreshold || 10,
      history: [
        {
          changedBy: req.user?.id || null,
          changeType: "set",
          quantityChanged: quantity || 0,
          reason: "Initial stock",
        },
      ],
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/inventory/:bookId/add — add stock
exports.addStock = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    if (!quantity || quantity <= 0)
      return res.status(400).json({ message: "Quantity must be a positive number" });

    const item = await Inventory.findOne({ bookId: req.params.bookId });
    if (!item) return res.status(404).json({ message: "Inventory record not found" });

    item.quantity += quantity;
    item.history.push({
      changedBy: req.user?.id || null,
      changeType: "add",
      quantityChanged: quantity,
      reason: reason || "Stock added",
    });
    await item.save();
    res.status(200).json({ message: "Stock added", inventory: item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/inventory/:bookId/deduct — reduce stock
exports.deductStock = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const item = await Inventory.findOne({ bookId: req.params.bookId });
    if (!item) return res.status(404).json({ message: "Inventory record not found" });
    if (item.quantity < quantity)
      return res.status(400).json({ message: "Insufficient stock" });

    item.quantity -= quantity;
    item.history.push({
      changedBy: req.user?.id || null,
      changeType: "deduct",
      quantityChanged: quantity,
      reason: reason || "Order placed",
    });
    await item.save();
    res.status(200).json({
      message: "Stock deducted",
      inventory: item,
      isLowStock: item.isLowStock,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/inventory/:bookId/restore — restore stock
exports.restoreStock = async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const item = await Inventory.findOne({ bookId: req.params.bookId });
    if (!item) return res.status(404).json({ message: "Inventory record not found" });

    item.quantity += quantity;
    item.history.push({
      changedBy: req.user?.id || null,
      changeType: "restore",
      quantityChanged: quantity,
      reason: reason || "Order cancelled",
    });
    await item.save();
    res.status(200).json({ message: "Stock restored", inventory: item });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/inventory/alerts/low — get low stock items
exports.getLowStockAlerts = async (req, res) => {
  try {
    const items = await Inventory.find().populate("bookId", "title author");
    const lowStock = items.filter((i) => i.isLowStock);
    res.status(200).json({ count: lowStock.length, items: lowStock });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/inventory/:bookId
exports.deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findOneAndDelete({ bookId: req.params.bookId });
    if (!item) return res.status(404).json({ message: "Inventory record not found" });
    res.status(200).json({ message: "Inventory record deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};