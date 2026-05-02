import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import styles from "../../assets/styles/bookDetails.styles";
import Loader from "../../components/Loader";
import StarRating from "../../components/StarRating";

export default function BookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  const { token, user, isCheckingAuth } = useAuthStore();
  const { addToCart, isLoading: isCartLoading } = useCartStore();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Review form states
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");

  const displayPrice = useMemo(() => {
    if (!book) return "N/A";
    if (book.price === null || book.price === undefined || book.price === "") return "N/A";
    return `Rs ${Number(book.price).toFixed(2)}`;
  }, [book]);

  const displayAverageRating = useMemo(() => {
    if (!reviewSummary) return "N/A";
    if (reviewSummary.averageRating === null || reviewSummary.averageRating === undefined)
      return "N/A";
    return Number(reviewSummary.averageRating).toFixed(1);
  }, [reviewSummary]);

  const displayCategory = useMemo(() => {
    if (!book) return "N/A";

    if (book.categoryId && typeof book.categoryId === "object" && book.categoryId.name) {
      return book.categoryId.name;
    }

    return book.category || "N/A";
  }, [book]);

  const stockLabel = useMemo(() => {
    if (!book) return "In Stock";

    if (book.stockStatus === "out_of_stock") return "Out of Stock";
    if (book.stockStatus === "low_stock") return "Low Stock";

    return "In Stock";
  }, [book]);

  const handleAddToCart = async () => {
    if (!book) return;

    setIsAddingToCart(true);
    const result = await addToCart(book._id, 1);
    setIsAddingToCart(false);

    if (result.success) {
      Alert.alert("Success", "Added to cart!", [
        {
          text: "Continue Shopping",
          onPress: () => {},
        },
        {
          text: "Go to Cart",
          onPress: () => router.push("/(tabs)/cart"),
        },
      ]);
    } else {
      Alert.alert("Error", result.error || "Failed to add to cart");
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert("Error", "Please write a review");
      return;
    }

    try {
      setIsSubmittingReview(true);

      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: normalizedId,
          rating,
          reviewText: reviewText.trim(),
          comment: reviewTitle.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit review");

      Alert.alert("Success", "Review submitted successfully!");

      // Reset form
      setRating(0);
      setReviewTitle("");
      setReviewText("");

      // Refresh reviews and summary
      fetchReviewSummary();
      fetchReviews();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchBook = async () => {
    if (!token || !normalizedId) return;

    try {
      const response = await fetch(`${API_URL}/books/${normalizedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load book details");

      setBook(data);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load book details");
      router.back();
    }
  };

  const fetchReviewSummary = async () => {
    if (!normalizedId) return;

    try {
      const response = await fetch(`${API_URL}/reviews/book/${normalizedId}/summary`);
      const data = await response.json();
      if (response.ok) {
        setReviewSummary(data);
      }
    } catch (error) {
      console.log("Error fetching review summary:", error.message);
    }
  };

  const fetchReviews = async () => {
    if (!normalizedId) return;

    try {
      const response = await fetch(`${API_URL}/reviews/book/${normalizedId}?limit=10`);
      const data = await response.json();
      if (response.ok) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.log("Error fetching reviews:", error.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBook();
      await fetchReviewSummary();
      await fetchReviews();
      setLoading(false);
    };

    loadData();
  }, [token, normalizedId, router]);

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)" />;

  if (loading) return <Loader />;
  if (!book) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back-outline" size={20} color={COLORS.primary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Book Details Card */}
      <View style={styles.detailsCard}>
        <View style={styles.detailsImageContainer}>
          <Image source={book.image} style={styles.bookImage} contentFit="cover" />
        </View>

        <Text style={styles.detailsTitle}>{book.title}</Text>
        <Text style={styles.metaText}>by {book.author}</Text>
        <Text style={styles.metaText}>{displayCategory}</Text>
        <Text style={styles.priceText}>{displayPrice}</Text>

        <View style={styles.stockBadgeContainer}>
          <View
            style={[
              styles.stockBadge,
              book.stockStatus === "out_of_stock"
                ? styles.stockBadgeOutOfStock
                : book.stockStatus === "low_stock"
                ? styles.stockBadgeLowStock
                : styles.stockBadgeInStock,
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                book.stockStatus === "out_of_stock"
                  ? styles.stockBadgeTextOutOfStock
                  : book.stockStatus === "low_stock"
                  ? styles.stockBadgeTextLowStock
                  : styles.stockBadgeTextInStock,
              ]}
            >
              {stockLabel.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.detailsDescription}>{book.description}</Text>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            book.stockStatus === "out_of_stock" && { opacity: 0.5 },
          ]}
          onPress={handleAddToCart}
          disabled={book.stockStatus === "out_of_stock" || isAddingToCart}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color={COLORS.white} />
              <Text style={styles.addToCartButtonText}>
                {book.stockStatus === "out_of_stock" ? "Out of Stock" : "Add to Cart"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Reviews Section */}
      <View style={styles.reviewsCard}>
        <Text style={styles.reviewsHeading}>Customer Reviews</Text>

        {/* Review Summary */}
        <View style={styles.reviewSummary}>
          <View style={styles.ratingBox}>
            <Text style={styles.ratingValue}>{displayAverageRating}</Text>
            <Text style={styles.ratingMax}>out of 5</Text>
            <StarRating rating={Math.round(Number(displayAverageRating))} size={20} />
            <Text style={styles.reviewCountText}>
              Based on {reviewSummary?.totalRatings || 0} reviews
            </Text>
          </View>

          <View style={styles.ratingBarsContainer}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviewSummary?.[`stars_${star}`] || 0;
              const total = reviewSummary?.totalRatings || 1;
              const percentage = (count / total) * 100;

              return (
                <View key={star} style={styles.ratingBar}>
                  <View style={styles.ratingLabelContainer}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name="star" size={14} color={COLORS.primary} />
                      <Text style={styles.ratingLabel}>{star}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBar, { width: `${percentage}%` }]}
                    />
                  </View>
                  <Text style={styles.ratingCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Write a Review Section */}
        <View style={styles.writeReviewSection}>
          <Text style={styles.writeReviewHeading}>Write a review</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Rating</Text>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size={36}
              interactive={true}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Review Title (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Give your review a title"
              placeholderTextColor={COLORS.placeholderText}
              value={reviewTitle}
              onChangeText={setReviewTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Review content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Start writing here..."
              placeholderTextColor={COLORS.placeholderText}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={5}
            />
          </View>

          <TouchableOpacity
            style={styles.submitReviewButton}
            onPress={handleSubmitReview}
            disabled={isSubmittingReview}
          >
            {isSubmittingReview ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color={COLORS.white} />
                <Text style={styles.submitReviewButtonText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing Reviews */}
        {reviews.length > 0 && (
          <View style={styles.existingReviewsSection}>
            <Text style={styles.existingReviewsHeading}>Recent Reviews</Text>
            {reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>
                    {review.userId?.username || "Anonymous"}
                  </Text>
                  <StarRating rating={review.rating} size={16} />
                </View>
                {review.comment && (
                  <Text style={styles.reviewTitle}>{review.comment}</Text>
                )}
                <Text style={styles.reviewContent}>{review.reviewText}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}
