import mongoose from "mongoose";
import Category from "../models/Category.js";
import Book from "../models/Book.js";

const getTrimmedNonEmptyString = (value) => {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
};

const getOptionalTrimmedString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return "";
  if (typeof value !== "string") return null;

  return value.trim();
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

const ensureAdmin = (req, res) => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }

  return true;
};

export const createCategory = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const parsedName = getTrimmedNonEmptyString(req.body?.name);
    if (!parsedName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const parsedDescription = getOptionalTrimmedString(req.body?.description);
    if (parsedDescription === null) {
      return res.status(400).json({ message: "Description must be a string" });
    }

    const parsedImage = getOptionalTrimmedString(req.body?.image);
    if (parsedImage === null) {
      return res.status(400).json({ message: "Image must be a string" });
    }

    const existingCategory = await findCategoryByNameCaseInsensitive(parsedName);
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({
      name: parsedName,
      description: parsedDescription === undefined ? "" : parsedDescription,
      image: parsedImage === undefined ? "" : parsedImage,
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }

    console.log("Error creating category", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.log("Error getting categories", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.log("Error getting category", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (req.body?.name !== undefined) {
      const parsedName = getTrimmedNonEmptyString(req.body.name);
      if (!parsedName) {
        return res.status(400).json({ message: "Category name cannot be empty" });
      }

      const existingCategory = await findCategoryByNameCaseInsensitive(parsedName);
      if (existingCategory && existingCategory._id.toString() !== category._id.toString()) {
        return res.status(400).json({ message: "Category already exists" });
      }

      category.name = parsedName;
    }

    if (req.body?.description !== undefined) {
      const parsedDescription = getOptionalTrimmedString(req.body.description);
      if (parsedDescription === null) {
        return res.status(400).json({ message: "Description must be a string" });
      }

      category.description = parsedDescription;
    }

    if (req.body?.image !== undefined) {
      const parsedImage = getOptionalTrimmedString(req.body.image);
      if (parsedImage === null) {
        return res.status(400).json({ message: "Image must be a string" });
      }

      category.image = parsedImage;
    }

    await category.save();
    res.json(category);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }

    console.log("Error updating category", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.log("Error deleting category", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBooksByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category id" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [books, totalBooks] = await Promise.all([
      Book.find({ categoryId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "username profileImage")
        .populate("categoryId", "name description image"),
      Book.countDocuments({ categoryId: id }),
    ]);

    res.json({
      category,
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error getting books by category", error);
    res.status(500).json({ message: "Internal server error" });
  }
};