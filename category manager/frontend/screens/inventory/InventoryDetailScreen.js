import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";

const COLORS = {
  primary: "#4CAF50",
  textPrimary: "#2e5a2e",
  textSecondary: "#688f68",
  textDark: "#1b361b",
  background: "#e8f5e9",
  cardBackground: "#f1f8f2",
  border: "#c8e6c9",
  white: "#ffffff",
};

export default function InventoryDetailScreen({ route, navigation }) {
  const { bookId, title } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/inventory/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItem(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    const unsub = navigation.addListener("focus", fetchDetail);
    return unsub;
  }, [navigation]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1, backgroundColor: COLORS.background }}
      />
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Inventory record not found.</Text>
      </View>
    );
  }

  const isLow = item.quantity <= item.lowStockThreshold;

  return (
    <ScrollView style={styles.container}>
      {/* Stats card */}
      <View style={styles.card}>
        <Text style={styles.bookTitle}>{item.bookId?.title}</Text>
        <Text style={styles.bookAuthor}>{item.bookId?.author}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, isLow && { color: "#e53935" }]}>
              {item.quantity}
            </Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.lowStockThreshold}</Text>
            <Text style={styles.statLabel}>Low Stock At</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: isLow ? "#e53935" : COLORS.primary }]}>
              {isLow ? "LOW" : "OK"}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
          onPress={() =>
            navigation.navigate("AddStock", { bookId, title: item.bookId?.title, action: "add" })
          }
        >
          <Text style={styles.actionBtnText}>+ Add Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#e53935" }]}
          onPress={() =>
            navigation.navigate("AddStock", { bookId, title: item.bookId?.title, action: "deduct" })
          }
        >
          <Text style={styles.actionBtnText}>− Deduct Stock</Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>Stock History</Text>
      {(!item.history || item.history.length === 0) && (
        <Text style={styles.emptyText}>No history yet.</Text>
      )}
      {[...(item.history || [])].reverse().map((h, i) => (
        <View key={i} style={styles.historyCard}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyType}>{h.changeType?.toUpperCase()}</Text>
            <Text style={styles.historyReason}>{h.reason}</Text>
            <Text style={styles.historyDate}>
              {new Date(h.date).toLocaleDateString()}
            </Text>
          </View>
          <Text
            style={[
              styles.historyQty,
              h.changeType === "add" || h.changeType === "restore"
                ? { color: COLORS.primary }
                : { color: "#e53935" },
            ]}
          >
            {h.changeType === "add" || h.changeType === "restore" ? "+" : "-"}
            {h.quantityChanged}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f5e9", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#e8f5e9" },
  card: {
    backgroundColor: "#f1f8f2", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#c8e6c9", marginBottom: 16,
  },
  bookTitle: { fontSize: 18, fontWeight: "700", color: "#1b361b" },
  bookAuthor: { fontSize: 14, color: "#688f68", marginBottom: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: "#4CAF50" },
  statLabel: { fontSize: 12, color: "#688f68", marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1b361b", marginBottom: 10 },
  emptyText: { color: "#688f68", textAlign: "center", marginTop: 10 },
  historyCard: {
    backgroundColor: "#f1f8f2", borderRadius: 10, padding: 12, marginBottom: 8,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#c8e6c9",
  },
  historyLeft: { flex: 1 },
  historyType: { fontSize: 12, fontWeight: "700", color: "#2e5a2e" },
  historyReason: { fontSize: 13, color: "#1b361b", marginTop: 2 },
  historyDate: { fontSize: 11, color: "#688f68", marginTop: 2 },
  historyQty: { fontSize: 20, fontWeight: "700" },
});