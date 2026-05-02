import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { GRADIENTS, RADIUS, SHADOWS } from "../constants/theme";

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  variant = "primary", // "primary" | "outline" | "ghost"
  size = "md", // "sm" | "md" | "lg"
  style,
  textStyle,
  fullWidth = true,
}) {
  const heightByMap = { sm: 40, md: 48, lg: 54 };
  const height = heightByMap[size] || 48;
  const radius = size === "sm" ? RADIUS.sm : RADIUS.md;

  const renderContent = (color) => (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon && iconPosition === "left" ? (
            <Ionicons name={icon} size={size === "sm" ? 14 : 18} color={color} />
          ) : null}
          <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
          {icon && iconPosition === "right" ? (
            <Ionicons name={icon} size={size === "sm" ? 14 : 18} color={color} />
          ) : null}
        </>
      )}
    </View>
  );

  if (variant === "outline") {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.outline,
          { height, borderRadius: radius, opacity: disabled ? 0.5 : 1 },
          fullWidth && { alignSelf: "stretch" },
          style,
        ]}
      >
        {renderContent(COLORS.primary)}
      </TouchableOpacity>
    );
  }

  if (variant === "ghost") {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.ghost,
          { height, borderRadius: radius, opacity: disabled ? 0.5 : 1 },
          fullWidth && { alignSelf: "stretch" },
          style,
        ]}
      >
        {renderContent(COLORS.primary)}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        SHADOWS.primary,
        { borderRadius: radius, opacity: disabled ? 0.6 : 1 },
        fullWidth && { alignSelf: "stretch" },
        style,
      ]}
    >
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { height, borderRadius: radius }]}
      >
        {renderContent(COLORS.white)}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  outline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  ghost: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
