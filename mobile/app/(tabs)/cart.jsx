import { useCallback, useState } from "react";
import {
  View,
  Alert,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../constants/colors";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import styles from "../../assets/styles/cart.styles";
import GradientBackground from "../../components/GradientBackground";
import PrimaryButton from "../../components/PrimaryButton";

export default function Cart() {
  const { token, user, isCheckingAuth } = useAuthStore();
  const {
    cart,
    isLoading,
    error,
    getMyCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCartStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    postalCode: user?.address?.postalCode || "",
    country: user?.address?.country || "Sri Lanka",
  });
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (token) getMyCart();
    }, [getMyCart, token])
  );

  if (isCheckingAuth) return null;
  if (!user || !token) return <Redirect href="/(auth)/onboarding" />;

  const cartItems = cart?.items || [];
  const isEmpty = cartItems.length === 0;
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.bookId.price || 0) * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 0 : 0;
  const totalPrice = subtotal + shipping;

  const handleQuantityChange = async (bookId, currentQuantity, delta) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) {
      handleRemoveItem(bookId);
      return;
    }
    setIsUpdating(true);
    const result = await updateQuantity(bookId, newQuantity);
    setIsUpdating(false);
    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to update quantity");
    }
  };

  const handleRemoveItem = async (bookId) => {
    Alert.alert("Remove Item", "Remove this item from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setIsUpdating(true);
          const result = await removeItem(bookId);
          setIsUpdating(false);
          if (!result.success) {
            Alert.alert("Error", result.error || "Failed to remove item");
          }
        },
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert("Clear Cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setIsUpdating(true);
          const result = await clearCart();
          setIsUpdating(false);
          if (!result.success) {
            Alert.alert("Error", result.error || "Failed to clear cart");
          }
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) return;
    setShowCheckoutModal(true);
  };

  const submitOrder = async () => {
    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.postalCode
    ) {
      Alert.alert("Error", "Please fill in all address fields");
      return;
    }
    try {
      setIsUpdating(true);
      const items = cartItems.map((item) => ({
        bookId: item.bookId._id,
        title: item.bookId.title,
        quantity: item.quantity,
        price: item.bookId.price || 0,
      }));
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          paymentMethod: "cash",
          shippingAddress,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }
      useAuthStore
        .getState()
        .updateUser({ ...user, address: data.userAddress });
      Alert.alert("Order Placed!", "Your order has been placed successfully.");
      setShowCheckoutModal(false);
      await getMyCart();
      router.push("/orders");
    } catch (error) {
      Alert.alert("Checkout Error", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStockStatusStyle = (status) => {
    if (status === "low_stock") {
      return {
        container: styles.stockStatusLow,
        text: styles.stockStatusLowText,
      };
    }
    if (status === "out_of_stock") {
      return {
        container: styles.stockStatusOut,
        text: styles.stockStatusOutText,
      };
    }
    return { container: null, text: null };
  };

  const getStockStatusLabel = (status) => {
    if (status === "low_stock") return "LOW STOCK";
    if (status === "out_of_stock") return "OUT";
    return "IN STOCK";
  };

  if (isLoading && !cart) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </GradientBackground>
    );
  }

  if (isEmpty) {
    return (
      <GradientBackground>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart" size={56} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Browse our collection and add books you love to your cart.
          </Text>
          <PrimaryButton
            title="Browse Books"
            icon="arrow-forward"
            iconPosition="right"
            fullWidth={false}
            onPress={() => router.push("/(tabs)")}
          />
        </View>
      </GradientBackground>
    );
  }

  const renderCartItem = ({ item }) => {
    const { bookId, quantity } = item;
    const statusStyle = getStockStatusStyle(bookId.stockStatus);

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemContent}>
          <Image
            source={{ uri: bookId.image }}
            style={styles.itemImage}
            contentFit="cover"
          />

          <View style={styles.itemInfo}>
            <View>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {bookId.title}
              </Text>
              <Text style={styles.itemAuthor} numberOfLines={1}>
                by {bookId.author}
              </Text>
            </View>

            <View style={styles.itemPriceRow}>
              <Text style={styles.itemPrice}>
                Rs {Number(bookId.price || 0).toFixed(0)}
              </Text>
              <View style={[styles.stockStatus, statusStyle.container]}>
                <Text style={[styles.stockStatusText, statusStyle.text]}>
                  {getStockStatusLabel(bookId.stockStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.quantityRow}>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() =>
                    handleQuantityChange(bookId._id, quantity, -1)
                  }
                  disabled={isUpdating}
                >
                  <Ionicons
                    name="remove"
                    size={14}
                    color={COLORS.textPrimary}
                  />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, styles.quantityButtonActive]}
                  onPress={() =>
                    handleQuantityChange(bookId._id, quantity, 1)
                  }
                  disabled={isUpdating}
                >
                  <Ionicons name="add" size={14} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(bookId._id)}
                disabled={isUpdating}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={COLORS.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <View style={styles.headerContainer}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSubtitle}>
            {cartItems.length} item{cartItems.length === 1 ? "" : "s"} ready to
            checkout
          </Text>
        </View>
        <TouchableOpacity
          style={styles.clearTextBtn}
          onPress={handleClearCart}
          disabled={isUpdating}
        >
          <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
          <Text style={styles.clearTextBtnLabel}>Clear</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.bookId._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footerContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            Rs {subtotal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
            FREE
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rs {totalPrice.toFixed(2)}</Text>
        </View>

        <PrimaryButton
          title="Proceed to Checkout"
          icon="arrow-forward"
          iconPosition="right"
          loading={isUpdating}
          onPress={handleCheckout}
        />
      </View>

      <Modal
        visible={showCheckoutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Shipping Address</Text>
                <Text style={styles.modalSubtitle}>
                  We'll deliver your books here.
                </Text>

                <Text style={styles.inputLabel}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123 Main Street"
                  placeholderTextColor={COLORS.placeholderText}
                  value={shippingAddress.street}
                  onChangeText={(text) =>
                    setShippingAddress({ ...shippingAddress, street: text })
                  }
                />

                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Colombo"
                  placeholderTextColor={COLORS.placeholderText}
                  value={shippingAddress.city}
                  onChangeText={(text) =>
                    setShippingAddress({ ...shippingAddress, city: text })
                  }
                />

                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="00100"
                  placeholderTextColor={COLORS.placeholderText}
                  keyboardType="number-pad"
                  value={shippingAddress.postalCode}
                  onChangeText={(text) =>
                    setShippingAddress({
                      ...shippingAddress,
                      postalCode: text,
                    })
                  }
                />

                <Text style={styles.inputLabel}>Country</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sri Lanka"
                  placeholderTextColor={COLORS.placeholderText}
                  value={shippingAddress.country}
                  onChangeText={(text) =>
                    setShippingAddress({
                      ...shippingAddress,
                      country: text,
                    })
                  }
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowCheckoutModal(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <PrimaryButton
                    title="Place Order"
                    icon="checkmark-circle"
                    iconPosition="right"
                    loading={isUpdating}
                    onPress={submitOrder}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </GradientBackground>
  );
}
