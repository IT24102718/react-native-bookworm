import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";
import mongoose from "mongoose";
import Book from "../models/Book.js";
import Category from "../models/Category.js";
import Stock from "../models/Stock.js";
import { getStockStatus } from "../lib/stockValidation.js";

const getTrimmedNonEmptyString = (value) => {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
};

const isValidImageInput = (value) => {
  if (typeof value !== "string") return false;

  const trimmedValue = value.trim();
  if (!trimmedValue) return false;

  return (
    trimmedValue.startsWith("data:image/") ||
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  );
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findCategoryByNameCaseInsensitive = async (name) => {
  return Category.findOne({
    name: {
      $regex: `^${escapeRegex(name)}$`,
      $options: "i",
    },
  });
};

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

const applyStockToSerializedBook = (serializedBook, stock) => {
  const stockQuantity = stock ? stock.quantity : serializedBook.stockQuantity;
  const lowStockThreshold = stock ? stock.reorderLevel : serializedBook.lowStockThreshold;

  serializedBook.stockQuantity = stockQuantity;
  serializedBook.lowStockThreshold = lowStockThreshold;
  serializedBook.stockStatus = getStockStatus(stockQuantity, lowStockThreshold);

  return serializedBook;
};

const serializeBookForResponse = (book, user, stock = null) => {
  const serializedBook = book.toObject ? book.toObject() : { ...book };

  applyStockToSerializedBook(serializedBook, stock);

  // Keep stock status for all readers but hide admin threshold internals.
  delete serializedBook.lowStockThreshold;

  if (!user?.isAdmin) {
    delete serializedBook.stockQuantity;
  }

  return serializedBook;
};

const resolveCategoryPayload = async ({ category, categoryId, allowClear = false }) => {
  const hasCategory = category !== undefined;
  const hasCategoryId = categoryId !== undefined;

  if (!hasCategory && !hasCategoryId) {
    return { provided: false };
  }

  if (allowClear) {
    const clearRequested =
      category === null ||
      categoryId === null ||
      categoryId === "" ||
      (typeof category === "string" && category.trim() === "");

    if (clearRequested) {
      return { provided: true, clear: true };
    }
  }

  let matchedCategory = null;

  if (hasCategoryId) {
    if (typeof categoryId !== "string") {
      throw createValidationError("Category id must be a string");
    }

    const trimmedCategoryId = categoryId.trim();
    if (!trimmedCategoryId) {
      throw createValidationError("Category id cannot be empty");
    }

    if (!mongoose.Types.ObjectId.isValid(trimmedCategoryId)) {
      throw createValidationError("Invalid category id");
    }

    matchedCategory = await Category.findById(trimmedCategoryId);
  } else {
    if (typeof category !== "string") {
      throw createValidationError("Category must be a string");
    }

    const trimmedCategory = category.trim();
    if (!trimmedCategory) {
      throw createValidationError("Category cannot be empty");
    }

    matchedCategory = await findCategoryByNameCaseInsensitive(trimmedCategory);
  }

  if (!matchedCategory) {
    throw createValidationError("Category not found");
  }

  return {
    provided: true,
    clear: false,
    categoryId: matchedCategory._id,
    categoryName: matchedCategory.name,
  };
};

export const getAllBooks = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "username profileImage")
      .populate("categoryId", "name description image");

    const bookIds = books.map((book) => book._id);
    const stockEntries = await Stock.find({ bookId: { $in: bookIds } }).select(
      "bookId quantity reorderLevel"
    );
    const stockByBookId = new Map(stockEntries.map((stock) => [String(stock.bookId), stock]));

    const serializedBooks = books.map((book) => {
      const stock = stockByBookId.get(String(book._id));
      return serializeBookForResponse(book, req.user, stock);
    });

    const totalBooks = await Book.countDocuments();

    res.json({
      books: serializedBooks,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("createdBy", "username profileImage")
      .populate("categoryId", "name description image");
    if (!book) return res.status(404).json({ message: "Book not found" });

    const stock = await Stock.findOne({ bookId: book._id }).select("quantity reorderLevel");

    res.json(serializeBookForResponse(book, req.user, stock));
  } catch (error) {
    console.log("Error getting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createBook = async (req, res) => {
  try {
    const { title, author, description, image, price, category, categoryId, stockQuantity, lowStockThreshold } = req.body;

    const parsedTitle = getTrimmedNonEmptyString(title);
    const parsedAuthor = getTrimmedNonEmptyString(author);
    const parsedDescription = getTrimmedNonEmptyString(description);

    if (!parsedTitle || !parsedAuthor || !parsedDescription || !image) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    if (!isValidImageInput(image)) {
      return res.status(400).json({ message: "Please provide a valid image" });
    }

    if (!isCloudinaryConfigured) {
      return res.status(500).json({ message: "Cloudinary is not configured on server" });
    }

    let parsedPrice = null;
    if (price !== undefined && price !== null && price !== "") {
      parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: "Price must be a non-negative number" });
      }
    }

    let parsedStockQuantity;
    if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== "") {
      parsedStockQuantity = parseNonNegativeInteger(stockQuantity, "Stock quantity");
    }

    let parsedLowStockThreshold;
    if (lowStockThreshold !== undefined && lowStockThreshold !== null && lowStockThreshold !== "") {
      parsedLowStockThreshold = parseNonNegativeInteger(lowStockThreshold, "Low stock threshold");
    }

    const resolvedCategory = await resolveCategoryPayload({ category, categoryId });

    const uploadResponse = await cloudinary.uploader.upload(image);

    const newBook = new Book({
      title: parsedTitle,
      author: parsedAuthor,
      description: parsedDescription,
      price: parsedPrice,
      image: uploadResponse.secure_url,
      category: resolvedCategory.categoryName || "",
      categoryId: resolvedCategory.categoryId || null,
      stockQuantity: parsedStockQuantity,
      lowStockThreshold: parsedLowStockThreshold,
      createdBy: req.user._id,
    });

    await newBook.save();

    // Only create stock entry if stock quantity is provided
    if (parsedStockQuantity !== undefined || parsedLowStockThreshold !== undefined) {
      await Stock.findOneAndUpdate(
        { bookId: newBook._id },
        {
          $set: {
            quantity: parsedStockQuantity || 0,
            reorderLevel: parsedLowStockThreshold || 0,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    const stock = await Stock.findOne({ bookId: newBook._id }).select("quantity reorderLevel");
    res.status(201).json(serializeBookForResponse(newBook, req.user, stock));
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }

    console.log("Error creating book", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { title, author, description, image, price, category, categoryId, stockQuantity, lowStockThreshold } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (typeof title === "string") {
      const trimmedTitle = getTrimmedNonEmptyString(title);
      if (!trimmedTitle) return res.status(400).json({ message: "Title cannot be empty" });
      book.title = trimmedTitle;
    }

    if (typeof author === "string") {
      const trimmedAuthor = getTrimmedNonEmptyString(author);
      if (!trimmedAuthor) return res.status(400).json({ message: "Author cannot be empty" });
      book.author = trimmedAuthor;
    }

    if (typeof description === "string") {
      const trimmedDescription = getTrimmedNonEmptyString(description);
      if (!trimmedDescription) return res.status(400).json({ message: "Description cannot be empty" });
      book.description = trimmedDescription;
    }

    if (price !== undefined) {
      if (price === null || price === "") {
        book.price = null;
      } else {
        const parsedPrice = Number(price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({ message: "Price must be a non-negative number" });
        }

        book.price = parsedPrice;
      }
    }

    if (stockQuantity !== undefined) {
      if (stockQuantity === null || stockQuantity === "") {
        return res.status(400).json({ message: "Stock quantity must be a non-negative integer" });
      }

      book.stockQuantity = parseNonNegativeInteger(stockQuantity, "Stock quantity");
    }

    if (lowStockThreshold !== undefined) {
      if (lowStockThreshold === null || lowStockThreshold === "") {
        return res.status(400).json({ message: "Low stock threshold must be a non-negative integer" });
      }

      book.lowStockThreshold = parseNonNegativeInteger(lowStockThreshold, "Low stock threshold");
    }

    const resolvedCategory = await resolveCategoryPayload({ category, categoryId, allowClear: true });
    if (resolvedCategory.provided) {
      if (resolvedCategory.clear) {
        book.category = "";
        book.categoryId = null;
      } else {
        book.category = resolvedCategory.categoryName;
        book.categoryId = resolvedCategory.categoryId;
      }
    }

    if (image) {
      if (!isValidImageInput(image)) {
        return res.status(400).json({ message: "Please provide a valid image" });
      }

      if (!isCloudinaryConfigured) {
        return res.status(500).json({ message: "Cloudinary is not configured on server" });
      }

      if (book.image && book.image.includes("cloudinary")) {
        try {
          const publicId = book.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.log("Error deleting old image from cloudinary", deleteError);
        }
      }

      const uploadResponse = await cloudinary.uploader.upload(image);
      book.image = uploadResponse.secure_url;
    }

    await book.save();

    // Only update stock entry if stock quantities are provided in the request
    if (stockQuantity !== undefined || lowStockThreshold !== undefined) {
      await Stock.findOneAndUpdate(
        { bookId: book._id },
        {
          $set: {
            quantity: book.stockQuantity,
            reorderLevel: book.lowStockThreshold,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    const stock = await Stock.findOne({ bookId: book._id }).select("quantity reorderLevel");
    res.json(serializeBookForResponse(book, req.user, stock));
  } catch (error) {
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }

    console.log("Error updating book", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await Stock.deleteOne({ bookId: book._id });
    await book.deleteOne();
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error deleting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
};