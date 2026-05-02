import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const { user, token, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return null;
  }

  const isSignedIn = Boolean(user && token);

  return (
    <Redirect href={isSignedIn ? "/(tabs)" : "/(auth)/onboarding"} />
  );
}
