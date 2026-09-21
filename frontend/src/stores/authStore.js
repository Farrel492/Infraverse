import { create } from "zustand";

const getToken = () => sessionStorage.getItem("infraverse_token") || localStorage.getItem("infraverse_token");

const useAuthStore = create((set) => ({
  user:            null,
  token:           getToken(),
  isAuthenticated: !!getToken(),
  isInitialized:   false,

  setAuth: (user, token) => {
    // Default to sessionStorage for high security session handling
    sessionStorage.setItem("infraverse_token", token);
    set({ user, token, isAuthenticated: true, isInitialized: true });
  },

  setUser: (user) => {
    set({ user, isInitialized: true });
  },

  clearAuth: () => {
    sessionStorage.removeItem("infraverse_token");
    localStorage.removeItem("infraverse_token");
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
  },

  setInitialized: () => {
    set({ isInitialized: true });
  },
}));

export default useAuthStore;
