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
      <div className="min-h-screen bg-[#050c1a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_40px_rgba(59,130,246,0.4)] animate-pulse">
              <div className="w-full h-full bg-[#091427] rounded-2xl flex items-center justify-center font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                IV
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">InfraVerse Platform</h2>
          </div>
          <p className="text-slate-400 text-xs font-medium">Menghubungkan layanan Digital Twin & NOC Campus...</p>
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
