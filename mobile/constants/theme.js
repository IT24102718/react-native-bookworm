import COLORS from "./colors";

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
};

export const SHADOWS = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSoft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  floating: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const GRADIENTS = {
  screen: ["#f5fbf6", "#e8f5e9"],
  screenSoft: ["#ffffff", "#e8f5e9"],
  primary: ["#66BB6A", "#2E7D32"],
  primarySoft: ["#A5D6A7", "#66BB6A"],
  banner: ["#388E3C", "#66BB6A"],
  bannerWarm: ["#FFB74D", "#F57C00"],
  card: ["#ffffff", "#f1f8f2"],
  glass: ["rgba(255,255,255,0.85)", "rgba(241,248,242,0.85)"],
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2 },
  h4: { fontSize: 17, fontWeight: "700" },
  body: { fontSize: 14, fontWeight: "500" },
  bodyLarge: { fontSize: 15, fontWeight: "500" },
  caption: { fontSize: 12, fontWeight: "500" },
  label: { fontSize: 13, fontWeight: "600" },
};

export default { SPACING, RADIUS, SHADOWS, GRADIENTS, TYPOGRAPHY };
