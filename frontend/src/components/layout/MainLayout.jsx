import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Server, Network,
  Zap, Globe, Wrench, LogOut, ChevronRight, Bell,
  PanelLeftClose, PanelLeft, Users, Activity
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import { authService } from "../../services/authService";
import useNotificationStore from "../../stores/useNotificationStore";
import NotificationModal from "./NotificationModal";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard",    label: "Dashboard",     Icon: LayoutDashboard, alertKey: null,          desc: "Pusat Monitoring" },
  { to: "/buildings",    label: "Gedung",         Icon: Building2,       alertKey: null,          desc: "Manajemen Gedung" },
  { to: "/assets",       label: "Aset Digital",   Icon: Server,          alertKey: "down",        desc: "Katalog Perangkat" },
  { to: "/mapping",      label: "Peta Jaringan",  Icon: Network,         alertKey: null,          desc: "Topologi 3D" },
  { to: "/simulation",   label: "Simulasi",       Icon: Zap,             alertKey: null,          desc: "Disaster Recovery" },
  { to: "/digital-twin", label: "Digital Twin",   Icon: Globe,           alertKey: null,          desc: "Rack Inspector" },
  { to: "/maintenance",  label: "Maintenance",    Icon: Wrench,          alertKey: "maintenance", desc: "Jadwal Perawatan" },
];

