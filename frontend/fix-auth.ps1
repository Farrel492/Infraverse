if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

Write-Host "Fix authStore + App.jsx (solve ??? issue)..." -ForegroundColor Cyan

@'
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
'@ | Set-Content -Path "src\stores\authStore.js" -Encoding ascii

@'
import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import ToastProvider from "./components/shared/ToastProvider.jsx";
import useAuthStore from "./stores/authStore.js";
import api from "./services/api.js";

function AppInitializer({ children }) {
  const { token, setUser, clearAuth, setInitialized, isInitialized } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await api.get("/me");
          setUser(res.data.user ?? res.data);
        } catch {
          // Token invalid / expired — bersihkan
          clearAuth();
        }
      } else {
        setInitialized();
      }
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⬡</div>
          <p className="text-slate-400 text-sm">Memuat InfraVerse...</p>
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <AppInitializer>
        <AppRoutes />
      </AppInitializer>
    </BrowserRouter>
  );
}
'@ | Set-Content -Path "src\App.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Refresh browser — tanda ??? seharusnya hilang." -ForegroundColor Green