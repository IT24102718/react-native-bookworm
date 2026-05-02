import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { SHADOWS } from "../constants/theme";

export default function IconButton({
  name,
  onPress,
  size = 22,
  color = COLORS.textPrimary,
  background = COLORS.white,
  variant = "soft", // "soft" | "solid" | "ghost"
  style,
}) {
  const buttonStyle = [
    styles.base,
    variant === "solid" && { backgroundColor: COLORS.primary, ...SHADOWS.primary },
    variant === "soft" && {
      backgroundColor: background,
      ...SHADOWS.cardSoft,
    },
    variant === "ghost" && { backgroundColor: "transparent" },
    style,
  ];

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={buttonStyle}>
      <Ionicons
        name={name}
        size={size}
        color={variant === "solid" ? COLORS.white : color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
