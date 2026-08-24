import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";
import ToastProvider from "./components/shared/ToastProvider.jsx";
import useAuthStore from "./stores/authStore.js";
import api from "./services/api.js";

function AppInitializer({ children }) {
  const { token, setUser, clearAuth, setInitialized } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await api.get("/me");
          setUser(res.data.user ?? res.data);
        } catch {
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
          <div className="text-4xl mb-4 animate-pulse font-bold text-blue-400">IV</div>
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
