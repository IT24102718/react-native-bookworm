const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  title: String,
  quantity: Number,
  price: Number
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  userId: { type: String, required: true },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 500 },
  totalAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  shippingAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  paymentMethod: { type: String, default: 'cash' }
}, { timestamps: true });

orderSchema.statics.generateOrderNumber = async function() {
  const count = await this.countDocuments();
  const today = new Date();
  const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
  return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Order', orderSchema);