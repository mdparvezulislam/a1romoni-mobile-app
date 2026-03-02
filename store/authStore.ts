// src/store/authStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // লগইন হলে টোকেন এবং ইউজারের ডেটা সেভ করবে
      login: (user, token) => set({ user, token, isAuthenticated: true }),

      // লগআউট হলে সব ডেটা মুছে ফেলবে
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage", // স্টোরেজের নাম
      // ✅ এটি AsyncStorage কে সঠিকভাবে হ্যান্ডেল করবে
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
