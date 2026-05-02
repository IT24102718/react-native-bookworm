import mongoose from "mongoose";
import Book from "../models/Book.js";
import Stock from "../models/Stock.js";

export const createStockValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const parseRequestedQuantity = (requestedQuantity, fieldName = "quantity") => {
  const normalizedQuantity = Number(requestedQuantity);

  if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
    throw createStockValidationError(`${fieldName} must be a positive integer`, 400);
  }

  return normalizedQuantity;
};

export const isBookInStock = (book) => {
  return Number(book?.stockQuantity) > 0;
};

export const isRequestedQuantityAvailable = (book, requestedQuantity) => {
  const normalizedQuantity = parseRequestedQuantity(requestedQuantity);
  return Number(book?.stockQuantity) >= normalizedQuantity;
};

export const assertBookInStock = (book, message = "Book is out of stock") => {
  if (!isBookInStock(book)) {
    throw createStockValidationError(message, 409);
  }
};

export const assertRequestedQuantityAvailable = (book, requestedQuantity) => {
  const normalizedQuantity = parseRequestedQuantity(requestedQuantity);

  if (!isRequestedQuantityAvailable(book, normalizedQuantity)) {
    const availableStock = Number(book?.stockQuantity) || 0;
    throw createStockValidationError(
      `Requested quantity exceeds available stock (${availableStock})`,
      409
    );
  }

  return normalizedQuantity;
};

export const getBookForStockValidation = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    throw createStockValidationError("Invalid book id", 400);
  }

  const book = await Book.findById(bookId).select("title stockQuantity lowStockThreshold");

  if (!book) {
    throw createStockValidationError("Book not found", 404);
  }

  return book;
};

export const getAvailableStockQuantity = (book) => {
  return Number(book?.stockQuantity) || 0;
};

export const getStockRecordForBook = async (bookId, { required = true } = {}) => {
  const stockRecord = await Stock.findOne({ bookId }).select("bookId quantity reorderLevel");

  if (!stockRecord && required) {
    throw createStockValidationError("Stock record not found for book", 404);
  }

  return stockRecord;
};

export const getStockStatus = (stockQuantity, lowStockThreshold) => {
  if (stockQuantity === 0) {
    return "out_of_stock";
  }

  if (stockQuantity <= lowStockThreshold) {
    return "low_stock";
  }

  return "in_stock";
};

export const validateBookStockForRequest = async (
  bookId,
  requestedQuantity,
  { requireStockRecord = true } = {}
) => {
  const book = await getBookForStockValidation(bookId);
  const normalizedQuantity = parseRequestedQuantity(requestedQuantity);
  const stockRecord = await getStockRecordForBook(bookId, { required: requireStockRecord });

  const availableStock = stockRecord
    ? Number(stockRecord.quantity) || 0
    : getAvailableStockQuantity(book);

  // Future cart/order flow: call once to fetch, normalize, and enforce stock checks.
  assertRequestedQuantityAvailable({ stockQuantity: availableStock }, normalizedQuantity);

  return {
    book,
    stockRecord,
    requestedQuantity: normalizedQuantity,
    availableStock,
  };
};
