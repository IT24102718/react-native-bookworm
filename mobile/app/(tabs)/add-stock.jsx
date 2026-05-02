import { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";
import styles from "../../assets/styles/addStock.styles";

export default function AddStockScreen() {
  const router = useRouter();
  const { user, token, isCheckingAuth } = useAuthStore();

  const [books, setBooks] = useState([]);
  const [stockedBookIds, setStockedBookIds] = useState(new Set());
  const [selectedBookId, setSelectedBookId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = useMemo(() => Boolean(user?.isAdmin), [user]);
  const handleGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace("/stock");
  };

  const fetchBooksAndStock = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);

        const [booksResponse, stockResponse] = await Promise.all([
          fetch(`${API_URL}/books`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/stock?page=1&limit=500`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const booksData = await booksResponse.json();
        const stockData = await stockResponse.json();

        if (!booksResponse.ok) {
          throw new Error(booksData.message || "Failed to load books");
        }

        if (!stockResponse.ok) {
          throw new Error(stockData.message || "Failed to load existing stock");
        }

        const allBooks = Array.isArray(booksData?.books) ? booksData.books : [];
        const stockBooks = Array.isArray(stockData?.books) ? stockData.books : [];

        setBooks(allBooks);
        setStockedBookIds(
          new Set(
            stockBooks
              .filter((item) => item?.hasStockEntry === true)
              .map((item) => String(item?._id || ""))
          )
        );
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to load stock setup data");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      if (!token || !isAdmin) {
        setLoading(false);
        return;
      }
      fetchBooksAndStock();
    }, [token, isAdmin, fetchBooksAndStock])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBooksAndStock({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;

    return books.filter((book) => {
      const title = String(book?.title || "").toLowerCase();
      const author = String(book?.author || "").toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }, [books, searchQuery]);

  const selectedBook = useMemo(
    () => books.find((book) => String(book?._id) === selectedBookId),
    [books, selectedBookId]
  );

  const handleCreateStock = async () => {
    const normalizedBookId = String(selectedBookId || "").trim();
    const normalizedQuantity = String(quantity || "").trim();
    const normalizedReorderLevel = String(reorderLevel || "").trim();
    const normalizedSupplierName = String(supplierName || "").trim();

    if (!normalizedBookId) {
      Alert.alert("Validation Error", "Please select a book");
      return;
    }

    if (stockedBookIds.has(normalizedBookId)) {
      Alert.alert("Validation Error", "Stock already exists for the selected book");
      return;
    }

    const parsedQuantity = Number(normalizedQuantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      Alert.alert("Validation Error", "Quantity must be a non-negative integer");
      return;
    }

    const parsedReorderLevel = Number(normalizedReorderLevel);
    if (!Number.isInteger(parsedReorderLevel) || parsedReorderLevel < 0) {
      Alert.alert("Validation Error", "Reorder level must be a non-negative integer");
      return;
    }

    if (!normalizedSupplierName) {
      Alert.alert("Validation Error", "Supplier name is required");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/stock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: normalizedBookId,
          quantity: parsedQuantity,
          reorderLevel: parsedReorderLevel,
          supplierName: normalizedSupplierName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create stock");
      }

      Alert.alert("Success", "Stock created successfully", [
        {
          text: "OK",
          onPress: handleGoBack,
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create stock");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBookItem = ({ item }) => {
    const itemId = String(item?._id || "");
    const isAlreadyStocked = stockedBookIds.has(itemId);
    const isSelected = selectedBookId === itemId;

    return (
      <TouchableOpacity
        style={[
          styles.bookItem,
          isSelected && styles.bookItemSelected,
          isAlreadyStocked && styles.bookItemDisabled,
        ]}
        disabled={isAlreadyStocked}
        onPress={() => setSelectedBookId(itemId)}
      >
        <View style={styles.bookTextWrap}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item?.title || "Untitled"}
          </Text>
          <Text style={styles.bookMeta} numberOfLines={1}>
            {item?.author || "Unknown Author"}
          </Text>
        </View>
        {isAlreadyStocked ? <Text style={styles.badgeText}>Stocked</Text> : null}
      </TouchableOpacity>
    );
  };

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)" />;
  if (!isAdmin) return <Redirect href="/profile" />;
  if (loading && !refreshing) return <Loader />;

  return (
    <GradientBackground>
      <View style={styles.container}>
        <FlatList
          data={filteredBooks}
        keyExtractor={(item) => String(item?._id || "")}
        renderItem={renderBookItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.formCard}>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
              onPress={handleGoBack}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>{"<"} Back</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>Add Stock Entry</Text>
            <Text style={styles.subheading}>Admin only</Text>

            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search books by title or author"
              placeholderTextColor={COLORS.placeholderText}
              autoCapitalize="none"
            />

            <View style={styles.selectedCard}>
              <Text style={styles.selectedLabel}>Selected Book</Text>
              <Text style={styles.selectedValue} numberOfLines={2}>
                {selectedBook
                  ? `${selectedBook.title || "Untitled"} - ${selectedBook.author || "Unknown Author"}`
                  : "No book selected"}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              placeholder="Quantity"
              placeholderTextColor={COLORS.placeholderText}
            />

            <TextInput
              style={styles.input}
              value={reorderLevel}
              onChangeText={setReorderLevel}
              keyboardType="number-pad"
              placeholder="Reorder level"
              placeholderTextColor={COLORS.placeholderText}
            />

            <TextInput
              style={styles.input}
              value={supplierName}
              onChangeText={setSupplierName}
              placeholder="Supplier name"
              placeholderTextColor={COLORS.placeholderText}
            />

            <TouchableOpacity
              style={[styles.createButton, submitting && styles.createButtonDisabled]}
              onPress={handleCreateStock}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.createButtonText}>Create Stock</Text>
              )}
            </TouchableOpacity>
          </View>
        }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No books found</Text>
            </View>
          }
        />
      </View>
    </GradientBackground>
  );
}
