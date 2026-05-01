const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update/:bookId', updateCartItem);
router.delete('/remove/:bookId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;