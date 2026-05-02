import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { useAuthStore } from "../store/authStore";
import styles from "../assets/styles/profile.styles";
import { GRADIENTS } from "../constants/theme";
import COLORS from "../constants/colors";
import { formatMemberSince } from "../lib/utils";

export default function ProfileHeader() {
  const { user } = useAuthStore();

  if (!user) return null;

  const initial = (user.username || "U").charAt(0).toUpperCase();

  return (
    <LinearGradient
      colors={GRADIENTS.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.profileHeaderCard}
    >
      <View style={styles.profileHeaderRow}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImageFallback}>
            <Text style={styles.profileImageFallbackText}>{initial}</Text>
          </View>
        )}

        <View style={styles.profileInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.memberSinceRow}>
            <Ionicons name="calendar-outline" size={11} color={COLORS.white} />
            <Text style={styles.memberSince}>
              Joined {formatMemberSince(user.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
