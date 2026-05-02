import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";
import { SPACING } from "../constants/theme";

export default function SectionHeader({ title, subtitle, actionLabel, onActionPress }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onActionPress}
          style={styles.action}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
