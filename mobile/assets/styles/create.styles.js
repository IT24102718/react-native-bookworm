import { StyleSheet } from "react-native";
import COLORS from "../../constants/colors";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  scrollViewStyle: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginVertical: SPACING.lg,
    ...SHADOWS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  form: {
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    marginBottom: 6,
    color: COLORS.textSecondary,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: "500",
  },
  textArea: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    height: 110,
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: "top",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 8,
  },
  starButton: {
    padding: 6,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.inputBackground,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
    ...SHADOWS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default styles;
