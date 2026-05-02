import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 130,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 4,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.cardSoft,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: -0.2,
  },
  bookRow: {
    flexDirection: "row",
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  bookImage: {
    width: 60,
    height: 84,
    borderRadius: RADIUS.sm,
    marginRight: 12,
    backgroundColor: COLORS.border,
  },
  bookInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  bookMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(244, 180, 0, 0.18)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#A88300",
  },
  caption: {
    fontSize: 12,
    color: COLORS.textDark,
    fontStyle: "italic",
    marginTop: 6,
    lineHeight: 17,
  },
  emptyState: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  bigEmpty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  bigEmptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  bigEmptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  footerLoader: {
    marginVertical: 20,
  },
});

export default styles;
