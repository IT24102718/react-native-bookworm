import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { RADIUS, SHADOWS, SPACING } from "../constants/theme";

export default function BookCard({
  book,
  onPress,
  width,
  variant = "vertical", // "vertical" | "compact"
}) {
  const displayPrice =
    book?.price === null || book?.price === undefined || book?.price === ""
      ? null
      : `Rs ${Number(book.price).toFixed(0)}`;

  const ratingValue =
    book?.averageRating !== undefined && book?.averageRating !== null
      ? Number(book.averageRating).toFixed(1)
      : null;

  const isCompact = variant === "compact";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        SHADOWS.cardSoft,
        isCompact && styles.cardCompact,
        width ? { width } : null,
      ]}
    >
      <View style={[styles.imageWrap, isCompact && styles.imageWrapCompact]}>
        <Image
          source={book?.image}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {ratingValue ? (
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={10} color={COLORS.accent} />
            <Text style={styles.ratingPillText}>{ratingValue}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {book?.title || "Untitled"}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          by {book?.author || "Unknown"}
        </Text>
        <View style={styles.priceRow}>
          {displayPrice ? (
            <Text style={styles.price}>{displayPrice}</Text>
          ) : (
            <Text style={styles.priceMuted}>—</Text>
          )}
          {book?.stockStatus === "out_of_stock" ? (
            <View style={styles.stockOut}>
              <Text style={styles.stockOutText}>OUT</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardCompact: {
    flexDirection: "row",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: COLORS.border,
    position: "relative",
  },
  imageWrapCompact: {
    width: 90,
    aspectRatio: 0.75,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  ratingPill: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  ratingPillText: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: "800",
  },
  body: {
    padding: SPACING.md,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  author: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  priceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  priceMuted: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  stockOut: {
    backgroundColor: "rgba(214, 69, 69, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  stockOutText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
