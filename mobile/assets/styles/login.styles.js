import { StyleSheet, Dimensions } from "react-native";
import COLORS from "../../constants/colors";
import { RADIUS, SHADOWS, SPACING } from "../../constants/theme";

const { width } = Dimensions.get("window");
const illustrationSize = Math.min(width * 0.55, 240);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    flex: 1,
  },
  topIllustration: {
    alignItems: "center",
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  illustrationImage: {
    width: illustrationSize,
    height: illustrationSize,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xxl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  formContainer: {
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 11,
    marginBottom: 6,
    color: COLORS.textSecondary,
    fontWeight: "800",
    letterSpacing: 0.6,
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
  eyeIcon: {
    padding: 6,
  },
  button: {
    marginTop: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.lg,
    gap: 4,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 13,
  },
});

export default styles;
