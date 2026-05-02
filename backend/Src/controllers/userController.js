import mongoose from "mongoose";
import User from "../models/User.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const generateTempPassword = (length = 10) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";

  for (let i = 0; i < length; i += 1) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  return password;
};

const ensureValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const cannotModifySelf = (req, targetId) => req.user?._id?.toString() === targetId;

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    const filter = {};
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ username: regex }, { email: regex }];
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("username email profileImage isAdmin isActive address createdAt updatedAt deactivatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.log("Error getting users", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get user by id (admin)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select(
      "username email profileImage isAdmin isActive address createdAt updatedAt deactivatedAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.log("Error getting user", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update user role (admin)
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (cannotModifySelf(req, id)) {
      return res.status(400).json({ message: "You cannot change your own admin role" });
    }

    const parsedIsAdmin = parseBoolean(req.body?.isAdmin);
    if (parsedIsAdmin === null) {
      return res.status(400).json({ message: "isAdmin must be a boolean" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isAdmin = parsedIsAdmin;
    await user.save();

    res.json({
      message: parsedIsAdmin ? "User promoted to admin" : "Admin role removed",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deactivatedAt: user.deactivatedAt,
      },
    });
  } catch (error) {
    console.log("Error updating user role", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update user status (admin)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (cannotModifySelf(req, id)) {
      return res.status(400).json({ message: "You cannot change your own status" });
    }

    const parsedIsActive = parseBoolean(req.body?.isActive);
    if (parsedIsActive === null) {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = parsedIsActive;
    user.deactivatedAt = parsedIsActive ? null : new Date();
    await user.save();

    res.json({
      message: parsedIsActive ? "User reactivated" : "User deactivated",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        address: user.address,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deactivatedAt: user.deactivatedAt,
      },
    });
  } catch (error) {
    console.log("Error updating user status", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (cannotModifySelf(req, id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error deleting user", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Reset user password (admin)
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ensureValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (cannotModifySelf(req, id)) {
      return res.status(400).json({ message: "You cannot reset your own password here" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const temporaryPassword = generateTempPassword();
    user.password = temporaryPassword;
    await user.save();

    res.json({
      message: "Password reset successfully",
      temporaryPassword,
    });
  } catch (error) {
    console.log("Error resetting user password", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
