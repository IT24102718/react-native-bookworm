const Category = require('../models/Category');

// Create a new category (with optional parent)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, parentId } = req.body;

    // Check if category with same name exists under same parent
    const query = { 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      parentId: parentId || null
    };
    
    const existingCategory = await Category.findOne(query);
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists under this parent'
      });
    }

    // Determine level
    let level = 0;
    if (parentId) {
      const parent = await Category.findById(parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    const category = await Category.create({
      name,
      description,
      icon: icon || '📚',
      parentId: parentId || null,
      level
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all categories (with hierarchy)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ level: 1, name: 1 });
    
    // Build hierarchy
    const buildHierarchy = (items, parentId = null) => {
      return items
        .filter(item => {
          if (parentId === null) {
            return !item.parentId;
          }
          return item.parentId && item.parentId.toString() === parentId.toString();
        })
        .map(item => ({
          ...item.toObject(),
          children: buildHierarchy(items, item._id)
        }));
    };

    const hierarchy = buildHierarchy(categories);

    res.json({
      success: true,
      count: categories.length,
      data: categories,
      hierarchy: hierarchy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get categories by parent (get subcategories)
exports.getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    const subcategories = await Category.find({ parentId: parentId }).sort({ name: 1 });
    
    res.json({
      success: true,
      count: subcategories.length,
      data: subcategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get main categories (parent = null)
exports.getMainCategories = async (req, res) => {
  try {
    const mainCategories = await Category.find({ parentId: null }).sort({ name: 1 });
    
    res.json({
      success: true,
      count: mainCategories.length,
      data: mainCategories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single category by ID (with its children)
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get children
    const children = await Category.find({ parentId: category._id }).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        children
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, icon, parentId } = req.body;
    
    // Check if trying to set parent to itself
    if (parentId === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set a category as its own parent'
      });
    }
    
    // Check if name conflicts with another category under same parent
    if (name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        parentId: parentId || null,
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Another category with this name already exists under this parent'
        });
      }
    }

    // Calculate new level if parent changed
    let level;
    if (parentId !== undefined) {
      if (parentId) {
        const parent = await Category.findById(parentId);
        level = parent ? parent.level + 1 : 0;
      } else {
        level = 0;
      }
    }

    const updateData = { name, description, icon };
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (level !== undefined) updateData.level = level;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete category (and its subcategories)
exports.deleteCategory = async (req, res) => {
  try {
    // Find all subcategories
    const subcategories = await Category.find({ parentId: req.params.id });
    
    // Delete all subcategories first
    for (const sub of subcategories) {
      await Category.findByIdAndDelete(sub._id);
    }
    
    // Delete the main category
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: `Category and ${subcategories.length} subcategory(s) deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get category tree (full hierarchy)
exports.getCategoryTree = async (req, res) => {
  try {
    const allCategories = await Category.find().sort({ level: 1, name: 1 });
    
    const buildTree = (parentId = null) => {
      return allCategories
        .filter(cat => {
          if (parentId === null) return !cat.parentId;
          return cat.parentId && cat.parentId.toString() === parentId.toString();
        })
        .map(cat => ({
          ...cat.toObject(),
          children: buildTree(cat._id)
        }));
    };

    const tree = buildTree();

    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};