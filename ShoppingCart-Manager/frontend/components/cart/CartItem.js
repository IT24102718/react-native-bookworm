import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import COLORS from '../../styles/colors';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: item.coverImage || 'https://via.placeholder.com/80' }} style={styles.coverImage} />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => onUpdateQuantity(item.bookId, item.quantity - 1)}>
            <Text style={styles.quantityButton}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => onUpdateQuantity(item.bookId, item.quantity + 1)}>
            <Text style={styles.quantityButton}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.subtotal}>${(item.price * item.quantity).toFixed(2)}</Text>
        <TouchableOpacity onPress={() => onRemove(item.bookId)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 12, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  coverImage: { width: 80, height: 100, borderRadius: 8, marginRight: 12 },
  infoContainer: { flex: 2, justifyContent: 'space-between' },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  price: { fontSize: 14, color: COLORS.primary, fontWeight: '500', marginTop: 4 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  quantityButton: { fontSize: 18, fontWeight: 'bold', backgroundColor: COLORS.primary, color: COLORS.white, width: 30, textAlign: 'center', padding: 4, borderRadius: 15, overflow: 'hidden' },
  quantity: { fontSize: 16, marginHorizontal: 15 },
  rightContainer: { alignItems: 'flex-end', justifyContent: 'space-between' },
  subtotal: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  removeText: { fontSize: 12, color: '#FF3B30', marginTop: 8 }
});