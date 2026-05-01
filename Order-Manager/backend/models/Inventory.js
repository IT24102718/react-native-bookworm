const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  bookId: {
    type: String,  // Use String, not ObjectId
    required: true,
    unique: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);