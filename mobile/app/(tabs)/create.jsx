import { useEffect, useState } from "react";
import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import styles from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { API_URL } from "../../constants/api";
import GradientBackground from "../../components/GradientBackground";

export default function Create() {
  const { bookId, mode } = useLocalSearchParams();
  const normalizedBookId = Array.isArray(bookId) ? bookId[0] : bookId;
  const normalizedMode = Array.isArray(mode) ? mode[0] : mode;
  const isEditMode = !!normalizedBookId && normalizedMode !== "create";

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(3);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFetchingBook, setIsFetchingBook] = useState(false);

  const router = useRouter();
  const { token, user, isCheckingAuth } = useAuthStore();
  const handleGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace("/profile");
  };

  useEffect(() => {
    const fetchBookForEdit = async () => {
      if (!isEditMode) return;

      try {
        setIsFetchingBook(true);
        const response = await fetch(`${API_URL}/recommendations/${normalizedBookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load recommendation");

        setTitle(data.title || "");
        setCaption(data.caption || "");
        setRating(Number(data.rating) || 3);
        setImage(data.image || null);
        setImageBase64(null);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to load recommendation");
        router.push("/profile");
      } finally {
        setIsFetchingBook(false);
      }
    };

    fetchBookForEdit();
  }, [isEditMode, normalizedBookId, router, token]);

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "We need camera roll permissions to upload an image");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);

        if (result.assets[0].base64) {
          setImageBase64(result.assets[0].base64);
        } else {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(base64);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was a problem selecting your image");
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedCaption = caption.trim();

    if (!trimmedTitle || !trimmedCaption || !rating) {
      Alert.alert("Error", "Please provide title, caption and rating");
      return;
    }

    if (!isEditMode && !imageBase64) {
      Alert.alert("Error", "Please select a book image");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: trimmedTitle,
        caption: trimmedCaption,
        rating: rating.toString(),
      };

      if (!isEditMode || imageBase64) {
        const uriParts = image?.split(".") || [];
        const fileType = uriParts[uriParts.length - 1];
        const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";
        payload.image = `data:${imageType};base64,${imageBase64}`;
      }

      const response = await fetch(
        isEditMode ? `${API_URL}/recommendations/${normalizedBookId}` : `${API_URL}/recommendations`,
        {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert(
        "Success",
        isEditMode
          ? "Your recommendation has been updated!"
          : "Your book recommendation has been posted!"
      );

      if (isEditMode) {
        handleGoBack();
        return;
      }

      setTitle("");
      setCaption("");
      setRating(3);
      setImage(null);
      setImageBase64(null);
      handleGoBack();
    } catch (error) {
      console.error("Error submitting recommendation:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starButton}>
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  if (isEditMode && isFetchingBook) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)" />;

  return (
    <GradientBackground>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
        <View style={styles.card}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back-outline" size={18} color={COLORS.primary} />
            <Text style={{ marginLeft: 6, color: COLORS.primary, fontWeight: "600" }}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditMode ? "Edit Book Recommendation" : "Add Book Recommendation"}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode
                ? "Update your recommendation details"
                : "Share your favorite reads with others"}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter book title"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Your Rating</Text>
              {renderRatingPicker()}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{isEditMode ? "Book Image (optional)" : "Book Image"}</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.placeholderText}>
                      {isEditMode ? "Tap to replace image" : "Tap to select image"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your review or thoughts about this book..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading || isFetchingBook}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name={isEditMode ? "save-outline" : "cloud-upload-outline"}
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>{isEditMode ? "Update" : "Share"}</Text>
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