import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { GRADIENTS, RADIUS, SHADOWS } from "../constants/theme";

export default function PromoBanner({
  title = "Book Sale",
  highlight = "50% OFF",
  subtitle = "Limited time offer on bestsellers",
  ctaLabel = "Shop Now",
  onPress,
  colors = GRADIENTS.banner,
  icon = "sparkles",
}) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.wrapper, SHADOWS.primary]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.decorCircleLg} />
        <View style={styles.decorCircleSm} />

        <View style={styles.content}>
          <View style={styles.iconBadge}>
            <Ionicons name={icon} size={16} color={COLORS.white} />
            <Text style={styles.iconBadgeText}>SPECIAL OFFER</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.highlight}>{highlight}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {ctaLabel ? (
            <View style={styles.ctaPill}>
              <Text style={styles.ctaText}>{ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </View>
          ) : null}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
  },
  banner: {
    borderRadius: RADIUS.xl,
    paddingVertical: 22,
    paddingHorizontal: 22,
    overflow: "hidden",
  },
  content: {
    zIndex: 2,
  },
  iconBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 10,
  },
  iconBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
    opacity: 0.95,
  },
  highlight: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 2,
    marginBottom: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 14,
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  ctaText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  decorCircleLg: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  decorCircleSm: {
    position: "absolute",
    right: 30,
    bottom: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
});
