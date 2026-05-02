import { create } from "zustand";
import { useAuthStore } from "./authStore";
import { API_URL } from "../constants/api";

export const useCartStore = create((set) => ({
  cart: null,
  isLoading: false,
  error: null,

  addToCart: async (bookId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId, quantity }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add to cart");

      set({ cart: data.cart, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  getMyCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/cart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch cart");

      set({ cart: data.cart, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateQuantity: async (bookId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/cart/${bookId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update quantity");

      set({ cart: data.cart, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  removeItem: async (bookId) => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/cart/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to remove item");

      set({ cart: data.cart, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/cart`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to clear cart");

      set({ cart: data.cart, isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));
