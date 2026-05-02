import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: 120,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.border,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarFallbackText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
  greetingTextWrap: {
    flex: 1,
  },
  greetingHello: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  greetingName: {
    fontSize: 17,
    color: COLORS.textPrimary,
    fontWeight: "800",
    marginTop: 2,
  },
  topActions: {
    flexDirection: "row",
    gap: 10,
  },
  bannerWrap: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionPadding: {
    paddingHorizontal: SPACING.lg,
  },
  hScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  categoryRow: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  categoryCard: {
    width: 100,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...SHADOWS.cardSoft,
  },
  categoryCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconCircleActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  categoryNameActive: {
    color: COLORS.white,
  },
  bestsellerCard: {
    width: 160,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loaderInline: {
    paddingVertical: 24,
    alignItems: "center",
  },
  gridRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  gridItem: {
    flex: 1,
  },
  filterClearRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginTop: -8,
    marginBottom: SPACING.sm,
    gap: 6,
  },
  filterClearText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});

export default styles;
