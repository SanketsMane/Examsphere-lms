import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { AuthSession, User } from "../types";

/**
 * Mobile Authentication Store
 * Sanket
 */

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession | null) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: async (session: AuthSession | null) => {
    if (session) {
      await SecureStore.setItemAsync("auth_token", session.token);
      await SecureStore.setItemAsync("user_data", JSON.stringify(session.user));
      set({ 
        user: session.user, 
        token: session.token, 
        isAuthenticated: true,
        isLoading: false 
      });
    } else {
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("user_data");
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },

  updateUser: async (user: User) => {
    await SecureStore.setItemAsync("user_data", JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("auth_token");
    await SecureStore.deleteItemAsync("user_data");
    set({ user: null, token: null, isAuthenticated: false });
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const userData = await SecureStore.getItemAsync("user_data");
      
      if (token && userData) {
        set({ 
          token, 
          user: JSON.parse(userData), 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error("Failed to initialize auth store", error);
      set({ isLoading: false });
    }
  },
}));
