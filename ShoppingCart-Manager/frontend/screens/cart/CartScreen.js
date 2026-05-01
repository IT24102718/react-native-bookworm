import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cartAPI } from '../../api/cartAPI';
import CartItem from '../../components/cart/CartItem';
import COLORS from '../../styles/colors';

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (response.data.success) setCart(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchCart(); }, []));

  const handleUpdateQuantity = async (bookId, newQuantity) => {
    if (newQuantity < 1) return;
    const response = await cartAPI.updateCartItem(bookId, newQuantity);
    if (response.data.success) setCart(response.data.data);
  };

  const handleRemoveItem = async (bookId) => {
    Alert.alert('Remove', 'Remove this item?', [
      { text: 'Cancel' },
      { text: 'Remove', onPress: async () => {
        const response = await cartAPI.removeFromCart(bookId);
        if (response.data.success) setCart(response.data.data);
      }}
    ]);
  };

  const handleClearCart = async () => {
    Alert.alert('Clear Cart', 'Remove all items?', [
      { text: 'Cancel' },
      { text: 'Clear', onPress: async () => {
        await cartAPI.clearCart();
        fetchCart();
      }}
    ]);
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />;

  const hasItems = cart?.items?.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {hasItems && <TouchableOpacity onPress={handleClearCart}><Text style={styles.clearText}>Clear All</Text></TouchableOpacity>}
      </View>
      {hasItems ? (
        <>
          <FlatList data={cart.items} renderItem={({ item }) => <CartItem item={item} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveItem} />} keyExtractor={(item) => item.bookId} />
          <View style={styles.footer}>
            <Text style={styles.totalLabel}>Total: ${cart.totalAmount?.toFixed(2) || '0.00'}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark },
  clearText: { fontSize: 14, color: '#FF3B30' },
  footer: { backgroundColor: COLORS.white, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textDark }
});