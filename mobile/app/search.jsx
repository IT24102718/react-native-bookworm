import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../constants/colors";
import { RADIUS, SHADOWS, SPACING } from "../constants/theme";
import { API_URL } from "../constants/api";
import { useAuthStore } from "../store/authStore";
import GradientBackground from "../components/GradientBackground";
import IconButton from "../components/IconButton";
import BookCard from "../components/BookCard";

const SORTS = [
  { id: "relevance", label: "Relevance", icon: "sparkles-outline" },
  { id: "price_asc", label: "Price: Low", icon: "arrow-up-outline" },
  { id: "price_desc", label: "Price: High", icon: "arrow-down-outline" },
  { id: "rating", label: "Top Rated", icon: "star-outline" },
];

function getNormalizedCategoryId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user, isCheckingAuth } = useAuthStore();

  const [query, setQuery] = useState(typeof params?.q === "string" ? params.q : "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [sortId, setSortId] = useState("relevance");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [booksRes, catsRes] = await Promise.all([
        fetch(`${API_URL}/books?page=1&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const booksData = await booksRes.json();
      const catsData = await catsRes.json();
      setBooks(booksRes.ok ? booksData.books || [] : []);
      setCategories(catsRes.ok ? (Array.isArray(catsData) ? catsData : []) : []);
    } catch (error) {
      console.log("Search fetch error", error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const filtered = useMemo(() => {
    let list = [...books];

    if (selectedCategoryId) {
      list = list.filter(
        (b) =>
          getNormalizedCategoryId(b.categoryId) ===
          getNormalizedCategoryId(selectedCategoryId)
      );
    }

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b?.title?.toLowerCase().includes(q) ||
          b?.author?.toLowerCase().includes(q)
      );
    }

    if (sortId === "price_asc") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortId === "price_desc") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortId === "rating") {
      list.sort(
        (a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0)
      );
    }

    return list;
  }, [books, selectedCategoryId, debouncedQuery, sortId]);

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)/onboarding" />;

  const renderItem = ({ item }) => (
    <View style={styles.gridItem}>
      <BookCard book={item} onPress={() => router.push(`/book/${item._id}`)} />
    </View>
  );

  return (
    <GradientBackground>
      <View style={styles.headerRow}>
        <IconButton
          name="arrow-back"
          onPress={() => router.back()}
          variant="soft"
        />
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors..."
            placeholderTextColor={COLORS.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus={!params?.q}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedCategoryId === "" && styles.chipActive,
          ]}
          onPress={() => setSelectedCategoryId("")}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.chipText,
              selectedCategoryId === "" && styles.chipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => {
          const categoryId = getNormalizedCategoryId(cat._id);
          const active =
            getNormalizedCategoryId(selectedCategoryId) === categoryId;
          return (
            <TouchableOpacity
              key={categoryId}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedCategoryId(active ? "" : categoryId)}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.chipText, active && styles.chipTextActive]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        {SORTS.map((s) => {
          const active = sortId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => setSortId(s.id)}
            >
              <Ionicons
                name={s.icon}
                size={13}
                color={active ? COLORS.white : COLORS.textSecondary}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.sortText, active && styles.sortTextActive]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.resultMeta}>
        <Text style={styles.resultMetaText}>
          {loading ? "Searching..." : `${filtered.length} result(s)`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="search"
                size={56}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>No books found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different keyword or clear filters
              </Text>
            </View>
          }
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    height: 46,
    ...SHADOWS.cardSoft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
  },
  chipRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    includeFontPadding: false,
    maxWidth: 110,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  sortRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    gap: 8,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sortChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  sortText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
    includeFontPadding: false,
  },
  sortTextActive: {
    color: COLORS.white,
  },
  resultMeta: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 4,
  },
  resultMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  gridContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
  row: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  gridItem: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
