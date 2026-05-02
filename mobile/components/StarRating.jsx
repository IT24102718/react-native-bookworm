import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

export default function StarRating({ rating = 0, onRatingChange, size = 40, interactive = false }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => interactive && onRatingChange?.(star)}
          disabled={!interactive}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? COLORS.primary : COLORS.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
