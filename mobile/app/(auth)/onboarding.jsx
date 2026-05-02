import { Image, StyleSheet, Text, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";
import { GRADIENTS, RADIUS, SHADOWS, SPACING } from "../../constants/theme";
import PrimaryButton from "../../components/PrimaryButton";

const { width } = Dimensions.get("window");
const illustrationSize = Math.min(width * 0.78, 320);

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={GRADIENTS.screen}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <View style={styles.decorTopRight} />
      <View style={styles.decorBottomLeft} />

      <View style={styles.topBadge}>
        <Ionicons name="book" size={14} color={COLORS.primary} />
        <Text style={styles.topBadgeText}>BOOK STORE</Text>
      </View>

      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationGlow} />
        <Image
          source={require("../../assets/images/i.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>Discover Your Next Favorite Read</Text>
        <Text style={styles.tagline}>
          Browse thousands of bestsellers, novels and study books — delivered fast,
          loved forever.
        </Text>
      </View>

      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title="Get Started"
          icon="arrow-forward"
          iconPosition="right"
          size="lg"
          onPress={() => router.replace("/(auth)")}
        />
        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account?</Text>
          <Text
            style={styles.signinLink}
            onPress={() => router.replace("/(auth)")}
          >
            Sign in
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    overflow: "hidden",
  },
  decorTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.35,
  },
  decorBottomLeft: {
    position: "absolute",
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: RADIUS.pill,
    ...SHADOWS.cardSoft,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  illustrationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  illustrationGlow: {
    position: "absolute",
    width: illustrationSize * 0.9,
    height: illustrationSize * 0.9,
    borderRadius: illustrationSize,
    backgroundColor: COLORS.white,
    opacity: 0.7,
  },
  illustration: {
    width: illustrationSize,
    height: illustrationSize,
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  actions: {
    paddingTop: 20,
    paddingBottom: 8,
    gap: 14,
  },
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  signinText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signinLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
