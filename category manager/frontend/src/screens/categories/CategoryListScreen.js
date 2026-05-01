import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { categoryAPI } from '../../api/categoryAPI';
import { COLORS } from '../../styles/colors';

export default function CategoryListScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAllCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryAPI.deleteCategory(id);
              fetchCategories();
              Alert.alert('Success', 'Category deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }) => (
    <View style={styles.categoryCard}>
      <TouchableOpacity
        style={styles.categoryInfo}
        onPress={() => navigation.navigate('CategoryDetail', { category: item })}
      >
        <Text style={styles.categoryIcon}>{item.icon || '📚'}</Text>
        <View style={styles.categoryText}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate('EditCategory', { category: item })}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item._id, item.name)}
        >
          <Text style={styles.buttonText}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && categories.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddCategory')}
      >
        <Text style={styles.addButtonText}>+ Add New Category</Text>
      </TouchableOpacity>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories yet.</Text>
            <Text style={styles.emptySubText}>Tap "+ Add New Category" to create one!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
  list: {
    paddingBottom: 20,
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
  categoryIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  categoryText: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.placeholderText,
  },
});