import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Server, Network,
  Zap, Globe, Wrench, LogOut, ChevronRight, Bell,
  PanelLeftClose, PanelLeft, Users, Activity, X
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

const roleConfig = {
  admin:   { color: "#f87171", label: "Administrator",  bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   glow: "rgba(239,68,68,0.3)" },
  teknisi: { color: "#60a5fa", label: "Teknisi IT",     bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)",  glow: "rgba(59,130,246,0.3)" },
  viewer:  { color: "#34d399", label: "System Viewer",  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)",  glow: "rgba(52,211,153,0.3)" },
};

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { alerts, fetchAlerts, setModalOpen } = useNotificationStore();
  const [clock, setClock]         = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Polling & refresh alerts
  useEffect(() => {
    fetchAlerts(true);
    const interval = setInterval(() => fetchAlerts(true), 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => { fetchAlerts(true); }, [location.pathname, fetchAlerts]);

  useEffect(() => {
    const handleFocus  = () => fetchAlerts(true);
    const handleCustom = () => fetchAlerts(true);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("infraverse:refresh-alerts", handleCustom);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("infraverse:refresh-alerts", handleCustom);
    };
  }, [fetchAlerts]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await authService.logout(); toast.success("Berhasil keluar dari sistem."); }
    finally { clearAuth(); navigate("/login"); }
  };

  const totalAlerts = alerts?.total ?? 0;
  const role = user?.role ?? "viewer";
  const rc   = roleConfig[role] ?? roleConfig.viewer;

  const activeNavItems = role === "admin"
    ? [...navItems, { to: "/users", label: "Kelola User", Icon: Users, alertKey: null, desc: "Manajemen Akun" }]
    : navItems;

  const sidebarW = collapsed ? "72px" : "272px";

  // Sidebar content component (shared between desktop and mobile)
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">

      {/* ─── Top accent glow line ─── */}
      <div className="accent-line-top" />

      {/* ─── Logo Header ─── */}
      <div
        className="flex items-center px-4 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(59,130,246,0.08)" }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Logo Icon */}
          <div
            className="relative w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #4f46e5)",
              boxShadow: "0 4px 20px rgba(59,130,246,0.50), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            IV
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{
                background: "#22c55e",
                borderColor: "#05091a",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0 overflow-hidden">
              <h1 className="text-base font-black text-slate-100 tracking-tight leading-none">InfraVerse</h1>
              <p className="text-[10px] font-bold mt-0.5 uppercase tracking-widest" style={{ color: "#3b82f6" }}>
                Digital Twin
              </p>
            </div>
          )}
        </div>

        {/* Collapse/Close Button */}
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all flex-shrink-0"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? "Buka Sidebar" : "Sembunyikan"}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-700/50 border border-slate-700/40 transition-all flex-shrink-0 ml-auto"
          >
            {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
          </button>
        )}
      </div>

      {/* ─── Clock & Alert Strip ─── */}
      {(!collapsed || isMobile) && (
        <div
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(59,130,246,0.06)" }}
        >
          <div>
            <p className="font-mono text-sm font-black tracking-wider text-slate-200">
              {clock.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">
              {clock.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            title={totalAlerts > 0 ? `${totalAlerts} Alarm Aktif` : "Status Normal"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold"
            style={
              totalAlerts > 0
                ? { background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.30)", color: "#f87171", boxShadow: "0 0 12px rgba(239,68,68,0.20)" }
                : { background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.20)", color: "#34d399" }
            }
          >
            {totalAlerts > 0 ? (
              <><Bell size={12} className="animate-bounce" /><span>{totalAlerts}</span></>
            ) : (
              <><Activity size={12} /><span className="text-[9px] uppercase tracking-wider">Normal</span></>
            )}
          </button>
        </div>
      )}

      {/* Collapsed Bell */}
      {collapsed && !isMobile && (
        <div className="flex justify-center py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(59,130,246,0.06)" }}>
          <button
            onClick={() => setModalOpen(true)}
            title={totalAlerts > 0 ? `${totalAlerts} Alarm` : "Normal"}
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer"
            style={
              totalAlerts > 0
                ? { background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.35)", color: "#f87171", boxShadow: "0 0 12px rgba(239,68,68,0.25)" }
                : { background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.18)", color: "#34d399" }
            }
          >
            <Bell size={16} className={totalAlerts > 0 ? "animate-bounce" : ""} />
          </button>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {(!collapsed || isMobile) && (
          <p className="text-[9px] font-black uppercase px-3 mb-3 tracking-[0.18em]" style={{ color: "#1e3a5f" }}>
            Navigasi
          </p>
        )}

        {activeNavItems.map(({ to, label, Icon, alertKey, desc }) => {
          const badgeCount = alertKey ? (alerts[alertKey] ?? 0) : 0;
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed && !isMobile ? label : undefined}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-xl font-bold transition-all duration-200 group relative ${collapsed && !isMobile ? "justify-center" : "gap-3"} ${
                  isActive
                    ? "text-white sidebar-nav-item active"
                    : "text-slate-400 hover:text-slate-100 sidebar-nav-item"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon */}
                  <span
                    className="flex-shrink-0 transition-all duration-200"
                    style={isActive
                      ? { color: "#60a5fa", filter: "drop-shadow(0 0 8px rgba(59,130,246,0.8))" }
                      : { color: "rgba(100,116,139,0.9)" }
                    }
                  >
                    <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>

                  {/* Labels */}
                  {(!collapsed || isMobile) && (
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-extrabold leading-tight truncate">{label}</span>
                      {!isActive && (
                        <span className="block text-[10px] font-medium truncate mt-0.5" style={{ color: "#1e3a5f" }}>
                          {desc}
                        </span>
                      )}
                    </span>
                  )}

                  {/* Badge */}
                  {(!collapsed || isMobile) && badgeCount > 0 && (
                    <span
                      className="text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-auto"
                      style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 2px 8px rgba(239,68,68,0.55)" }}
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                  {(!collapsed || isMobile) && badgeCount === 0 && !isActive && (
                    <ChevronRight size={13} className="text-slate-700 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0 ml-auto" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ─── User Section ─── */}
      <div className="flex-shrink-0 p-2.5 space-y-1.5" style={{ borderTop: "1px solid rgba(59,130,246,0.08)" }}>
        {/* Profile Link */}
        <NavLink
          to="/profile"
          title={collapsed && !isMobile ? user?.name : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 p-2.5 rounded-xl transition-all group ${collapsed && !isMobile ? "justify-center" : ""} ${
              isActive ? "bg-white/8 border border-white/8" : "hover:bg-white/4 border border-transparent"
            }`
          }
        >
          {/* Avatar */}
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 overflow-hidden"
            style={{
              background: user?.avatar ? undefined : `linear-gradient(135deg, ${rc.color}bb, ${rc.color})`,
              boxShadow: `0 3px 12px ${rc.glow}`,
            }}
          >
            {user?.avatar
              ? <img
                  src={user.avatar.startsWith("http") || user.avatar.startsWith("/storage/") ? user.avatar : `/storage/${user.avatar}`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              : (user?.name?.charAt(0)?.toUpperCase() ?? "U")
            }
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px]"
              style={{ background: "#22c55e", borderColor: "#05091a", boxShadow: "0 0 6px #22c55e" }}
            />
          </div>

          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-black text-slate-100 leading-tight truncate">{user?.name ?? "User"}</p>
              <p className="text-[10px] mt-0.5 font-bold truncate" style={{ color: rc.color }}>
                {rc.label}
              </p>
            </div>
          )}
        </NavLink>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={collapsed && !isMobile ? "Keluar Sistem" : undefined}
          className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer group ${collapsed && !isMobile ? "" : "gap-2.5"}`}
          style={{
            background: "rgba(239,68,68,0.07)",
            borderColor: "rgba(239,68,68,0.18)",
            color: "#f87171",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(239,68,68,0.18)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(239,68,68,0.07)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)";
            e.currentTarget.style.color = "#f87171";
          }}
        >
          <LogOut size={16} />
          {(!collapsed || isMobile) && <span>Keluar Sistem</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-base)" }}>

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 relative z-30 transition-all duration-300 ease-in-out"
        style={{
          width: sidebarW,
          background: "var(--grad-sidebar)",
          borderRight: "1px solid rgba(59,130,246,0.10)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(2,8,20,0.70)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== MOBILE SIDEBAR ===== */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 lg:hidden flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: "272px",
          background: "var(--grad-sidebar)",
          borderRight: "1px solid rgba(59,130,246,0.10)",
        }}
      >
        <SidebarContent isMobile />
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{
            background: "rgba(5,12,26,0.95)",
            borderBottom: "1px solid rgba(59,130,246,0.10)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/40 transition-all"
          >
            <PanelLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #4f46e5)" }}
            >
              IV
            </div>
            <span className="text-sm font-black text-slate-100">InfraVerse</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all"
            style={
              totalAlerts > 0
                ? { background: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.30)", color: "#f87171" }
                : { background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.18)", color: "#34d399" }
            }
          >
            <Bell size={16} className={totalAlerts > 0 ? "animate-bounce" : ""} />
            {totalAlerts > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-black text-white rounded-full flex items-center justify-center"
                style={{ background: "#ef4444" }}
              >
                {totalAlerts > 9 ? "9+" : totalAlerts}
              </span>
            )}
          </button>
        </div>

        <main className="flex-1 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>

      {/* ===== NOTIFICATION MODAL ===== */}
      <NotificationModal />
    </div>
  );
}
