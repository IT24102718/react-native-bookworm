const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  title: String,
  price: Number,
  quantity: Number,
  coverImage: String
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Removed unique: true
  items: [cartItemSchema],
  totalAmount: { type: Number, default: 0 }
}, { timestamps: true });

// Remove the pre-save hook - calculate totalAmount in the controller instead
// This was causing the "next is not a function" error

module.exports = mongoose.model('Cart', cartSchema);