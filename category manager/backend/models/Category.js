const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  icon: {
    type: String,
    default: '📚'
  },
  // New field for parent category (for subcategories)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  // Level: 0 = main category, 1 = subcategory, 2 = sub-subcategory
  level: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure name + parentId combination is unique
categorySchema.index({ name: 1, parentId: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);