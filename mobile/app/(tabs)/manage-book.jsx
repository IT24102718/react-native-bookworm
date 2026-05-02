import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";

import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";
import styles from "../../assets/styles/manageBook.styles";

const isValidMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(value);

export default function ManageBookScreen() {
  const { user, token, isCheckingAuth } = useAuthStore();
  const { bookId } = useLocalSearchParams();
  const router = useRouter();

  const rawBookId = Array.isArray(bookId) ? bookId[0] : bookId;
  const normalizedBookId =
    rawBookId !== undefined && rawBookId !== null ? String(rawBookId).trim() : "";
  const isEditMode = isValidMongoObjectId(normalizedBookId);

  const handleGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace("/admin");
  };

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [legacyCategoryName, setLegacyCategoryName] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  const [isFetchingBook, setIsFetchingBook] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setAuthor("");
    setDescription("");
    setPrice("");
    setSelectedCategoryId("");
    setCategoryTouched(false);
    setLegacyCategoryName("");
    setImageUri(null);
    setImageBase64(null);
  }, []);

  // Fetch categories function
  const fetchCategories = useCallback(async ({ silent = false } = {}) => {
    if (!token) {
      setIsFetchingCategories(false);
      return;
    }
    try {
      if (!silent) setIsFetchingCategories(true);
      const response = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load categories");
      const parsedCategories = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : [];
      setCategories(parsedCategories);
    } catch (error) {
      setCategories([]);
    } finally {
      if (!silent) setIsFetchingCategories(false);
    }
  }, [token]);

  // Hidden tab screens stay mounted — clear loaders; reset submit when leaving (avoids stuck spinner)
  useFocusEffect(
    useCallback(() => {
      if (!isEditMode) {
        resetForm();
        setIsFetchingBook(false);
      }
      return () => {
        setIsSubmitting(false);
      };
    }, [isEditMode, resetForm])
  );

  useEffect(() => {
    if (!isEditMode) {
      setIsFetchingBook(false);
    }
  }, [isEditMode]);

  // Reset form when adding a book; load categories for both add and edit
  useEffect(() => {
    if (!isEditMode) {
      resetForm();
    }
    fetchCategories({ silent: true });
  }, [isEditMode, fetchCategories, resetForm]);

  // Fetch existing book data in edit mode
  useEffect(() => {
    if (!isEditMode || !token) return;

    const fetchBook = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      try {
        setIsFetchingBook(true);
        const response = await fetch(`${API_URL}/books/${normalizedBookId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load book");

        setTitle(data.title || "");
        setAuthor(data.author || "");
        setDescription(data.description || "");
        setPrice(data.price === null || data.price === undefined ? "" : String(data.price));
        setLegacyCategoryName(data.category || "");
        if (typeof data.categoryId === "string") {
          setSelectedCategoryId(data.categoryId);
        } else if (data.categoryId && typeof data.categoryId === "object") {
          setSelectedCategoryId(data.categoryId._id || "");
        } else {
          setSelectedCategoryId("");
        }
        setCategoryTouched(false);
        setImageUri(data.image || null);
        setImageBase64(null);
      } catch (error) {
        const message =
          error?.name === "AbortError"
            ? "Loading took too long. Check your connection and try again."
            : error.message || "Failed to load book";
        Alert.alert("Error", message);
        handleGoBack();
      } finally {
        clearTimeout(timeoutId);
        setIsFetchingBook(false);
      }
    };

    fetchBook();
  }, [isEditMode, normalizedBookId, token, router]);

  // Auto-select category based on legacy name
  useEffect(() => {
    if (selectedCategoryId || !legacyCategoryName || categories.length === 0) return;
    const match = categories.find(
      (item) => item?.name?.toLowerCase?.() === legacyCategoryName.toLowerCase()
    );
    if (match?._id) {
      setSelectedCategoryId(match._id);
    }
  }, [categories, legacyCategoryName, selectedCategoryId]);

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Media access is required to pick an image");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });

      if (result.canceled) return;

      const selected = result.assets[0];
      setImageUri(selected.uri);

      if (selected.base64) {
        setImageBase64(selected.base64);
      } else {
        const base64 = await FileSystem.readAsStringAsync(selected.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setImageBase64(base64);
      }
    } catch (error) {
      Alert.alert("Error", "There was a problem selecting your image");
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle || !trimmedAuthor || !trimmedDescription) {
      Alert.alert("Error", "Please provide title, author and description");
      return;
    }

    if (!isEditMode && !imageBase64) {
      Alert.alert("Error", "Please select a book image");
      return;
    }

    const payload = {
      title: trimmedTitle,
      author: trimmedAuthor,
      description: trimmedDescription,
    };

    if (price.trim() !== "") {
      payload.price = price.trim();
    }

    if (categoryTouched) {
      if (selectedCategoryId) {
        payload.categoryId = selectedCategoryId;
      } else if (isEditMode) {
        payload.categoryId = null;
      }
    }

    if (!isEditMode || imageBase64) {
      const uriParts = imageUri?.split(".") || [];
      const extension = uriParts[uriParts.length - 1];
      const imageType = extension ? `image/${extension.toLowerCase()}` : "image/jpeg";
      payload.image = `data:${imageType};base64,${imageBase64}`;
    }

    const controller = new AbortController();
    let timeoutId;

    try {
      setIsSubmitting(true);
      timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        isEditMode ? `${API_URL}/books/${normalizedBookId}` : `${API_URL}/books`,
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save book");

      Alert.alert("Success", isEditMode ? "Book updated" : "Book created");
      if (!isEditMode) {
        resetForm();
      }

      handleGoBack();
    } catch (error) {
      const message =
        error?.name === "AbortError"
          ? "Request timed out. Please check your connection and try again."
          : error.message || "Failed to save book";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)" />;
  if (!user?.isAdmin) return <Redirect href="/profile" />;

  if (isFetchingBook) return <Loader />;

  return (
    <GradientBackground>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back-outline" size={18} color={COLORS.primary} />
            <Text style={{ marginLeft: 6, color: COLORS.primary, fontWeight: "600" }}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>{isEditMode ? "Edit Book" : "Add Book"}</Text>
          <Text style={styles.subtitle}>Manage your book catalog as admin</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              placeholderTextColor={COLORS.placeholderText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Author</Text>
            <TextInput
              style={styles.input}
              value={author}
              onChangeText={setAuthor}
              placeholder="Enter author"
              placeholderTextColor={COLORS.placeholderText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { minHeight: 10, height: undefined }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor={COLORS.placeholderText}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category (optional)</Text>

            {isFetchingCategories ? (
              <View style={styles.categoryLoadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.categoryHintText}>Loading categories...</Text>
              </View>
            ) : categories.length > 0 ? (
              <>
                <View style={styles.categoryListWrap}>
                  {[{ _id: "", name: "No category" }, ...categories].map((item) => {
                    const isSelected = selectedCategoryId === item._id;

                    return (
                      <TouchableOpacity
                        key={item._id || "none"}
                        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                        onPress={() => {
                          setCategoryTouched(true);
                          setSelectedCategoryId(item._id);
                        }}
                      >
                        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.categoryHintText}>
                  {selectedCategoryId
                    ? `Selected: ${categories.find((item) => item._id === selectedCategoryId)?.name || "Category"}`
                    : "No category selected"}
                </Text>
              </>
            ) : (
              <Text style={styles.categoryHintText}>
                Categories are unavailable right now. You can continue without selecting one.
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (optional)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="Enter price"
              placeholderTextColor={COLORS.placeholderText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{isEditMode ? "Book Image" : "Upload Image"}</Text>
            {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color={COLORS.primary} />
              <Text style={styles.imageButtonText}>{imageUri ? "Change Image" : "Pick Image"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoBack}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? "Saving…" : "Uploading…"}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name={isEditMode ? "save-outline" : "cloud-upload-outline"}
                    size={18}
                    color={COLORS.white}
                  />
                  <Text style={styles.submitButtonText}>{isEditMode ? "Update" : "Create"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </GradientBackground>
  );
}
