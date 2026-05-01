const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');

// All routes are public - no authentication middleware
router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/cancel', cancelOrder);
router.delete('/:id', deleteOrder);

module.exports = router;