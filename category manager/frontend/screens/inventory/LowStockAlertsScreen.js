import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";

const COLORS = {
  primary: "#4CAF50",
  textDark: "#1b361b",
  textSecondary: "#688f68",
  background: "#e8f5e9",
  cardBackground: "#f1f8f2",
  border: "#c8e6c9",
};

export default function LowStockAlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/inventory/alerts/low`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchAlerts(); };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1, backgroundColor: COLORS.background }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚠ Low Stock Alerts</Text>
        <Text style={styles.subtitle}>{alerts.length} item(s) need attention</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>All stock levels are healthy!</Text>
          </View>
        }
        renderItem={({ item }) => (
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
              <Text style={styles.bookTitle}>{item.bookId?.title}</Text>
              <Text style={styles.bookAuthor}>{item.bookId?.author}</Text>
              <Text style={styles.threshold}>
                Threshold: {item.lowStockThreshold}
              </Text>
            </View>
            <View style={styles.qtyBox}>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text style={styles.qtyLabel}>left</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.textDark },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: "#fff8f8", borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#ffcdd2",
  },
  cardLeft: { flex: 1 },
  bookTitle: { fontSize: 15, fontWeight: "600", color: COLORS.textDark },
  bookAuthor: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  threshold: { fontSize: 12, color: "#e53935", marginTop: 4 },
  qtyBox: { alignItems: "center" },
  qty: { fontSize: 28, fontWeight: "700", color: "#e53935" },
  qtyLabel: { fontSize: 11, color: "#e57373" },
  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
});