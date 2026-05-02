import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";
import styles from "../../assets/styles/admin.styles";

export default function AdminBooksScreen() {
  const router = useRouter();
  const { user, token, isCheckingAuth } = useAuthStore();

  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isAdmin = useMemo(() => Boolean(user?.isAdmin), [user]);
  const handleGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace("/admin");
  };

  const fetchBooks = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setIsLoading(true);

        const response = await fetch(`${API_URL}/books`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load books");

        setBooks(Array.isArray(data?.books) ? data.books : []);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to load books");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      if (!token || !isAdmin) {
        setIsLoading(false);
        return;
      }
      fetchBooks();
    }, [token, isAdmin, fetchBooks])
  );

  const handleDelete = async (bookId) => {
    try {
      setDeletingId(bookId);

      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete book");

      setBooks((prevBooks) => prevBooks.filter((book) => book._id !== bookId));
      await fetchBooks({ silent: true });
      Alert.alert("Success", data.message || "Book deleted successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete book");
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (bookId) => {
    Alert.alert("Delete Book", "Are you sure you want to delete this book?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDelete(bookId),
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBooks({ silent: true });
    setRefreshing(false);
  };

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)" />;
  if (!isAdmin) return <Redirect href="/profile" />;

  if (isLoading && !refreshing) return <Loader />;

  const renderBookItem = ({ item }) => {
    const stockLabel =
      item.stockStatus === "out_of_stock"
        ? "Out of Stock"
        : item.stockStatus === "low_stock"
        ? "Low Stock"
        : "In Stock";

    return (
      <View style={styles.bookItem}>
        <Image source={item.image} style={styles.bookImage} />

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.bookMeta} numberOfLines={1}>
            {item.author}
          </Text>
          <Text style={styles.bookMeta} numberOfLines={1}>
            {(item.categoryId && typeof item.categoryId === "object" && item.categoryId.name) ||
              item.category ||
              "Uncategorized"}
          </Text>
          <Text style={styles.bookMeta} numberOfLines={1}>
            Stock: {stockLabel}
          </Text>
          {typeof item.stockQuantity === "number" ? (
            <Text style={styles.bookMeta} numberOfLines={1}>
              Qty: {item.stockQuantity}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push({ pathname: "/manage-book", params: { bookId: item._id } })}
          >
            <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => confirmDelete(item._id)}>
            {deletingId === item._id ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <FlatList
          data={books}
        keyExtractor={(item) => item._id}
        renderItem={renderBookItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                onPress={handleGoBack}
              >
                <Text style={{ color: COLORS.primary, fontWeight: "600" }}>{"<"} Back</Text>
              </TouchableOpacity>
              <Text style={styles.heading}>Current Books</Text>
              <Text style={styles.subheading}>Review, edit, and remove book listings.</Text>
            </View>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{books.length}</Text>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="library-outline" size={50} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No books available</Text>
            </View>
          }
        />
      </View>
    </GradientBackground>
  );
}
