import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import COLORS from "../../constants/colors";
import { RADIUS, SHADOWS } from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";

function TabIcon({ name, color, focused }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? name.replace("-outline", "") : name}
        size={focused ? 22 : 20}
        color={focused ? COLORS.white : color}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user, token, isCheckingAuth } = useAuthStore();
  const isAdmin = user?.isAdmin === true;

  if (isCheckingAuth) {
    return null;
  }

  if (!user || !token) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: Math.max(insets.bottom, 12),
          height: 68,
          borderRadius: RADIUS.xxl,
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          paddingHorizontal: 8,
          paddingTop: 8,
          paddingBottom: 8,
          ...Platform.select({
            ios: SHADOWS.floating,
            android: { elevation: 12 },
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="recommended"
        options={{
          href: isAdmin ? null : undefined,
          title: "Picks",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="star-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
          title: "Create",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="add-circle-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-books"
        options={{
          href: isAdmin ? undefined : null,
          title: "Books",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cart-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          href: null,
          title: "My Orders",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="receipt-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          href: isAdmin ? undefined : null,
          title: "Admin",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="manage-book"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="add-stock"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="stock"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.primary,
  },
});
