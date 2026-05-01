import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity
} from 'react-native';

export default function AddBookScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

const validate = () => {
    let newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (!isbn.trim()) {
      newErrors.isbn = 'ISBN is required';
    } else if (isbn.trim().length < 10) {
      newErrors.isbn = 'ISBN must be at least 10 characters';
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(price) || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (stockQuantity && (isNaN(stockQuantity) || parseInt(stockQuantity) < 0)) {
      newErrors.stockQuantity = 'Stock cannot be negative';
    }

    if (description && description.trim().length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('author', author.trim());
      formData.append('isbn', isbn.trim());
      formData.append('price', price);
      formData.append('description', description.trim());
      formData.append('stockQuantity', stockQuantity || '0');

      if (image) {
        formData.append('coverImage', {
          uri: image.uri,
          type: 'image/jpeg',
          name: 'cover.jpg',
        });
      }

      const response = await fetch('http://172.23.239.125:5000/api/books', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        Alert.alert('Success', 'Book added successfully!');
        navigation.goBack();
      } else {
        const err = await response.json();
        Alert.alert('Error', err.message || 'Failed to add book');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.imagePickerText}>📷 Tap to add cover image</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={[styles.input, errors.title && styles.inputError]}
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (errors.title) setErrors({ ...errors, title: null });
        }}
        placeholder="Enter book title"
        placeholderTextColor="#767676"
      />
      {errors.title && <Text style={styles.errorText}>⚠️ {errors.title}</Text>}

      <Text style={styles.label}>Author *</Text>
      <TextInput
        style={[styles.input, errors.author && styles.inputError]}
        value={author}
        onChangeText={(text) => {
          setAuthor(text);
          if (errors.author) setErrors({ ...errors, author: null });
        }}
        placeholder="Enter author name"
        placeholderTextColor="#767676"
      />
      {errors.author && <Text style={styles.errorText}>⚠️ {errors.author}</Text>}

      <Text style={styles.label}>ISBN *</Text>
      <TextInput
        style={[styles.input, errors.isbn && styles.inputError]}
        value={isbn}
        onChangeText={(text) => {
          setIsbn(text);
          if (errors.isbn) setErrors({ ...errors, isbn: null });
        }}
        placeholder="Enter ISBN"
        placeholderTextColor="#767676"
      />
      {errors.isbn && <Text style={styles.errorText}>⚠️ {errors.isbn}</Text>}

      <Text style={styles.label}>Price (LKR) *</Text>
      <TextInput
        style={[styles.input, errors.price && styles.inputError]}
        value={price}
        onChangeText={(text) => {
          setPrice(text);
          if (errors.price) setErrors({ ...errors, price: null });
        }}
        placeholder="Enter price"
        placeholderTextColor="#767676"
        keyboardType="numeric"
      />
      {errors.price && <Text style={styles.errorText}>⚠️ {errors.price}</Text>}

      <Text style={styles.label}>Stock Quantity</Text>
      <TextInput
        style={[styles.input, errors.stockQuantity && styles.inputError]}
        value={stockQuantity}
        onChangeText={(text) => {
          setStockQuantity(text);
          if (errors.stockQuantity) setErrors({ ...errors, stockQuantity: null });
        }}
        placeholder="Enter stock quantity"
        placeholderTextColor="#767676"
        keyboardType="numeric"
      />
      {errors.stockQuantity && <Text style={styles.errorText}>⚠️ {errors.stockQuantity}</Text>}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea, errors.description && styles.inputError]}
        value={description}
        onChangeText={(text) => {
          setDescription(text);
          if (errors.description) setErrors({ ...errors, description: null });
        }}
        placeholder="Enter description (max 500 characters)"
        placeholderTextColor="#767676"
        multiline
        numberOfLines={4}
      />
      <Text style={styles.charCount}>{description.length}/500</Text>
      {errors.description && <Text style={styles.errorText}>⚠️ {errors.description}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Add Book</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f5e9', padding: 16 },
  imagePicker: {
    backgroundColor: '#f1f8f2', borderWidth: 1, borderColor: '#c8e6c9',
    borderRadius: 10, height: 200, justifyContent: 'center',
    alignItems: 'center', marginBottom: 8
  },
  imagePickerText: { color: '#688f68', fontSize: 16 },
  previewImage: { width: '100%', height: '100%', borderRadius: 10 },
  label: { fontSize: 14, color: '#2e5a2e', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f4faf5', borderWidth: 1, borderColor: '#c8e6c9',
    borderRadius: 8, padding: 12, fontSize: 15, color: '#1b361b'
  },
  inputError: { borderColor: '#e53935', borderWidth: 1.5 },
  errorText: { color: '#e53935', fontSize: 12, marginTop: 4 },
  charCount: { fontSize: 11, color: '#688f68', textAlign: 'right', marginTop: 4 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 24, marginBottom: 40
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
