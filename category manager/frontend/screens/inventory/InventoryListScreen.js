import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";

const COLORS = {
  primary: "#4CAF50",
  textPrimary: "#2e5a2e",
  textSecondary: "#688f68",
  textDark: "#1b361b",
  placeholderText: "#767676",
  background: "#e8f5e9",
  cardBackground: "#f1f8f2",
  inputBackground: "#f4faf5",
  border: "#c8e6c9",
  white: "#ffffff",
  black: "#000000",
};

export default function InventoryListScreen({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      inventory.filter((i) =>
        i.bookId?.title?.toLowerCase().includes(q) ||
        i.bookId?.author?.toLowerCase().includes(q)
      )
    );
  }, [search, inventory]);

  const onRefresh = () => { setRefreshing(true); fetchInventory(); };

  const renderItem = ({ item }) => {
    const isLow = item.quantity <= item.lowStockThreshold;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("InventoryDetail", {
            bookId: item.bookId?._id,
            title: item.bookId?.title,
          })
        }
      >
        <View style={styles.cardLeft}>
          <Text style={styles.bookTitle}>{item.bookId?.title || "Unknown Book"}</Text>
          <Text style={styles.bookAuthor}>{item.bookId?.author || ""}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.quantity, isLow && styles.quantityLow]}>
            {item.quantity}
          </Text>
          <Text style={styles.copies}>copies</Text>
          {isLow && (
            <View style={styles.lowBadge}>
              <Text style={styles.lowBadgeText}>LOW</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Manager</Text>
        <TouchableOpacity
          style={styles.alertBtn}
          onPress={() => navigation.navigate("LowStockAlerts")}
        >
          <Text style={styles.alertBtnText}>⚠ Alerts</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by title or author..."
        placeholderTextColor={COLORS.placeholderText}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No inventory records found.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: COLORS.textDark },
  alertBtn: {
    backgroundColor: "#fff3e0", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#ffcc80",
  },
  alertBtnText: { color: "#e65100", fontSize: 13, fontWeight: "600" },
  searchInput: {
    backgroundColor: COLORS.inputBackground, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.textDark, marginBottom: 14,
  },
  card: {
    backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 14,
    marginBottom: 10, flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", borderWidth: 1, borderColor: COLORS.border,
  },
  cardLeft: { flex: 1, paddingRight: 10 },
  bookTitle: { fontSize: 15, fontWeight: "600", color: COLORS.textDark },
  bookAuthor: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  cardRight: { alignItems: "center" },
  quantity: { fontSize: 26, fontWeight: "700", color: COLORS.primary },
  quantityLow: { color: "#e53935" },
  lowBadge: {
    backgroundColor: "#ffebee", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 4,
  },
  lowBadgeText: { fontSize: 10, color: "#e53935", fontWeight: "700" },
  emptyText: { textAlign: "center", color: COLORS.textSecondary, marginTop: 40 },
});