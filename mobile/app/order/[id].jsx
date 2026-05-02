import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../../store/authStore";
import styles from "../../assets/styles/orders.styles";
import { API_URL } from "../../constants/api";
import COLORS from "../../constants/colors";
import Loader from "../../components/Loader";
import GradientBackground from "../../components/GradientBackground";

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuthStore();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch order details");

      setOrder(data.data);
    } catch (error) {
      Alert.alert("Error", error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const handleUpdateStatus = async (status) => {
    try {
      setActionLoading(true);
      const response = await fetch(`${API_URL}/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update status");

      Alert.alert("Success", data.message);
      fetchOrderDetails();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await fetch(`${API_URL}/orders/${id}/cancel`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
              });

              const data = await response.json();
              if (!response.ok) throw new Error(data.message || "Failed to cancel order");

              Alert.alert("Success", "Order has been cancelled.");
              fetchOrderDetails();
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };
  const handleCompleteOrder = () => {
    Alert.alert(
      "Confirm Receipt",
      "Have you received this order?",
      [
        { text: "Not yet", style: "cancel" },
        {
          text: "Yes, I received it",
          style: "default",
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await fetch(`${API_URL}/orders/${id}/complete`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
              });

              const data = await response.json();
              if (!response.ok) throw new Error(data.message || "Failed to complete order");

              Alert.alert("Success", "Order marked as completed!");
              fetchOrderDetails();
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteOrder = () => {
    Alert.alert(
      "Delete Order",
      "Are you sure you want to permanently delete this order? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await fetch(`${API_URL}/orders/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });

              const data = await response.json();
              if (!response.ok) throw new Error(data.message || "Failed to delete order");

              Alert.alert("Success", "Order deleted.");
              router.back();
            } catch (error) {
              Alert.alert("Error", error.message);
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !order) return <Loader />;

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

  const canCancel = order.status !== "delivered" && order.status !== "completed" && order.status !== "cancelled";
  const canComplete = order.status === "shipped" || order.status === "delivered";

  return (
    <GradientBackground>
    <View style={styles.detailContainer}>
      <View style={[styles.header, { flexDirection: "row", alignItems: "center" }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle}>{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status), fontSize: 16 }]}>
                {order.status}
              </Text>
            </View>
            <Text style={{ marginLeft: 12, color: COLORS.textSecondary }}>
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items?.length || 0})</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
              </View>
              <View style={styles.itemPriceBox}>
                <Text style={styles.itemPrice}>Rs {(item.price * item.quantity).toFixed(2)}</Text>
                <Text style={styles.itemMeta}>Rs {Number(item.price).toFixed(2)} each</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Shipping Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{order.shippingAddress?.street || "N/A"}</Text>
            <Text style={styles.addressText}>{order.shippingAddress?.city || "N/A"}</Text>
            <Text style={styles.addressText}>{order.shippingAddress?.postalCode || "N/A"}</Text>
            <Text style={styles.addressText}>{order.shippingAddress?.country || "Sri Lanka"}</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>Rs {Number(order.subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Rs {Number(order.shippingCost).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>Rs {Number(order.tax).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>Rs {Number(order.totalAmount).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={[styles.summaryValue, { textTransform: "capitalize" }]}>{order.paymentMethod}</Text>
          </View>
        </View>

        {/* Admin Actions */}
        {user?.isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            {actionLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <View style={styles.adminActionContainer}>
                  {["pending", "processing", "shipped", "delivered"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusUpdateButton,
                        order.status === status && { backgroundColor: COLORS.border }
                      ]}
                      disabled={order.status === status}
                      onPress={() => handleUpdateStatus(status)}
                    >
                      <Text style={styles.statusUpdateText}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: "row", marginTop: 12, justifyContent: "space-between" }}>
                  {canCancel && (
                    <TouchableOpacity 
                      style={[styles.actionButton, { flex: 1, marginRight: 8, backgroundColor: "#f59e0b" }]}
                      onPress={handleCancelOrder}
                    >
                      <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                      <Text style={[styles.actionButtonText, { fontSize: 14 }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionButton, { flex: 1, backgroundColor: "#dc2626", marginLeft: canCancel ? 8 : 0 }]}
                    onPress={handleDeleteOrder}
                  >
                    <Ionicons name="trash" size={18} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { fontSize: 14 }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* User Actions */}
        {!user?.isAdmin && (
          <View style={{ padding: 20 }}>
            {canComplete && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: COLORS.primary, marginBottom: 12 }]}
                onPress={handleCompleteOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Confirm Received</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canCancel && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleCancelOrder}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Cancel Order</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
    </GradientBackground>
  );
}
