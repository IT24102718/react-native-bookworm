import { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { GRADIENTS, RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import styles from "../../assets/styles/bookDetails.styles";
import Loader from "../../components/Loader";
import StarRating from "../../components/StarRating";
import GradientBackground from "../../components/GradientBackground";
import IconButton from "../../components/IconButton";
import PrimaryButton from "../../components/PrimaryButton";
import SectionHeader from "../../components/SectionHeader";
import BookCard from "../../components/BookCard";

export default function BookDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const normalizedId = Array.isArray(id) ? id[0] : id;
  const scrollViewRef = useRef(null);

  const { token, user, isCheckingAuth } = useAuthStore();
  const { addToCart } = useCartStore();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);
  const normalizedCurrentUserId = user?._id || user?.id || null;

  const getReviewOwnerId = (review) => {
    if (!review?.userId) return null;
    if (typeof review.userId === "string") return review.userId;
    return review.userId._id || review.userId.id || null;
  };

  const displayPrice = useMemo(() => {
    if (!book) return "N/A";
    if (book.price === null || book.price === undefined || book.price === "")
      return "N/A";
    return `Rs ${Number(book.price).toFixed(2)}`;
  }, [book]);

  const displayAverageRating = useMemo(() => {
    if (!reviewSummary) return "0.0";
    if (reviewSummary.averageRating === null || reviewSummary.averageRating === undefined)
      return "0.0";
    return Number(reviewSummary.averageRating).toFixed(1);
  }, [reviewSummary]);

  const displayCategory = useMemo(() => {
    if (!book) return "—";
    if (
      book.categoryId &&
      typeof book.categoryId === "object" &&
      book.categoryId.name
    ) {
      return book.categoryId.name;
    }
    return book.category || "—";
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
        { text: "Keep Browsing", onPress: () => {} },
        { text: "Go to Cart", onPress: () => router.push("/(tabs)/cart") },
      ]);
    } else {
      Alert.alert("Error", result.error || "Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!book) return;
    setIsAddingToCart(true);
    const result = await addToCart(book._id, 1);
    setIsAddingToCart(false);
    if (result.success) {
      router.push("/(tabs)/cart");
    } else {
      Alert.alert("Error", result.error || "Failed to add to cart");
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) return Alert.alert("Error", "Please select a rating");
    if (!reviewText.trim()) return Alert.alert("Error", "Please write a review");

    try {
      setIsSubmittingReview(true);
      const url = editingReviewId
        ? `${API_URL}/reviews/${editingReviewId}`
        : `${API_URL}/reviews`;
      const method = editingReviewId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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

      Alert.alert(
        "Success",
        editingReviewId ? "Review updated!" : "Review added!"
      );
      setRating(0);
      setReviewTitle("");
      setReviewText("");
      setEditingReviewId(null);
      fetchReviewSummary();
      fetchReviews();
      fetchCurrentUserReview();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setRating(review.rating);
    setReviewTitle(review.comment || "");
    setReviewText(review.reviewText || "");
    setEditingReviewId(review._id);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 600, animated: true });
    }, 100);
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert("Delete Review", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.message || "Failed to delete review");
            }
            Alert.alert("Success", "Review deleted");
            setEditingReviewId(null);
            setRating(0);
            setReviewTitle("");
            setReviewText("");
            setUserReview(null);
            fetchReviewSummary();
            fetchReviews();
            fetchCurrentUserReview();
          } catch (error) {
            Alert.alert("Error", error.message || "Failed to delete review");
          }
        },
      },
    ]);
  };

  const fetchBook = async () => {
    if (!token || !normalizedId) return;
    try {
      const response = await fetch(`${API_URL}/books/${normalizedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load book");
      setBook(data);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load book");
      router.back();
    }
  };

  const fetchReviewSummary = async () => {
    if (!normalizedId) return;
    try {
      const response = await fetch(
        `${API_URL}/reviews/book/${normalizedId}/summary`
      );
      const data = await response.json();
      if (response.ok) setReviewSummary(data);
    } catch (error) {
      console.log("review summary", error?.message);
    }
  };

  const fetchReviews = async () => {
    if (!normalizedId) return;
    try {
      const response = await fetch(
        `${API_URL}/reviews/book/${normalizedId}?limit=10`
      );
      const data = await response.json();
      if (response.ok) setReviews(data.reviews || []);
    } catch (error) {
      console.log("reviews", error?.message);
    }
  };

  const fetchCurrentUserReview = async () => {
    if (!normalizedId || !token || !normalizedCurrentUserId) {
      setUserReview(null);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/reviews/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setUserReview(null);
        return;
      }
      const existing = (data || []).find((r) => {
        const rid = typeof r.bookId === "string" ? r.bookId : r.bookId?._id;
        return rid?.toString() === normalizedId?.toString();
      });
      setUserReview(existing || null);
    } catch (error) {
      console.log("user review", error?.message);
      setUserReview(null);
    }
  };

  const fetchRecommendations = async (currentBook) => {
    if (!token || !currentBook) return;
    try {
      const response = await fetch(`${API_URL}/books?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return;
      const list = data.books || [];
      const targetCat =
        currentBook.categoryId?._id || currentBook.categoryId || null;
      const related = list.filter((b) => {
        if (b._id === currentBook._id) return false;
        if (!targetCat) return true;
        return (b.categoryId?._id || b.categoryId) === targetCat;
      });
      setRecommendations(related.slice(0, 8));
    } catch (error) {
      console.log("recommendations", error?.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBook();
      await fetchReviewSummary();
      await Promise.all([fetchReviews(), fetchCurrentUserReview()]);
      setLoading(false);
    };
    loadData();
  }, [token, normalizedId, normalizedCurrentUserId]);

  useEffect(() => {
    if (book) fetchRecommendations(book);
  }, [book?._id]);

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)/onboarding" />;
  if (loading) return <Loader />;
  if (!book) return null;

  const stockBadgeStyle =
    book.stockStatus === "out_of_stock"
      ? styles.stockBadgeOutOfStock
      : book.stockStatus === "low_stock"
      ? styles.stockBadgeLowStock
      : styles.stockBadgeInStock;
  const stockTextColor =
    book.stockStatus === "out_of_stock"
      ? styles.stockBadgeTextOut
      : book.stockStatus === "low_stock"
      ? styles.stockBadgeTextLow
      : null;

  const isDescLong = (book.description || "").length > 180;

  return (
    <View style={styles.container}>
      <GradientBackground colors={GRADIENTS.screen}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HERO */}
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.lightPrimary, COLORS.background]}
              style={styles.heroBackdrop}
            >
              <Image
                source={book.image}
                style={styles.heroBackdropImage}
                contentFit="cover"
                blurRadius={20}
              />
            </LinearGradient>

            <View style={styles.heroTopBar}>
              <IconButton
                name="arrow-back"
                onPress={() => router.back()}
                variant="soft"
              />
              <IconButton
                name="cart-outline"
                onPress={() => router.push("/(tabs)/cart")}
                variant="soft"
              />
            </View>

            <View style={styles.heroCoverWrap}>
              <View style={styles.heroCover}>
                <Image
                  source={book.image}
                  style={styles.heroCoverImage}
                  contentFit="cover"
                  transition={250}
                />
              </View>
            </View>
          </View>

          <View style={styles.contentBody}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>by {book.author}</Text>
            </View>

            <View style={styles.pricePillRow}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pricePill}
              >
                <Ionicons name="pricetag" size={14} color={COLORS.white} />
                <Text style={styles.pricePillText}>{displayPrice}</Text>
              </LinearGradient>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={18} color={COLORS.accent} />
                <Text style={styles.statValue}>{displayAverageRating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.statValue}>
                  {book.pages || book.totalPages || "—"}
                </Text>
                <Text style={styles.statLabel}>Pages</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="language" size={18} color={COLORS.primary} />
                <Text style={styles.statValue}>{book.language || "EN"}</Text>
                <Text style={styles.statLabel}>Language</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="people" size={18} color={COLORS.primary} />
                <Text style={styles.statValue}>
                  {reviewSummary?.totalReviews || 0}
                </Text>
                <Text style={styles.statLabel}>Readers</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, stockBadgeStyle]}>
                <Ionicons
                  name="cube-outline"
                  size={12}
                  color={
                    book.stockStatus === "out_of_stock"
                      ? COLORS.danger
                      : book.stockStatus === "low_stock"
                      ? COLORS.warning
                      : COLORS.primaryDark
                  }
                />
                <Text
                  style={[
                    styles.badgeText,
                    stockTextColor,
                  ]}
                >
                  {stockLabel.toUpperCase()}
                </Text>
              </View>
              <View style={styles.badge}>
                <Ionicons
                  name="bookmark-outline"
                  size={12}
                  color={COLORS.primaryDark}
                />
                <Text style={styles.badgeText}>{displayCategory}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>About this book</Text>
              <Text
                style={styles.description}
                numberOfLines={descExpanded ? undefined : 4}
              >
                {book.description || "No description available."}
              </Text>
              {isDescLong ? (
                <TouchableOpacity
                  style={styles.readMoreBtn}
                  onPress={() => setDescExpanded((v) => !v)}
                >
                  <Text style={styles.readMoreText}>
                    {descExpanded ? "Read less" : "Read more"}
                  </Text>
                  <Ionicons
                    name={descExpanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Recommendations */}
            {recommendations.length > 0 ? (
              <View style={[styles.sectionCard, { paddingHorizontal: 0 }]}>
                <View style={{ paddingHorizontal: SPACING.lg }}>
                  <SectionHeader
                    title="You might also like"
                    subtitle="Hand-picked for you"
                  />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.hScrollContent,
                    { paddingLeft: SPACING.lg },
                  ]}
                >
                  {recommendations.map((b) => (
                    <BookCard
                      key={b._id}
                      book={b}
                      width={150}
                      onPress={() => router.push(`/book/${b._id}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Reviews */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>

              <View style={styles.reviewSummaryCard}>
                <View style={styles.ratingBox}>
                  <Text style={styles.ratingValue}>{displayAverageRating}</Text>
                  <Text style={styles.ratingMax}>out of 5</Text>
                  <StarRating
                    rating={Math.round(Number(displayAverageRating))}
                    size={14}
                  />
                  <Text style={styles.reviewCountText}>
                    {reviewSummary?.totalReviews || 0} reviews
                  </Text>
                </View>

                <View style={styles.ratingBarsContainer}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewSummary?.ratingDistribution?.[star] || 0;
                    const total = reviewSummary?.totalReviews || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <View key={star} style={styles.ratingBar}>
                        <View style={styles.ratingLabelContainer}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons
                              name="star"
                              size={11}
                              color={COLORS.accent}
                            />
                            <Text style={styles.ratingLabel}>{star}</Text>
                          </View>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBar,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.ratingCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Write/Edit review */}
              {!userReview || editingReviewId ? (
                <View style={{ marginTop: SPACING.lg }}>
                  <Text style={styles.sectionTitle}>
                    {editingReviewId ? "Edit your review" : "Write a review"}
                  </Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Rating</Text>
                    <StarRating
                      rating={rating}
                      onRatingChange={setRating}
                      size={32}
                      interactive
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Title (optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Give your review a title"
                      placeholderTextColor={COLORS.placeholderText}
                      value={reviewTitle}
                      onChangeText={setReviewTitle}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Your review</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Share your thoughts..."
                      placeholderTextColor={COLORS.placeholderText}
                      value={reviewText}
                      onChangeText={setReviewText}
                      multiline
                      numberOfLines={5}
                    />
                  </View>

                  <PrimaryButton
                    title={editingReviewId ? "Update Review" : "Submit Review"}
                    icon={editingReviewId ? "pencil" : "send"}
                    iconPosition="right"
                    loading={isSubmittingReview}
                    onPress={handleSubmitReview}
                  />

                  {editingReviewId ? (
                    <PrimaryButton
                      title="Cancel"
                      variant="ghost"
                      style={{ marginTop: 8 }}
                      onPress={() => {
                        setRating(0);
                        setReviewTitle("");
                        setReviewText("");
                        setEditingReviewId(null);
                      }}
                    />
                  ) : null}
                </View>
              ) : (
                <View style={{ marginTop: SPACING.lg, gap: 10 }}>
                  <Text
                    style={{
                      color: COLORS.textSecondary,
                      fontSize: 13,
                      fontWeight: "500",
                    }}
                  >
                    You've already reviewed this book.
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <PrimaryButton
                      title="Edit"
                      icon="pencil"
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() => handleEditReview(userReview)}
                    />
                    <TouchableOpacity
                      style={[
                        innerStyles.dangerBtn,
                        { flex: 1 },
                      ]}
                      onPress={() => handleDeleteReview(userReview._id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={COLORS.danger}
                      />
                      <Text style={innerStyles.dangerBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {reviews.length > 0 ? (
                <View style={{ marginTop: SPACING.xl }}>
                  <Text style={styles.sectionTitle}>Recent Reviews</Text>
                  {reviews.map((review, index) => {
                    const ownerId = getReviewOwnerId(review);
                    const isOwn = Boolean(
                      normalizedCurrentUserId &&
                        ownerId &&
                        normalizedCurrentUserId.toString() === ownerId.toString()
                    );
                    const username = review.userId?.username || "Anonymous";
                    return (
                      <View
                        key={review._id || index}
                        style={styles.reviewItemCard}
                      >
                        <View style={styles.reviewItemHeader}>
                          <View style={styles.reviewerAvatar}>
                            <Text style={styles.reviewerAvatarText}>
                              {username.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.reviewerName} numberOfLines={1}>
                            {username}
                          </Text>
                          <View style={styles.reviewRatingPill}>
                            <Ionicons
                              name="star"
                              size={11}
                              color={COLORS.accent}
                            />
                            <Text style={styles.reviewRatingText}>
                              {review.rating}.0
                            </Text>
                          </View>
                        </View>

                        {review.comment ? (
                          <Text style={styles.reviewTitleText} numberOfLines={1}>
                            {review.comment}
                          </Text>
                        ) : null}

                        <Text style={styles.reviewBody}>
                          {review.reviewText || "No review content"}
                        </Text>

                        <View style={styles.reviewFooter}>
                          <Text style={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Text>
                          {isOwn ? (
                            <View style={styles.reviewActions}>
                              <TouchableOpacity
                                style={[
                                  styles.reviewActionPill,
                                  styles.reviewActionPillEdit,
                                ]}
                                onPress={() => handleEditReview(review)}
                              >
                                <Ionicons
                                  name="pencil-outline"
                                  size={11}
                                  color={COLORS.primary}
                                />
                                <Text
                                  style={[
                                    styles.reviewActionText,
                                    { color: COLORS.primary },
                                  ]}
                                >
                                  Edit
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.reviewActionPill,
                                  styles.reviewActionPillDelete,
                                ]}
                                onPress={() => handleDeleteReview(review._id)}
                              >
                                <Ionicons
                                  name="trash-outline"
                                  size={11}
                                  color={COLORS.danger}
                                />
                                <Text
                                  style={[
                                    styles.reviewActionText,
                                    { color: COLORS.danger },
                                  ]}
                                >
                                  Delete
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </GradientBackground>

      {/* STICKY BOTTOM BAR */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 4 },
        ]}
      >
        <View style={styles.bottomPriceWrap}>
          <Text style={styles.bottomPriceLabel}>Price</Text>
          <Text style={styles.bottomPrice}>{displayPrice}</Text>
        </View>
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.cartIconButton}
            onPress={handleAddToCart}
            disabled={book.stockStatus === "out_of_stock" || isAddingToCart}
            activeOpacity={0.85}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="cart-outline" size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>
          <PrimaryButton
            title={
              book.stockStatus === "out_of_stock" ? "Out of Stock" : "Buy Now"
            }
            icon="flash"
            iconPosition="right"
            disabled={book.stockStatus === "out_of_stock"}
            onPress={handleBuyNow}
            style={styles.buyNowButton}
            size="md"
          />
        </View>
      </View>
    </View>
  );
}

const innerStyles = StyleSheet.create({
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.danger,
    backgroundColor: "rgba(214, 69, 69, 0.06)",
  },
  dangerBtnText: {
    color: COLORS.danger,
    fontWeight: "800",
    fontSize: 14,
  },
});
