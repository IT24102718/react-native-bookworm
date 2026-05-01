const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Allow string IDs like "dummy_book_id_1"
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true },
  price: { type: Number, required: true },
  pages: Number,
  description: String,
  categoryId: String,
  coverImage: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);