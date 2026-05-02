import express from "express";
import { protectAdmin } from "../middleware/auth.middleware.js";
import {
  deleteUser,
  getUserById,
  getUsers,
  resetUserPassword,
  updateUserRole,
  updateUserStatus,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", protectAdmin, getUsers);
router.get("/:id", protectAdmin, getUserById);
router.patch("/:id/role", protectAdmin, updateUserRole);
router.patch("/:id/status", protectAdmin, updateUserStatus);
router.post("/:id/reset-password", protectAdmin, resetUserPassword);
router.delete("/:id", protectAdmin, deleteUser);

export default router;
