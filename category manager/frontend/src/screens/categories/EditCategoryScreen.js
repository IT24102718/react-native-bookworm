import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { categoryAPI } from '../../api/categoryAPI';
import { COLORS } from '../../styles/colors';

const ICONS = ['📚', '📖', '🔬', '💻', '🎨', '🎵', '🏃', '🍳', '🌍', '❤️', '🚀', '💰', '🧪', '🎭', '🏆'];

export default function EditCategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [selectedIcon, setSelectedIcon] = useState(category.icon || '📚');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
      await categoryAPI.updateCategory(category._id, {
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
      });

      Alert.alert('Success', 'Category updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Category Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Fiction, Science, History"
          placeholderTextColor={COLORS.placeholderText}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe this category..."
          placeholderTextColor={COLORS.placeholderText}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Choose an Icon</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconSelected,
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconEmoji}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview:</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewIcon}>{selectedIcon}</Text>
            <View>
              <Text style={styles.previewName}>{name || 'Category Name'}</Text>
              <Text style={styles.previewDesc}>
                {description || 'Category description will appear here'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Update Category</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textDark,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  iconEmoji: {
    fontSize: 28,
  },
  previewContainer: {
    marginTop: 30,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  previewDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});