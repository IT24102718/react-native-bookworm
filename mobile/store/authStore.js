import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: true,

  updateUser: async (updatedUser) => {
    const normalizedUser = {
      ...updatedUser,
      isAdmin: updatedUser?.isAdmin === true,
    };
    await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
    set({ user: normalizedUser });
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      const normalizedUser = {
        ...data.user,
        isAdmin: data?.user?.isAdmin === true,
      };

      await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
      await AsyncStorage.setItem("token", data.token);

      set({ token: data.token, user: normalizedUser, isLoading: false });

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      const normalizedUser = {
        ...data.user,
        isAdmin: data?.user?.isAdmin === true,
      };

      await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
      await AsyncStorage.setItem("token", data.token);

      set({ token: data.token, user: normalizedUser, isLoading: false });

      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userJson = await AsyncStorage.getItem("user");
      const parsedUser = userJson ? JSON.parse(userJson) : null;
      const user = parsedUser
        ? {
            ...parsedUser,
            isAdmin: parsedUser.isAdmin === true,
          }
        : null;

      set({ token, user });
    } catch (error) {
      console.log("Auth check failed", error);
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ token: null, user: null });
  },
}));