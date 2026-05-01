const express = require("express");
const router = express.Router();
const {
  getAllInventory,
  getStockByBook,
  createInventory,
  addStock,
  deductStock,
  restoreStock,
  getLowStockAlerts,
  deleteInventory,
} = require("../controllers/inventoryController");

// No auth for testing
router.get("/", getAllInventory);
router.get("/alerts/low", getLowStockAlerts);
router.get("/:bookId", getStockByBook);
router.post("/", createInventory);
router.patch("/:bookId/add", addStock);
router.patch("/:bookId/deduct", deductStock);
router.patch("/:bookId/restore", restoreStock);
router.delete("/:bookId", deleteInventory);

module.exports = router;