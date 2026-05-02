import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../store/authStore";

export default function AuthLayout() {
  const { user, token, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return null;
  }

  if (user && token) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}