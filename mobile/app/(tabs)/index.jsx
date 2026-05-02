import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import styles from "../../assets/styles/home.styles";

import GradientBackground from "../../components/GradientBackground";
import IconButton from "../../components/IconButton";
import PromoBanner from "../../components/PromoBanner";
import SectionHeader from "../../components/SectionHeader";
import BookCard from "../../components/BookCard";
import Loader from "../../components/Loader";

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CATEGORY_ICONS = {
  novel: "book-outline",
  fiction: "book-outline",
  education: "school-outline",
  science: "flask-outline",
  history: "library-outline",
  romance: "heart-outline",
  biography: "person-outline",
  children: "happy-outline",
  business: "briefcase-outline",
  technology: "hardware-chip-outline",
  health: "fitness-outline",
};

function getCategoryIcon(name = "") {
  const key = name.toLowerCase().trim();
  if (CATEGORY_ICONS[key]) return CATEGORY_ICONS[key];
  for (const k of Object.keys(CATEGORY_ICONS)) {
    if (key.includes(k)) return CATEGORY_ICONS[k];
  }
  return "bookmark-outline";
}

function getNormalizedCategoryId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

export default function Home() {
  const { token, user } = useAuthStore();
  const router = useRouter();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const homeFocusPassRef = useRef(0);

  const fetchBooks = useCallback(
    async (pageNum = 1, refresh = false) => {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      try {
        if (refresh) setRefreshing(true);
        else if (pageNum === 1) setLoading(true);

        const response = await fetch(`${API_URL}/books?page=${pageNum}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch books");

        setBooks((prev) => {
          const merged =
            refresh || pageNum === 1 ? data.books : [...prev, ...data.books];
          return Array.from(new Map(merged.map((b) => [b._id, b])).values());
        });
        setHasMore(pageNum < data.totalPages);
        setPage(pageNum);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to fetch books");
      } finally {
        if (refresh) {
          await sleep(600);
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [token]
  );

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("category fetch", error?.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setLoading(false);
        return;
      }
      homeFocusPassRef.current += 1;
      const isFirstFocus = homeFocusPassRef.current === 1;
      fetchBooks(1, !isFirstFocus);
      fetchCategories();
    }, [token, fetchBooks, fetchCategories])
  );

  const handleRefresh = async () => {
    await Promise.all([fetchBooks(1, true), fetchCategories()]);
  };

  const filteredBooks = useMemo(() => {
    if (!selectedCategoryId) return books;
    return books.filter(
      (b) =>
        getNormalizedCategoryId(b.categoryId) ===
        getNormalizedCategoryId(selectedCategoryId)
    );
  }, [books, selectedCategoryId]);

  const bestsellers = useMemo(() => {
    return [...books]
      .sort(
        (a, b) =>
          (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0)
      )
      .slice(0, 8);
  }, [books]);

  const newArrivals = useMemo(() => {
    return [...books]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 8);
  }, [books]);

  if (loading) return <Loader />;

  const username = user?.username || "Reader";
  const initial = username.charAt(0).toUpperCase();

  const renderBookCardH = ({ item }) => (
    <BookCard
      book={item}
      width={160}
      onPress={() => router.push(`/book/${item._id}`)}
    />
  );

  const gridChunks = [];
  for (let i = 0; i < filteredBooks.length; i += 2) {
    gridChunks.push(filteredBooks.slice(i, i + 2));
  }

  return (
    <GradientBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onScrollEndDrag={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          if (
            contentOffset.y + layoutMeasurement.height >=
              contentSize.height - 100 &&
            hasMore &&
            !loading
          ) {
            fetchBooks(page + 1);
          }
        }}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.greetingRow}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{initial}</Text>
              </View>
            )}
            <View style={styles.greetingTextWrap}>
              <Text style={styles.greetingHello}>Hello,</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {username} 👋
              </Text>
            </View>
          </View>
          <View style={styles.topActions}>
            <IconButton
              name="search-outline"
              onPress={() => router.push("/search")}
            />
            <IconButton
              name="cart-outline"
              onPress={() => router.push("/(tabs)/cart")}
            />
          </View>
        </View>

        {/* Promo banner */}
        <View style={styles.bannerWrap}>
          <PromoBanner
            title="Book Sale"
            highlight="50% OFF"
            subtitle="Bestsellers, new arrivals, and more"
            ctaLabel="Shop Now"
            onPress={() => router.push("/search")}
          />
        </View>

        {/* Categories */}
        {categories.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionPadding}>
              <SectionHeader
                title="Browse Categories"
                subtitle="Pick your genre"
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  !selectedCategoryId && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategoryId("")}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    !selectedCategoryId && styles.categoryIconCircleActive,
                  ]}
                >
                  <Ionicons
                    name="apps-outline"
                    size={20}
                    color={!selectedCategoryId ? COLORS.white : COLORS.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryName,
                    !selectedCategoryId && styles.categoryNameActive,
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
                    style={[
                      styles.categoryCard,
                      active && styles.categoryCardActive,
                    ]}
                    onPress={() => setSelectedCategoryId(active ? "" : categoryId)}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.categoryIconCircle,
                        active && styles.categoryIconCircleActive,
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(cat.name)}
                        size={20}
                        color={active ? COLORS.white : COLORS.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        active && styles.categoryNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Bestsellers */}
        {bestsellers.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionPadding}>
              <SectionHeader
                title="Bestsellers"
                subtitle="Top picks loved by readers"
                actionLabel="See all"
                onActionPress={() => router.push("/search")}
              />
            </View>
            <FlatList
              data={bestsellers}
              keyExtractor={(item) => `best-${item._id}`}
              renderItem={renderBookCardH}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            />
          </View>
        ) : null}

        {/* New arrivals */}
        {newArrivals.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionPadding}>
              <SectionHeader
                title="New Arrivals"
                subtitle="Fresh on our shelves"
                actionLabel="See all"
                onActionPress={() => router.push("/search")}
              />
            </View>
            <FlatList
              data={newArrivals}
              keyExtractor={(item) => `new-${item._id}`}
              renderItem={renderBookCardH}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            />
          </View>
        ) : null}

        {/* All books grid */}
        <View style={styles.section}>
          <View style={styles.sectionPadding}>
            <SectionHeader
              title={selectedCategoryId ? "Filtered Books" : "All Books"}
              subtitle={`${filteredBooks.length} title(s)`}
            />
          </View>

          {selectedCategoryId ? (
            <TouchableOpacity
              style={styles.filterClearRow}
              onPress={() => setSelectedCategoryId("")}
            >
              <Ionicons
                name="close-circle"
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.filterClearText}>Clear category filter</Text>
            </TouchableOpacity>
          ) : null}

          {gridChunks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="book-outline"
                size={56}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>No books available</Text>
              <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
            </View>
          ) : (
            gridChunks.map((pair, idx) => (
              <View key={idx} style={styles.gridRow}>
                {pair.map((book) => (
                  <View key={book._id} style={styles.gridItem}>
                    <BookCard
                      book={book}
                      onPress={() => router.push(`/book/${book._id}`)}
                    />
                  </View>
                ))}
                {pair.length === 1 ? <View style={styles.gridItem} /> : null}
              </View>
            ))
          )}

          {hasMore ? (
            <View style={styles.loaderInline}>
              <ActivityIndicator color={COLORS.primary} size="small" />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
