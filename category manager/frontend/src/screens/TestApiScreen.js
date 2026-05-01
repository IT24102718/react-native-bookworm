import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';

const COLORS = {
  primary: "#4CAF50",
  textPrimary: "#2e5a2e",
  textSecondary: "#688f68",
  textDark: "#1b361b",
  placeholderText: "#767676",
  background: "#e8f5e9",
  cardBackground: "#f1f8f2",
  inputBackground: "#f4faf5",
  border: "#c8e6c9",
  white: "#ffffff",
  black: "#000000",
};

const API_URL = 'http://192.168.8.132:5000/api';

export default function TestApiScreen() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [parentId, setParentId] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [showParentPicker, setShowParentPicker] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editParentId, setEditParentId] = useState('');

  // Get all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data.data || []);
      setHierarchy(data.hierarchy || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render category with children (recursive)
  const renderCategoryItem = (item, level = 0) => {
    const isExpanded = expandedCategories[item._id];
    const hasChildren = item.children && item.children.length > 0;
    const paddingLeft = level * 20;
    
    return (
      <View key={item._id}>
        <View style={[styles.categoryCard, { marginLeft: paddingLeft }]}>
          <TouchableOpacity
            style={styles.categoryInfo}
            onPress={() => openEditModal(item)}
          >
            {hasChildren && (
              <TouchableOpacity onPress={() => toggleExpand(item._id)}>
                <Text style={styles.expandIcon}>
                  {isExpanded ? '📂' : '📁'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.categoryIcon}>{item.icon || '📚'}</Text>
            <View style={styles.categoryText}>
              <Text style={styles.categoryName}>
                {item.name}
                {item.level === 0 && <Text style={styles.mainBadge}> Main</Text>}
                {item.level === 1 && <Text style={styles.subBadge}> Sub</Text>}
              </Text>
              <Text style={styles.categoryDesc} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditModal(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteCategory(item._id, item.name)}
            >
              <Text style={styles.deleteButtonText}>Del</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {hasChildren && isExpanded && (
          <View>
            {item.children.map(child => renderCategoryItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  // Create a new category
  const createCategory = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter category name');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter description');
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        icon: icon,
      };
      
      if (parentId) {
        body.parentId = parentId;
      }
      
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Category created!');
        resetForm();
        fetchCategories();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update a category
  const updateCategory = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter category name');
      return;
    }
    if (!editDescription.trim()) {
      Alert.alert('Error', 'Please enter description');
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: editName.trim(),
        description: editDescription.trim(),
        icon: editIcon,
      };
      
      if (editParentId) {
        body.parentId = editParentId;
      } else if (editParentId === '') {
        body.parentId = null;
      }
      
      const response = await fetch(`${API_URL}/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('Success', 'Category updated!');
        setEditModalVisible(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a category
  const deleteCategory = async (id, name) => {
    const subcategories = categories.filter(cat => cat.parentId === id);
    const warning = subcategories.length > 0 
      ? `This will also delete ${subcategories.length} subcategory(s). Continue?`
      : 'Are you sure?';
      
    Alert.alert(
      'Delete Category',
      `Delete "${name}"? ${warning}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Success', data.message);
                fetchCategories();
              } else {
                Alert.alert('Error', data.message);
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('📚');
    setParentId('');
    setSelectedParent(null);
    setShowAddForm(false);
  };

  // Open edit modal
  const openEditModal = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditDescription(category.description);
    setEditIcon(category.icon || '📚');
    setEditParentId(category.parentId || '');
    setEditModalVisible(true);
  };

  // Get parent name for display
  const getParentName = () => {
    if (!parentId) return 'None (Main Category)';
    const parent = categories.find(c => c._id === parentId);
    return parent ? parent.name : 'None';
  };

  // Search/filter
  const filteredHierarchy = () => {
    if (!searchText) return hierarchy;
    
    const filterRecursive = (items) => {
      return items.filter(item => {
        const matches = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                       item.description.toLowerCase().includes(searchText.toLowerCase());
        const matchingChildren = filterRecursive(item.children || []);
        return matches || matchingChildren.length > 0;
      }).map(item => ({
        ...item,
        children: filterRecursive(item.children || [])
      }));
    };
    
    return filterRecursive(hierarchy);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📚 Category Manager</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search categories..."
          placeholderTextColor={COLORS.placeholderText}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchText('')}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Category Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <Text style={styles.addButtonText}>
          {showAddForm ? 'Cancel' : '+ Add New Category'}
        </Text>
      </TouchableOpacity>

      {/* Add Category Form */}
      {showAddForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>New Category</Text>
          
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Literature, Novel"
            value={name}
            onChangeText={setName}
          />
          
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe this category..."
            value={description}
            onChangeText={setDescription}
            multiline
          />
          
          <Text style={styles.label}>Parent Category</Text>
          <TouchableOpacity 
            style={styles.pickerButton}
            onPress={() => setShowParentPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {getParentName()}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.label}>Icon (emoji)</Text>
          <TextInput
            style={styles.input}
            placeholder="📚"
            value={icon}
            onChangeText={setIcon}
            maxLength={2}
          />
          
          <TouchableOpacity style={styles.submitButton} onPress={createCategory}>
            <Text style={styles.submitButtonText}>Create Category</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Parent Picker Modal */}
      <Modal
        visible={showParentPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Parent Category</Text>
            
            <TouchableOpacity 
              style={styles.parentOption}
              onPress={() => {
                setParentId('');
                setSelectedParent(null);
                setShowParentPicker(false);
              }}
            >
              <Text style={styles.parentOptionText}>None (Main Category)</Text>
            </TouchableOpacity>
            
            {categories.filter(c => c.level === 0).map(cat => (
              <TouchableOpacity 
                key={cat._id}
                style={styles.parentOption}
                onPress={() => {
                  setParentId(cat._id);
                  setSelectedParent(cat);
                  setShowParentPicker(false);
                }}
              >
                <Text style={styles.parentOptionText}>
                  {cat.icon} {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowParentPicker(false)}
            >
              <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchCategories}>
        <Text style={styles.refreshButtonText}>🔄 Refresh List</Text>
      </TouchableOpacity>

      {/* Categories List */}
      {loading && categories.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : filteredHierarchy().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>
            {searchText ? 'No matching categories' : 'No categories yet'}
          </Text>
          <Text style={styles.emptySubText}>
            {searchText ? 'Try a different search' : 'Tap "+ Add New Category" to create one!'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.countText}>
            Total: {categories.length} categories
          </Text>
          {filteredHierarchy().map(item => renderCategoryItem(item))}
        </>
      )}

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Category</Text>
            
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
            />
            
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            
            <Text style={styles.label}>Icon (emoji)</Text>
            <TextInput
              style={styles.input}
              value={editIcon}
              onChangeText={setEditIcon}
              maxLength={2}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={updateCategory}
              >
                <Text style={styles.saveModalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    backgroundColor: COLORS.border,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: COLORS.textSecondary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: COLORS.cardBackground,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerButtonText: {
    color: COLORS.textDark,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  mainBadge: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'normal',
  },
  subBadge: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: 'normal',
  },
  categoryDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.placeholderText,
    textAlign: 'center',
  },
  countText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 20,
  },
  parentOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  parentOptionText: {
    fontSize: 16,
    color: COLORS.textDark,
  },
  closeModalButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: COLORS.textDark,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelModalButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveModalButton: {
    backgroundColor: COLORS.primary,
  },
  saveModalButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});