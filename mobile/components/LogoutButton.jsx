import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../store/authStore";
import styles from "../assets/styles/profile.styles";
import COLORS from "../constants/colors";

export default function LogoutButton({ style }) {
  const { logout } = useAuthStore();

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => logout(), style: "destructive" },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.quickTile, style]}
      onPress={confirmLogout}
      activeOpacity={0.8}
    >
      <View style={[styles.quickIconWrap, styles.quickIconWrapDanger]}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
      </View>
      <View style={styles.quickTileTextWrap}>
        <Text style={styles.quickTileTitle}>Logout</Text>
        <Text style={styles.quickTileSubtitle}>End your session</Text>
      </View>
    </TouchableOpacity>
  );
}
