const Book = require("../models/Book");

// CREATE
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, price, description, category, stockQuantity } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : "";

    // Auto set unavailable when stock is 0
    const availabilityStatus = parseInt(stockQuantity) > 0;

    const book = await Book.create({
      title, author, isbn, price, description,
      category, stockQuantity, coverImage, availabilityStatus,
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET ALL
const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().populate("category", "name");
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SINGLE
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate("category", "name");
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
const updateBook = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.coverImage = `/uploads/${req.file.filename}`;

    // Auto set unavailable when stock is 0
    if (updates.stockQuantity !== undefined && parseInt(updates.stockQuantity) === 0) {
      updates.availabilityStatus = false;
    }

    // Auto set available when stock is added back
    if (updates.stockQuantity !== undefined && parseInt(updates.stockQuantity) > 0) {
      updates.availabilityStatus = true;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.status(200).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createBook, getAllBooks, getBookById, updateBook, deleteBook };
