import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import styles from "../../assets/styles/orders.styles";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";

export default function Orders() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const handleGoBack = () => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace("/");
  };

  const fetchOrders = useCallback(
    async (refresh = false) => {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      try {
        if (refresh) setRefreshing(true);
        else setLoading(true);

        const endpoint = user?.isAdmin ? `${API_URL}/orders` : `${API_URL}/orders/myorders`;

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch orders");

        setOrders(data.data || []);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to fetch orders");
      } finally {
        if (refresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [token, user?.isAdmin]
  );

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const handleRefresh = async () => {
    await fetchOrders(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "processing": return "#3b82f6";
      case "shipped": return "#8b5cf6";
      case "delivered": return "#10b981";
      case "completed": return "#059669";
      case "cancelled": return "#ef4444";
      default: return COLORS.textSecondary;
    }
  };

  const renderItem = ({ item }) => {
    const displayTotal = `Rs ${Number(item.totalAmount).toFixed(2)}`;
    const dateStr = new Date(item.createdAt).toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${item._id}`)}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.orderLabel}>Items:</Text>
          <Text style={styles.orderValue}>{item.items?.length || 0} items</Text>
        </View>

        <View style={styles.orderDetailsRow}>
          <Text style={styles.orderLabel}>Payment:</Text>
          <Text style={[styles.orderValue, { textTransform: 'capitalize' }]}>{item.paymentMethod}</Text>
        </View>

        {user?.isAdmin && item.userId?.email && (
          <View style={styles.orderDetailsRow}>
            <Text style={styles.orderLabel}>Customer:</Text>
            <Text style={styles.orderValue}>{item.userId.email}</Text>
          </View>
        )}

        <View style={styles.orderTotalRow}>
          <Text style={styles.orderTotalLabel}>Total</Text>
          <Text style={styles.orderTotalValue}>{displayTotal}</Text>
        </View>

        <View style={styles.readOnlyIndicator}>
          <Ionicons name="receipt-outline" size={14} color={COLORS.primary} />
          <Text style={styles.readOnlyText}>Tap to view details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <Loader />;

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back-outline" size={16} color={COLORS.primary} />
          <Text style={{ marginLeft: 4, color: COLORS.primary, fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.isAdmin ? "All Orders" : "My Orders"}</Text>
        <Text style={styles.headerSubtitle}>
          {user?.isAdmin ? "Manage store orders" : "View and track your previous orders"}
        </Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
            <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {user?.isAdmin ? "No orders have been placed yet." : "You haven't placed any orders yet."}
            </Text>
          </View>
        }
      />
      </View>
    </GradientBackground>
  );
}
