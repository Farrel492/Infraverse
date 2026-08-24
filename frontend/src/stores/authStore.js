import { create } from "zustand";

const useAuthStore = create((set) => ({
  user:            null,
  token:           localStorage.getItem("infraverse_token") || null,
  isAuthenticated: !!localStorage.getItem("infraverse_token"),
  isInitialized:   false,

  setAuth: (user, token) => {
    localStorage.setItem("infraverse_token", token);
    set({ user, token, isAuthenticated: true, isInitialized: true });
  },

  setUser: (user) => {
    set({ user, isInitialized: true });
  },

  clearAuth: () => {
    localStorage.removeItem("infraverse_token");
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
  },

  setInitialized: () => {
    set({ isInitialized: true });
  },
}));

export default useAuthStore;
