import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
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
};

export default function AddStockScreen({ route, navigation }) {
  const { bookId, title, action } = route.params;
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdd = action === "add";

  const handleSubmit = async () => {
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid quantity.");
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${API_URL}/api/inventory/${bookId}/${action}`,
        { quantity: Number(quantity), reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        "Success",
        `Stock ${isAdd ? "added" : "deducted"} successfully.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.bookTitle}>{title}</Text>
        <Text style={styles.actionLabel}>
          {isAdd ? "➕ Adding Stock" : "➖ Deducting Stock"}
        </Text>

        <Text style={styles.label}>Quantity *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter quantity"
          placeholderTextColor={COLORS.placeholderText}
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={
            isAdd
              ? "e.g. New shipment arrived"
              : "e.g. Order placed / Damaged stock"
          }
          placeholderTextColor={COLORS.placeholderText}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: isAdd ? COLORS.primary : "#e53935" },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {isAdd ? "Add Stock" : "Deduct Stock"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: "center", padding: 16,
  },
  card: {
    backgroundColor: COLORS.cardBackground, borderRadius: 14,
    padding: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  bookTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textDark, marginBottom: 4 },
  actionLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.inputBackground, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: COLORS.textDark, marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelText: { color: COLORS.textSecondary, fontSize: 14 },
});