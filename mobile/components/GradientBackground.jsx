import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GRADIENTS } from "../constants/theme";

export default function GradientBackground({
  children,
  colors = GRADIENTS.screen,
  style,
  applyTopInset = false,
  applyBottomInset = false,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[
        styles.container,
        applyTopInset && { paddingTop: insets.top },
        applyBottomInset && { paddingBottom: insets.bottom },
        style,
      ]}
    >
      <View style={styles.inner}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
