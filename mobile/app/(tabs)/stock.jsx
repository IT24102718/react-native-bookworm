import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";
import styles from "../../assets/styles/stock.styles";

export default function StockScreen() {
  const router = useRouter();
  const { user, token, isCheckingAuth } = useAuthStore();

  const [books, setBooks] = useState([]);
  const [lowStockBooks, setLowStockBooks] = useState([]);
  const [draftQuantities, setDraftQuantities] = useState({});
  const [draftThresholds, setDraftThresholds] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingBookId, setUpdatingBookId] = useState("");
  const [deletingBookId, setDeletingBookId] = useState("");
  const [editingBookId, setEditingBookId] = useState("");

  const isAdmin = useMemo(() => Boolean(user?.isAdmin), [user]);
  const handleGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace("/admin");
  };

  const fetchAllStock = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);

        const response = await fetch(`${API_URL}/stock?page=1&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load stock items");

        const stockBooks = Array.isArray(data?.books) ? data.books : [];
        setBooks(stockBooks);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to load stock items");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  const fetchLowStock = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/stock/alerts/low`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load low stock items");

      setLowStockBooks(Array.isArray(data?.books) ? data.books : []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load low stock items");
      setLowStockBooks([]);
    }
  }, [token]);

  const reloadAll = useCallback(
    async ({ silent = false } = {}) => {
      await Promise.all([fetchAllStock({ silent }), fetchLowStock()]);
    },
    [fetchAllStock, fetchLowStock]
  );

  useFocusEffect(
    useCallback(() => {
      if (!token || !isAdmin) {
        setLoading(false);
        return;
      }
      reloadAll();
    }, [token, isAdmin, reloadAll])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadAll({ silent: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDraftChange = (bookId, value) => {
    setDraftQuantities((prev) => ({
      ...prev,
      [bookId]: value,
    }));
  };

  const handleThresholdChange = (bookId, value) => {
    setDraftThresholds((prev) => ({
      ...prev,
      [bookId]: value,
    }));
  };

  const handleUpdateStock = async (book) => {
    const draftValue = draftQuantities[book._id];
    const normalizedValue = draftValue === undefined ? String(book.stockQuantity ?? "") : draftValue;
    const parsedQuantity = Number(normalizedValue);
    const thresholdDraftExists = Object.prototype.hasOwnProperty.call(draftThresholds, book._id);
    const normalizedThreshold = thresholdDraftExists
      ? String(draftThresholds[book._id] ?? "").trim()
      : "";

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      Alert.alert("Error", "Stock quantity must be a non-negative integer");
      return;
    }

    if (thresholdDraftExists && normalizedThreshold !== "") {
      const parsedThreshold = Number(normalizedThreshold);

      if (!Number.isInteger(parsedThreshold) || parsedThreshold < 0) {
        Alert.alert("Error", "Low stock threshold must be a non-negative integer");
        return;
      }
    }

    try {
      setUpdatingBookId(book._id);

      const payload = { stockQuantity: parsedQuantity };
      if (thresholdDraftExists && normalizedThreshold !== "") {
        payload.lowStockThreshold = Number(normalizedThreshold);
      }

      const response = await fetch(`${API_URL}/stock/${book._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update stock");

      setDraftQuantities((prev) => {
        const next = { ...prev };
        delete next[book._id];
        return next;
      });
      setDraftThresholds((prev) => {
        const next = { ...prev };
        delete next[book._id];
        return next;
      });
      setEditingBookId("");

      await reloadAll({ silent: true });

      Alert.alert("Success", "Stock updated successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update stock");
    } finally {
      setUpdatingBookId("");
    }
  };

  const handleDeleteStock = async (bookId) => {
    try {
      setDeletingBookId(bookId);

      const response = await fetch(`${API_URL}/stock/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete stock");

      await reloadAll({ silent: true });
      Alert.alert("Success", "Stock deleted successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete stock");
    } finally {
      setDeletingBookId("");
    }
  };

  const confirmDeleteStock = (bookId) => {
    Alert.alert("Delete Stock", "Are you sure you want to delete this stock entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteStock(bookId),
      },
    ]);
  };

  const startEditingStock = (book) => {
    setEditingBookId(book._id);
    setDraftQuantities((prev) => ({
      ...prev,
      [book._id]: prev[book._id] !== undefined ? prev[book._id] : String(book.stockQuantity ?? 0),
    }));
    setDraftThresholds((prev) => ({
      ...prev,
      [book._id]: prev[book._id] !== undefined ? prev[book._id] : String(book.lowStockThreshold ?? 5),
    }));
  };

  const cancelEditingStock = (bookId) => {
    setEditingBookId("");
    setDraftQuantities((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
    setDraftThresholds((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
  };

  const renderStockItem = ({ item }) => {
    const draftValue =
      draftQuantities[item._id] !== undefined
        ? draftQuantities[item._id]
        : String(item.stockQuantity ?? 0);
    const draftThreshold =
      draftThresholds[item._id] !== undefined
        ? draftThresholds[item._id]
        : "";
    const isEditing = editingBookId === item._id;

    return (
      <View style={styles.stockItem}>
        <View style={styles.stockInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.bookMeta} numberOfLines={1}>
            {item.author}
          </Text>
          <Text style={styles.bookMeta}>Status: {item.stockStatus || "unknown"}</Text>
          <Text style={styles.bookMeta}>Current Qty: {item.stockQuantity ?? 0}</Text>
          <Text style={styles.bookMeta}>Threshold: {item.lowStockThreshold ?? 5}</Text>
        </View>

        <View style={styles.stockActions}>
          {isEditing ? (
            <>
              <TextInput
                style={styles.qtyInput}
                value={draftValue}
                onChangeText={(value) => handleDraftChange(item._id, value)}
                keyboardType="number-pad"
                placeholder="Qty"
                placeholderTextColor={COLORS.placeholderText}
              />

              <TextInput
                style={styles.thresholdInput}
                value={draftThreshold}
                onChangeText={(value) => handleThresholdChange(item._id, value)}
                keyboardType="number-pad"
                placeholder="Threshold"
                placeholderTextColor={COLORS.placeholderText}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={() => handleUpdateStock(item)}
                  disabled={updatingBookId === item._id}
                >
                  {updatingBookId === item._id ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.updateButtonText}>Save</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelEditingStock(item._id)}
                  disabled={updatingBookId === item._id}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.editButton} onPress={() => startEditingStock(item)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDeleteStock(item._id)}
                disabled={deletingBookId === item._id}
              >
                {deletingBookId === item._id ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
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
          data={books}
          keyExtractor={(item) => item._id}
          renderItem={renderStockItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
              onPress={handleGoBack}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>{"<"} Back</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>Stock Management</Text>

            <TouchableOpacity style={styles.createButton} onPress={() => router.push("/add-stock")}>
              <Text style={styles.createButtonText}>Add Stock Entry</Text>
            </TouchableOpacity>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Low Stock Alerts</Text>
              {lowStockBooks.length > 0 ? (
                lowStockBooks.map((item) => (
                  <View key={item._id} style={styles.lowStockItem}>
                    <Text style={styles.lowStockTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.lowStockMeta} numberOfLines={1}>
                      Qty: {item.stockQuantity ?? 0} | Reorder: {typeof item.lowStockThreshold === "number" ? item.lowStockThreshold : "N/A"}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.summaryEmpty}>No low stock alerts right now.</Text>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Book Stock</Text>
              <Text style={styles.sectionCount}>{books.length}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stock items available</Text>
          </View>
        }
      />
      </View>
    </GradientBackground>
  );
}