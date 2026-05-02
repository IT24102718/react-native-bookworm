import { useCallback, useState } from "react";
import {
  View,
  Alert,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import COLORS from "../../constants/colors";
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import LogoutButton from "../../components/LogoutButton";
import GradientBackground from "../../components/GradientBackground";
import Loader from "../../components/Loader";
import { sleep } from ".";

export default function Profile() {
  const [books, setBooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState(null);

  const { token } = useAuthStore();
  const router = useRouter();

  const fetchData = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [booksResponse, reviewsResponse] = await Promise.all([
        fetch(`${API_URL}/recommendations/user`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/reviews/user`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const booksData = await booksResponse.json();
      if (!booksResponse.ok)
        throw new Error(booksData.message || "Failed to fetch user books");

      const reviewsData = await reviewsResponse.json();
      if (!reviewsResponse.ok)
        throw new Error(reviewsData.message || "Failed to fetch user reviews");

      setBooks(booksData);
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Failed to load profile data. Pull down to refresh."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [token])
  );

  const handleDeleteBook = async (bookId) => {
    try {
      setDeleteBookId(bookId);
      const response = await fetch(`${API_URL}/recommendations/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete");
      setBooks(books.filter((book) => book._id !== bookId));
      Alert.alert("Success", "Recommendation deleted");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete recommendation");
    } finally {
      setDeleteBookId(null);
    }
  };

  const confirmDelete = (bookId) => {
    Alert.alert("Delete Recommendation", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteBook(bookId),
      },
    ]);
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
            if (!response.ok) throw new Error("Failed to delete review");
            setReviews(reviews.filter((r) => r._id !== reviewId));
            Alert.alert("Success", "Review deleted");
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(400);
    await fetchData();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) return <Loader />;

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={13}
          color={i <= rating ? COLORS.accent : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <ProfileHeader />

        {/* Quick action grid */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickTile}
            activeOpacity={0.85}
            onPress={() => router.push("/orders")}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.quickTileTextWrap}>
              <Text style={styles.quickTileTitle}>My Orders</Text>
              <Text style={styles.quickTileSubtitle}>Track purchases</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            activeOpacity={0.85}
            onPress={() =>
              router.push({ pathname: "/create", params: { mode: "create" } })
            }
          >
            <View style={styles.quickIconWrap}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.quickTileTextWrap}>
              <Text style={styles.quickTileTitle}>Recommend</Text>
              <Text style={styles.quickTileSubtitle}>Add a book</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickTile}
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons
                name="cart-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View style={styles.quickTileTextWrap}>
              <Text style={styles.quickTileTitle}>My Cart</Text>
              <Text style={styles.quickTileSubtitle}>View basket</Text>
            </View>
          </TouchableOpacity>

          <LogoutButton />
        </View>

        {/* Recommendations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Recommendations</Text>
          <Text style={styles.sectionCount}>
            {books.length} book{books.length === 1 ? "" : "s"}
          </Text>
        </View>

        {books.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={44}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push({ pathname: "/create", params: { mode: "create" } })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.addButtonText}>Add Recommendation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          books.map((item) => (
            <View key={item._id} style={styles.bookItem}>
              <Image source={item.image} style={styles.bookImage} />
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.ratingContainer}>
                  {renderRatingStars(item.rating)}
                </View>
                <Text style={styles.bookCaption} numberOfLines={2}>
                  {item.caption}
                </Text>
                <Text style={styles.bookDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() =>
                    router.push({
                      pathname: "/create",
                      params: { bookId: item._id },
                    })
                  }
                >
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(item._id)}
                >
                  {deleteBookId === item._id ? (
                    <ActivityIndicator size="small" color={COLORS.danger} />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={COLORS.danger}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Reviews */}
        <View style={styles.reviewSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Reviews</Text>
            <Text style={styles.sectionCount}>
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </Text>
          </View>

          {reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={44}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((item) => {
              const bookTitle =
                item.bookId?.title || item.book?.title || "Unknown Book";
              const bookId = item.bookId?._id || item.bookId;
              return (
                <View key={item._id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <Text style={styles.reviewBookTitle} numberOfLines={1}>
                      {bookTitle}
                    </Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={11} color={COLORS.accent} />
                      <Text style={styles.ratingBadgeText}>
                        {item.rating}.0
                      </Text>
                    </View>
                  </View>
                  {item.comment ? (
                    <Text style={styles.reviewTitle} numberOfLines={1}>
                      {item.comment}
                    </Text>
                  ) : null}
                  <Text style={styles.reviewContent} numberOfLines={3}>
                    {item.reviewText || "No review content"}
                  </Text>
                  <View style={styles.reviewFooter}>
                    <Text style={styles.reviewDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={styles.reviewEditBtn}
                        onPress={() => router.push(`/book/${bookId}`)}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={11}
                          color={COLORS.primary}
                        />
                        <Text style={styles.reviewEditBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reviewEditBtn,
                          {
                            backgroundColor: "rgba(214, 69, 69, 0.10)",
                          },
                        ]}
                        onPress={() => handleDeleteReview(item._id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={11}
                          color={COLORS.danger}
                        />
                        <Text
                          style={[
                            styles.reviewEditBtnText,
                            { color: COLORS.danger },
                          ]}
                        >
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
