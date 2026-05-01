const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getSubcategories,
  getMainCategories,
  getCategoryTree
} = require('../controllers/categoryController');

// Routes
router.post('/', createCategory);
router.get('/', getAllCategories);
router.get('/main', getMainCategories);
router.get('/tree', getCategoryTree);
router.get('/subcategories/:parentId', getSubcategories);
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;