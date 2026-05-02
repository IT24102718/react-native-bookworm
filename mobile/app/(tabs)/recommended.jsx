import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL } from "../../constants/api";
import styles from "../../assets/styles/recommended.styles";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";
import { useAuthStore } from "../../store/authStore";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Recommended() {
  const { token } = useAuthStore();
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [mostReviewed, setMostReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const picksFocusPassRef = useRef(0);

  const fetchRecommendations = useCallback(async (refresh = false) => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const headers = { Authorization: `Bearer ${token}` };

      const [allRes, topRes, reviewedRes] = await Promise.all([
        fetch(`${API_URL}/recommendations?page=1&limit=50`, { headers }),
        fetch(`${API_URL}/recommendations/top-rated`, { headers }),
        fetch(`${API_URL}/recommendations/most-reviewed`, { headers }),
      ]);

      const allData = await allRes.json();
      const topData = await topRes.json();
      const reviewedData = await reviewedRes.json();

      if (!allRes.ok) {
        throw new Error(allData.message || "Failed to fetch recommendations");
      }

      setAllRecommendations(
        Array.isArray(allData?.books) ? allData.books : []
      );
      setTopRated(Array.isArray(topData) ? topData : []);
      setMostReviewed(Array.isArray(reviewedData) ? reviewedData : []);
    } catch (err) {
      setError(err.message || "Failed to fetch recommendations");
    } finally {
      if (refresh) {
        await sleep(400);
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setLoading(false);
        return;
      }
      picksFocusPassRef.current += 1;
      fetchRecommendations(picksFocusPassRef.current > 1);
    }, [token, fetchRecommendations])
  );

  const renderBookCard = (book) => (
    <View key={book._id} style={styles.bookRow}>
      <Image source={book.image} style={styles.bookImage} contentFit="cover" />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {book.title}
        </Text>
        {book.author ? (
          <Text style={styles.bookAuthor} numberOfLines={1}>
            by {book.author}
          </Text>
        ) : null}
        <View style={styles.bookMetaRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color={COLORS.accent} />
            <Text style={styles.ratingPillText}>
              {Number(book.averageRating || book.rating || 0).toFixed(1)}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" }}>
            {Number(book.totalReviews || 0)} reviews
          </Text>
        </View>
        {book.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            “{book.caption}”
          </Text>
        ) : null}
      </View>
    </View>
  );

  const sections = useMemo(
    () => [
      {
        key: "all-recommendations",
        title: "All Recommendations",
        data: allRecommendations,
      },
      { key: "top-rated", title: "Top Rated", data: topRated },
      { key: "most-reviewed", title: "Most Reviewed", data: mostReviewed },
    ],
    [allRecommendations, topRated, mostReviewed]
  );

  const isEmpty =
    allRecommendations.length === 0 &&
    topRated.length === 0 &&
    mostReviewed.length === 0;

  if (loading) return <Loader />;

  return (
    <GradientBackground>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchRecommendations(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Recommended</Text>
            <Text style={styles.headerSubtitle}>
              Top picks, most reviewed and community favorites
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            {item.data.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No books in this section.</Text>
              </View>
            ) : (
              item.data.map((book) => renderBookCard(book))
            )}
          </View>
        )}
        ListEmptyComponent={
          isEmpty ? (
            <View style={styles.bigEmpty}>
              <Ionicons
                name="book-outline"
                size={56}
                color={COLORS.textSecondary}
              />
              <Text style={styles.bigEmptyTitle}>No recommendations yet</Text>
              <Text style={styles.bigEmptySubtitle}>Try again in a moment.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          refreshing ? (
            <ActivityIndicator
              style={styles.footerLoader}
              size="small"
              color={COLORS.primary}
            />
          ) : null
        }
      />
    </GradientBackground>
  );
}
