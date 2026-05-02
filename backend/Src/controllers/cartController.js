import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import Stock from "../models/Stock.js";
import { validateBookStockForRequest } from "../lib/stockValidation.js";
import { getStockStatus } from "../lib/stockValidation.js";

const createValidationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const serializeBookForCartResponse = (book, stock = null) => {
  const bookData = book.toObject ? book.toObject() : { ...book };

  const stockQuantity = stock ? stock.quantity : bookData.stockQuantity;
  const lowStockThreshold = stock ? stock.reorderLevel : bookData.lowStockThreshold;
  const stockStatus = getStockStatus(stockQuantity, lowStockThreshold);

  // Return only mobile-friendly fields for cart responses
  return {
    _id: bookData._id,
    title: bookData.title,
    author: bookData.author,
    image: bookData.image,
    price: bookData.price,
    category: bookData.category,
    stockStatus: stockStatus,
  };
};

export const addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body || {};
    const userId = req.user._id;

    // Validate bookId
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Valid bookId is required" });
    }

    // Validate quantity is positive integer
    const normalizedQuantity = Number(quantity);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    // Validate stock availability
    const { book, stockRecord } = await validateBookStockForRequest(bookId, normalizedQuantity, {
      requireStockRecord: false,
    });

    // Get or create cart
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Find existing item in cart
    const existingItem = cart.items.find(
      (item) => item.bookId.toString() === bookId
    );

    if (existingItem) {
      // Update quantity if item already in cart
      const newQuantity = existingItem.quantity + normalizedQuantity;

      // Validate new total quantity against stock
      const { availableStock } = await validateBookStockForRequest(bookId, newQuantity, {
        requireStockRecord: false,
      });

      existingItem.quantity = newQuantity;
    } else {
      // Add new item to cart
      cart.items.push({ bookId, quantity: normalizedQuantity });
    }

    await cart.save();

    // Populate full cart response with book details
    const populatedCart = await Cart.findById(cart._id).populate("items.bookId");

    // Serialize books with stock status
    const enrichedItems = await Promise.all(
      populatedCart.items.map(async (item) => {
        const stock = await Stock.findOne({ bookId: item.bookId._id }).select(
          "quantity reorderLevel"
        );
        return {
          ...item.toObject(),
          bookId: serializeBookForCartResponse(item.bookId, stock),
        };
      })
    );

    res.status(201).json({
      message: "Item added to cart successfully",
      cart: {
        _id: populatedCart._id,
        userId: populatedCart.userId,
        items: enrichedItems,
        createdAt: populatedCart.createdAt,
        updatedAt: populatedCart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to add item to cart" });
  }
};

export const getMyCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate("items.bookId");

    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: {
          userId,
          items: [],
        },
      });
    }

    // Serialize books with stock status
    const enrichedItems = await Promise.all(
      cart.items.map(async (item) => {
        const stock = await Stock.findOne({ bookId: item.bookId._id }).select(
          "quantity reorderLevel"
        );
        return {
          ...item.toObject(),
          bookId: serializeBookForCartResponse(item.bookId, stock),
        };
      })
    );

    res.status(200).json({
      message: "Cart retrieved successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: enrichedItems,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error.message);
    res.status(500).json({ message: "Failed to retrieve cart" });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { quantity } = req.body || {};
    const userId = req.user._id;

    // Validate bookId
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Valid bookId is required" });
    }

    // Validate quantity is positive integer
    const normalizedQuantity = Number(quantity);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    // Validate stock availability for new quantity
    await validateBookStockForRequest(bookId, normalizedQuantity, {
      requireStockRecord: false,
    });

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find item in cart
    const item = cart.items.find((item) => item.bookId.toString() === bookId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Update quantity
    item.quantity = normalizedQuantity;
    await cart.save();

    // Populate full cart response
    const populatedCart = await Cart.findById(cart._id).populate("items.bookId");

    const enrichedItems = await Promise.all(
      populatedCart.items.map(async (item) => {
        const stock = await Stock.findOne({ bookId: item.bookId._id }).select(
          "quantity reorderLevel"
        );
        return {
          ...item.toObject(),
          bookId: serializeBookForCartResponse(item.bookId, stock),
        };
      })
    );

    res.status(200).json({
      message: "Cart item quantity updated successfully",
      cart: {
        _id: populatedCart._id,
        userId: populatedCart.userId,
        items: enrichedItems,
        createdAt: populatedCart.createdAt,
        updatedAt: populatedCart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update cart item error:", error.message);

    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res.status(500).json({ message: "Failed to update cart item" });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user._id;

    // Validate bookId
    if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({ message: "Valid bookId is required" });
    }

    // Find user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if item exists
    const itemIndex = cart.items.findIndex((item) => item.bookId.toString() === bookId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate full cart response
    const populatedCart = await Cart.findById(cart._id).populate("items.bookId");

    const enrichedItems = await Promise.all(
      populatedCart.items.map(async (item) => {
        const stock = await Stock.findOne({ bookId: item.bookId._id }).select(
          "quantity reorderLevel"
        );
        return {
          ...item.toObject(),
          bookId: serializeBookForCartResponse(item.bookId, stock),
        };
      })
    );

    res.status(200).json({
      message: "Item removed from cart successfully",
      cart: {
        _id: populatedCart._id,
        userId: populatedCart.userId,
        items: enrichedItems,
        createdAt: populatedCart.createdAt,
        updatedAt: populatedCart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Remove cart item error:", error.message);
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Clear all items
    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart: {
        _id: cart._id,
        userId: cart.userId,
        items: [],
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};
