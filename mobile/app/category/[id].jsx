import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";
import BookCard from "../../components/BookCard";
import IconButton from "../../components/IconButton";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function CategoryBooksScreen() {
  const { token, user, isCheckingAuth } = useAuthStore();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const categoryId = Array.isArray(id) ? id[0] : id;

  const [category, setCategory] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCategoryBooks = async (pageNum = 1, refresh = false) => {
    if (!token || !categoryId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 1) setLoading(true);

      const response = await fetch(
        `${API_URL}/categories/${categoryId}/books?page=${pageNum}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch category books");

      setCategory(data.category || null);
      const next = Array.isArray(data.books) ? data.books : [];
      const merged = refresh || pageNum === 1 ? next : [...books, ...next];
      const unique = Array.from(new Map(merged.map((b) => [b._id, b])).values());

      setBooks(unique);
      setHasMore(pageNum < (data.totalPages || 0));
      setPage(pageNum);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to fetch category books");
    } finally {
      if (refresh) {
        await sleep(400);
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCategoryBooks();
  }, [token, categoryId]);

  const handleRefresh = async () => {
    await fetchCategoryBooks(1, true);
  };

  const handleLoadMore = async () => {
    if (hasMore && !loading && !refreshing) {
      await fetchCategoryBooks(page + 1);
    }
  };

  const title = useMemo(() => category?.name || "Category", [category]);

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)/onboarding" />;
  if (loading) return <Loader />;

  return (
    <GradientBackground>
      <View style={styles.headerRow}>
        <IconButton name="arrow-back" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.subheading}>{books.length} title(s)</Text>
        </View>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <BookCard
              book={item}
              onPress={() => router.push(`/book/${item._id}`)}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          hasMore && books.length > 0 ? (
            <ActivityIndicator
              style={{ marginVertical: 20 }}
              size="small"
              color={COLORS.primary}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="library-outline"
              size={56}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No books in this category</Text>
            <Text style={styles.emptySubtitle}>
              Try another category from Home
            </Text>
          </View>
        }
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  heading: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  gridContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 130,
  },
  row: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  gridItem: {
    flex: 1,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