const roleColor   = { admin: "#f87171", teknisi: "#60a5fa", viewer: "#4ade80" };
const roleLabel   = { admin: "Administrator", teknisi: "Teknisi IT", viewer: "Viewer" };
const roleBadgeBg = { admin: "rgba(239,68,68,0.15)", teknisi: "rgba(59,130,246,0.15)", viewer: "rgba(74,222,128,0.15)" };

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { alerts, fetchAlerts, setModalOpen } = useNotificationStore();
  const [clock, setClock]       = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);

  // 1. Initial & Realtime Polling (setiap 5 detik)
  useEffect(() => {
    fetchAlerts(true);
    const interval = setInterval(() => {
      fetchAlerts(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // 2. Refresh setiap kali berpindah rute/halaman
  useEffect(() => {
    fetchAlerts(true);
  }, [location.pathname, fetchAlerts]);

  // 3. Refresh saat tab kembali aktif atau event kustom terpicu
  useEffect(() => {
    const handleFocus = () => fetchAlerts(true);
    const handleCustom = () => fetchAlerts(true);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("infraverse:refresh-alerts", handleCustom);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("infraverse:refresh-alerts", handleCustom);
    };
  }, [fetchAlerts]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); toast.success("Berhasil keluar."); }
    finally { clearAuth(); navigate("/login"); }
  };

  const totalAlerts = alerts?.total ?? 0;

  const activeNavItems = user?.role === "admin"
    ? [...navItems, { to: "/users", label: "Kelola User", Icon: Users, alertKey: null, desc: "Manajemen Akun" }]
    : navItems;

  const sidebarW = collapsed ? "w-[88px]" : "w-[288px]";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-base)" }}>

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`${sidebarW} flex flex-col flex-shrink-0 relative transition-all duration-300 ease-in-out z-30`}
        style={{
          background: "linear-gradient(180deg, #09142a 0%, #060d1c 60%, #040810 100%)",
          borderRight: "1px solid rgba(99,148,210,0.15)",
        }}
      >
        {/* Top accent glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.9) 30%, rgba(139,92,246,0.9) 70%, transparent 100%)" }}
        />

        {/* ---- Logo Header ---- */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: "1px solid rgba(99,148,210,0.1)" }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #6366f1)",
                boxShadow: "0 6px 24px rgba(59,130,246,0.55), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              IV
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#060d1c] shadow-[0_0_8px_#10b981]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xl font-black text-slate-100 tracking-tight leading-tight">InfraVerse</h1>
                <p className="text-[11px] font-bold mt-0.5 text-blue-400 uppercase tracking-widest">Digital Twin Platform</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700/60 transition-all flex-shrink-0 ml-1"
          >
            {collapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {/* ---- Clock & Alert Strip ---- */}
        {!collapsed && (
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(99,148,210,0.07)" }}
          >
            <div>
              <p className="font-mono text-base font-black tracking-wider text-slate-200">
                {clock.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wider">
                {clock.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
            {totalAlerts > 0 ? (
              <button
                onClick={() => setModalOpen(true)}
                title="Buka Pusat Notifikasi & Alarm Realtime"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 hover:border-red-400/60 hover:bg-red-500/20 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                style={{ background: "rgba(239,68,68,0.12)" }}
              >
                <Bell size={13} className="text-red-400 animate-bounce" />
                <span className="text-xs font-black text-red-400">{totalAlerts}</span>
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                title="Sistem Normal - Klik untuk rincian"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/15 transition-all cursor-pointer"
                style={{ background: "rgba(16,185,129,0.08)" }}
              >
                <Activity size={13} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Normal</span>
              </button>
            )}
          </div>
        )}

        {/* Collapsed Alert Icon */}
        {collapsed && (
          <div className="px-3 py-2.5 flex justify-center border-b border-slate-800/40">
            <button
              onClick={() => setModalOpen(true)}
              title={totalAlerts > 0 ? `${totalAlerts} Alarm Aktif` : "Status Normal"}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                totalAlerts > 0
                  ? "bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  : "bg-slate-800/60 border-slate-700/60 text-emerald-400 hover:bg-slate-700"
              }`}
            >
              <Bell size={18} className={totalAlerts > 0 ? "animate-bounce" : ""} />
            </button>
          </div>
        )}

        {/* ---- Navigation ---- */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {!collapsed && (
            <p className="text-[10px] font-black uppercase px-3 mb-4 tracking-[0.15em] text-slate-500">
              MENU NAVIGASI
            </p>
          )}
          {activeNavItems.map(({ to, label, Icon, alertKey, desc }) => {
            const badgeCount = alertKey ? (alerts[alertKey] ?? 0) : 0;
            return (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3.5 rounded-2xl font-bold transition-all duration-200 group relative ${
                    isActive
                      ? "text-white"
                      : "hover:bg-slate-800/70 text-slate-400 hover:text-slate-100"
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: "linear-gradient(135deg, rgba(37,99,235,0.35), rgba(99,102,241,0.25))",
                  border: "1px solid rgba(59,130,246,0.4)",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.2)",
                } : {
                  border: "1px solid transparent",
                }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex items-center min-w-0 ${collapsed ? "justify-center w-full" : "gap-3.5"}`}>
                      <span
                        className="transition-all duration-200 flex-shrink-0"
                        style={isActive
                          ? { color: "#60a5fa", filter: "drop-shadow(0 0 10px rgba(59,130,246,0.8))" }
                          : { color: "rgba(148,163,184,0.8)" }
                        }
                      >
                        <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
                      </span>
                      {!collapsed && (
                        <span className="min-w-0">
                          <span className="block font-extrabold text-[15px] leading-tight truncate">{label}</span>
                          {!isActive && (
                            <span className="block text-[10px] font-medium text-slate-500 truncate mt-0.5">{desc}</span>
                          )}
                        </span>
                      )}
                    </span>

                    {!collapsed && badgeCount > 0 && (
                      <span
                        className="text-white text-[11px] font-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 shadow-lg ml-auto"
                        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 2px 10px rgba(239,68,68,0.5)" }}
                      >
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                    {!collapsed && badgeCount === 0 && !isActive && (
                      <ChevronRight size={14} className="text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-auto" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ---- User Section ---- */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(99,148,210,0.1)" }}>
          <NavLink
            to="/profile"
            title={collapsed ? user?.name : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3.5 p-3.5 rounded-2xl transition-all group mb-2.5 ${
                isActive ? "bg-white/10 border border-white/10" : "hover:bg-white/5 border border-transparent"
              }`
            }
          >
            <div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-md overflow-hidden"
              style={{
                background: user?.avatar ? undefined : `linear-gradient(135deg, ${roleColor[user?.role] ?? "#3b82f6"}cc, ${roleColor[user?.role] ?? "#6366f1"})`,
                boxShadow: `0 4px 15px ${roleColor[user?.role] ?? "#3b82f6"}50`,
              }}
            >
              {user?.avatar
                ? <img src={`/storage/${user.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                : (user?.name?.charAt(0)?.toUpperCase() ?? "U")
              }
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#060d1c]"
                style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
              />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-black text-slate-100 leading-tight truncate">{user?.name ?? "User"}</p>
                <p
                  className="text-[11px] mt-0.5 font-bold truncate"
                  style={{ color: roleColor[user?.role] ?? "#60a5fa" }}
                >
                  {roleLabel[user?.role] ?? user?.role ?? "-"}
                </p>
              </div>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            title={collapsed ? "Keluar Sistem" : undefined}
            className={`w-full flex items-center justify-center px-4 py-3.5 rounded-2xl text-sm font-black transition-all border border-red-500/20 text-red-400 hover:text-white group ${collapsed ? "" : "gap-3"}`}
            style={{ background: "rgba(239,68,68,0.08)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
          >
            <LogOut size={18} />
            {!collapsed && <span>Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>

      {/* ===== REALTIME NOTIFICATION CENTER MODAL ===== */}
      <NotificationModal />
    </div>
  );
}
