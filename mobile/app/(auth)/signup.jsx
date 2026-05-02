import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useRouter } from "expo-router";

import styles from "../../assets/styles/signup.styles";
import COLORS from "../../constants/colors";
import { useAuthStore } from "../../store/authStore";
import GradientBackground from "../../components/GradientBackground";
import PrimaryButton from "../../components/PrimaryButton";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { isLoading, register } = useAuthStore();
  const router = useRouter();

  const handleSignUp = async () => {
    const result = await register(username, email, password);
    if (!result.success) Alert.alert("Error", result.error);
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <TouchableOpacity
              style={{ alignSelf: "flex-start", padding: 8 }}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.topIllustration}>
              <Image
                source={require("../../assets/images/i.png")}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Join BookWorm and find your next favorite read
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="johndoe"
                      placeholderTextColor={COLORS.placeholderText}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      value={email}
                      placeholderTextColor={COLORS.placeholderText}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={COLORS.placeholderText}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={18}
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <PrimaryButton
                  title="Create Account"
                  icon="checkmark-circle"
                  iconPosition="right"
                  loading={isLoading}
                  onPress={handleSignUp}
                  size="lg"
                  style={styles.button}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.link}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
