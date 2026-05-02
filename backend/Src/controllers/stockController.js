import mongoose from "mongoose";
import Book from "../models/Book.js";
import Stock from "../models/Stock.js";
import { getStockStatus } from "../lib/stockValidation.js";

const createValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const parseNonNegativeInteger = (value, fieldName) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw createValidationError(`${fieldName} must be a non-negative integer`);
  }

  return parsedValue;
};

const mergeBookWithStock = (book, stock) => {
  const serializedBook = book.toObject ? book.toObject() : { ...book };

  serializedBook.hasStockEntry = Boolean(stock);

  const stockQuantity = stock ? stock.quantity : serializedBook.stockQuantity;
  const lowStockThreshold = stock ? stock.reorderLevel : serializedBook.lowStockThreshold;

  serializedBook.stockQuantity = stockQuantity;
  serializedBook.lowStockThreshold = lowStockThreshold;
  serializedBook.stockStatus = getStockStatus(stockQuantity, lowStockThreshold);

  return serializedBook;
};

const getBookWithRelations = async (bookId) => {
  return Book.findById(bookId)
    .select("title author stockQuantity lowStockThreshold category categoryId createdBy")
    .populate("createdBy", "username profileImage")
    .populate("categoryId", "name description image");
};

const getMergedBookById = async (bookId) => {
  const book = await getBookWithRelations(bookId);

  if (!book) return null;

  const stock = await Stock.findOne({ bookId }).select("quantity reorderLevel");
  return mergeBookWithStock(book, stock);
};

export const createStock = async (req, res) => {
  try {
    const { bookId, id, quantity, reorderLevel, supplierName } = req.body || {};
    const resolvedBookId = bookId || id;
    const normalizedSupplierName = typeof supplierName === "string" ? supplierName.trim() : "";

    if (!resolvedBookId || !mongoose.Types.ObjectId.isValid(resolvedBookId)) {
      return res.status(400).json({ message: "Valid bookId is required" });
    }

    if (quantity === undefined) {
      return res.status(400).json({ message: "Quantity is required" });
    }

    const parsedQuantity = parseNonNegativeInteger(quantity, "quantity");
    const parsedReorderLevel =
      reorderLevel === undefined ? 5 : parseNonNegativeInteger(reorderLevel, "reorderLevel");

    const book = await Book.findById(resolvedBookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const existingStock = await Stock.findOne({ bookId: resolvedBookId });
    if (existingStock) {
      return res.status(409).json({ message: "Stock already exists for this book" });
    }

    await Stock.create({
      bookId: resolvedBookId,
      quantity: parsedQuantity,
      reorderLevel: parsedReorderLevel,
      supplierName: normalizedSupplierName,
    });

    await Book.findByIdAndUpdate(resolvedBookId, {
      stockQuantity: parsedQuantity,
      lowStockThreshold: parsedReorderLevel,
    });

    const mergedBook = await getMergedBookById(resolvedBookId);
    return res.status(201).json(mergedBook);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }

    console.log("Error in create stock route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllStock = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title author stockQuantity lowStockThreshold category categoryId createdBy")
      .populate("createdBy", "username profileImage")
      .populate("categoryId", "name description image");

    const bookIds = books.map((book) => book._id);
    const stockEntries = await Stock.find({ bookId: { $in: bookIds } }).select(
      "bookId quantity reorderLevel"
    );
    const stockByBookId = new Map(stockEntries.map((stock) => [String(stock.bookId), stock]));

    const mergedBooks = books.map((book) => {
      const matchingStock = stockByBookId.get(String(book._id));
      return mergeBookWithStock(book, matchingStock);
    });

    const totalBooks = await Book.countDocuments();

    res.status(200).json({
      books: mergedBooks,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all stock items route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getStockById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const book = await getBookWithRelations(id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const stock = await Stock.findOne({ bookId: id }).select("quantity reorderLevel");
    const mergedBook = mergeBookWithStock(book, stock);

    res.status(200).json(mergedBook);
  } catch (error) {
    console.log("Error in get book stock by id route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const { stockQuantity, lowStockThreshold } = req.body || {};

    if (stockQuantity === undefined && lowStockThreshold === undefined) {
      return res.status(400).json({ message: "Provide stockQuantity or lowStockThreshold" });
    }

    const updatePayload = {};

    if (stockQuantity !== undefined) {
      updatePayload.stockQuantity = parseNonNegativeInteger(stockQuantity, "stockQuantity");
    }

    if (lowStockThreshold !== undefined) {
      updatePayload.lowStockThreshold = parseNonNegativeInteger(
        lowStockThreshold,
        "lowStockThreshold"
      );
    }

    const existingBook = await Book.findById(id);

    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const currentStock = await Stock.findOne({ bookId: id });

    const resolvedQuantity =
      updatePayload.stockQuantity !== undefined
        ? updatePayload.stockQuantity
        : currentStock
          ? currentStock.quantity
          : existingBook.stockQuantity;

    const resolvedThreshold =
      updatePayload.lowStockThreshold !== undefined
        ? updatePayload.lowStockThreshold
        : currentStock
          ? currentStock.reorderLevel
          : existingBook.lowStockThreshold;

    await Stock.findOneAndUpdate(
      { bookId: id },
      {
        $set: {
          quantity: resolvedQuantity,
          reorderLevel: resolvedThreshold,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const updatedBook = await Book.findByIdAndUpdate(
      id,
      {
        stockQuantity: resolvedQuantity,
        lowStockThreshold: resolvedThreshold,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("title author stockQuantity lowStockThreshold category categoryId createdBy")
      .populate("createdBy", "username profileImage")
      .populate("categoryId", "name description image");

    const mergedBook = mergeBookWithStock(updatedBook, {
      quantity: resolvedQuantity,
      reorderLevel: resolvedThreshold,
    });

    res.status(200).json(mergedBook);
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }

    console.log("Error in update book stock route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book id" });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const deletedStock = await Stock.findOneAndDelete({ bookId: id });
    if (!deletedStock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    await Book.findByIdAndUpdate(id, {
      stockQuantity: 0,
      lowStockThreshold: deletedStock.reorderLevel,
    });

    res.status(200).json({ message: "Stock deleted successfully" });
  } catch (error) {
    console.log("Error in delete stock route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .select("title author stockQuantity lowStockThreshold category categoryId createdBy")
      .populate("createdBy", "username profileImage")
      .populate("categoryId", "name description image");

    const stockEntries = await Stock.find({ bookId: { $in: books.map((book) => book._id) } }).select(
      "bookId quantity reorderLevel"
    );

    const stockByBookId = new Map(stockEntries.map((stock) => [String(stock.bookId), stock]));

    const lowStockBooks = books
      .map((book) => {
        const stock = stockByBookId.get(String(book._id));

        if (stock) {
          if (stock.quantity <= stock.reorderLevel) {
            return mergeBookWithStock(book, stock);
          }

          return null;
        }

        if (book.stockQuantity <= book.lowStockThreshold) {
          return mergeBookWithStock(book, null);
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.stockQuantity !== b.stockQuantity) {
          return a.stockQuantity - b.stockQuantity;
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    res.status(200).json({ books: lowStockBooks });
  } catch (error) {
    console.log("Error in get low stock books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Backward-compatible aliases for existing imports/routes.
export const getAllStockItems = getAllStock;
export const getBookStockById = getStockById;
export const updateBookStock = updateStock;
export const getLowStockBooks = getLowStockItems;