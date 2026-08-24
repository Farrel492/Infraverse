if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src","src\components\layout","src\components\shared","src\pages\Auth","src\pages\Dashboard","src\pages\Assets","src\pages\Building","src\pages\DigitalTwin","src\pages\Mapping","src\pages\Simulation","src\routes","src\services","src\stores" | Out-Null

Write-Host "Menulis file inti React..." -ForegroundColor Cyan

@'
@import "tailwindcss";

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Inter", sans-serif;
  background-color: #0f172a;
  color: #e2e8f0;
}
'@ | Set-Content -Path "src\index.css" -Encoding ascii

@'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
'@ | Set-Content -Path "src\main.jsx" -Encoding ascii

@'
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
'@ | Set-Content -Path "src\App.jsx" -Encoding ascii

Write-Host "Menulis auth store (Zustand)..." -ForegroundColor Cyan

@'
import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("infraverse_token") || null,
  isAuthenticated: !!localStorage.getItem("infraverse_token"),

  setAuth: (user, token) => {
    localStorage.setItem("infraverse_token", token);
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem("infraverse_token");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
'@ | Set-Content -Path "src\stores\authStore.js" -Encoding ascii

Write-Host "Menulis API service..." -ForegroundColor Cyan

@'
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("infraverse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("infraverse_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
'@ | Set-Content -Path "src\services\api.js" -Encoding ascii

@'
import api from "./api";

export const authService = {
  login: (credentials) => api.post("/login", credentials),
  register: (data) => api.post("/register", data),
  logout: () => api.post("/logout"),
  me: () => api.get("/me"),
};
'@ | Set-Content -Path "src\services\authService.js" -Encoding ascii

Write-Host "Menulis routes..." -ForegroundColor Cyan

@'
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import MainLayout from "../components/layout/MainLayout.jsx";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
'@ | Set-Content -Path "src\routes\AppRoutes.jsx" -Encoding ascii

Write-Host "Menulis layout..." -ForegroundColor Cyan

@'
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { authService } from "../../services/authService";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/buildings", label: "Gedung", icon: "🏢" },
  { to: "/assets", label: "Aset", icon: "🖥" },
  { to: "/mapping", label: "Peta Jaringan", icon: "🔗" },
  { to: "/simulation", label: "Simulasi", icon: "⚡" },
  { to: "/digital-twin", label: "Digital Twin", icon: "🌐" },
];

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-blue-400">⬡ InfraVerse</h1>
          <p className="text-xs text-slate-400 mt-1">Smart Infrastructure</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-100 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors text-left"
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
'@ | Set-Content -Path "src\components\layout\MainLayout.jsx" -Encoding ascii

Write-Host "Menulis halaman Auth..." -ForegroundColor Cyan

@'
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import useAuthStore from "../../stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.login(form);
      setAuth(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message ?? "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">⬡ InfraVerse</h1>
          <p className="text-slate-400 mt-2">Smart Infrastructure Digital Twin</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Masuk ke Akun</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@infraverse.test"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-2"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Belum punya akun?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Auth\LoginPage.jsx" -Encoding ascii

@'
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import useAuthStore from "../../stores/authStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.register(form);
      setAuth(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(" "));
      } else {
        setError(err.response?.data?.message ?? "Terjadi kesalahan.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">⬡ InfraVerse</h1>
          <p className="text-slate-400 mt-2">Smart Infrastructure Digital Twin</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Buat Akun Baru</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama kamu"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@kamu.com"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Konfirmasi Password
              </label>
              <input
                type="password"
                required
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm({ ...form, password_confirmation: e.target.value })
                }
                placeholder="Ulangi password"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-2"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Auth\RegisterPage.jsx" -Encoding ascii

Write-Host "Menulis halaman Dashboard placeholder..." -ForegroundColor Cyan

@'
import useAuthStore from "../../stores/authStore";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-100">
          Selamat datang, {user?.name} 👋
        </h2>
        <p className="text-slate-400 mt-1">
          InfraVerse Smart Infrastructure Digital Twin Platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Perangkat", value: "8", icon: "🖥", color: "blue" },
          { label: "Perangkat Aktif", value: "8", icon: "✅", color: "green" },
          { label: "Maintenance Terjadwal", value: "1", icon: "🔧", color: "yellow" },
          { label: "Skenario Simulasi", value: "5", icon: "⚡", color: "purple" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-slate-100">{stat.value}</p>
            <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">Status Sistem</h3>
        <p className="text-slate-400 text-sm">
          Backend API terhubung · Role: <span className="text-blue-400 capitalize font-medium">{user?.role}</span>
        </p>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Dashboard\DashboardPage.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Semua file Phase 2b berhasil ditulis." -ForegroundColor Green
Write-Host "Lanjut: npm run dev" -ForegroundColor Yellow