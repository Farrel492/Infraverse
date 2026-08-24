import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Building2, Server, Network,
  Zap, Globe, Wrench, LogOut, ChevronRight, Bell
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import { authService } from "../../services/authService";
import { analyticsService } from "../../services/analyticsService";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard",    label: "Dashboard",    Icon: LayoutDashboard, alertKey: null },
  { to: "/buildings",    label: "Gedung",        Icon: Building2,       alertKey: null },
  { to: "/assets",       label: "Aset",          Icon: Server,          alertKey: "down" },
  { to: "/mapping",      label: "Peta Jaringan", Icon: Network,         alertKey: null },
  { to: "/simulation",   label: "Simulasi",      Icon: Zap,             alertKey: null },
  { to: "/digital-twin", label: "Digital Twin",  Icon: Globe,           alertKey: null },
  { to: "/maintenance",  label: "Maintenance",   Icon: Wrench,          alertKey: "maintenance" },
];

const roleColor = { admin:"#f87171", teknisi:"#60a5fa", viewer:"#4ade80" };
const roleLabel = { admin:"Administrator", teknisi:"Teknisi IT", viewer:"Viewer" };

export default function MainLayout() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState({ down: 0, maintenance: 0 });
  const [clock, setClock]   = useState(new Date());

  useEffect(() => {
    analyticsService.getSummary().then(res => {
      setAlerts({
        down:        res.data.by_status?.down ?? 0,
        maintenance: res.data.upcoming_maintenances?.length ?? 0,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); toast.success("Berhasil keluar."); }
    finally { clearAuth(); navigate("/login"); }
  };

  const totalAlerts = (alerts.down ?? 0) + (alerts.maintenance ?? 0);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg-base)" }}>

      {/* ===== SIDEBAR ===== */}
      <aside
        className="w-68 flex flex-col flex-shrink-0 relative"
        style={{
          background: "linear-gradient(180deg, #0a1628 0%, #080f1f 100%)",
          borderRight: "1px solid rgba(99,148,210,0.15)",
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.8), rgba(139,92,246,0.8), transparent)" }}
        />

        {/* Logo */}
        <div className="p-5 pb-4" style={{ borderBottom: "1px solid rgba(99,148,210,0.1)" }}>
          <div className="flex items-center gap-3.5">
            <div
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                boxShadow: "0 6px 20px rgba(59,130,246,0.5)",
              }}
            >
              IV
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-slate-100 tracking-tight leading-none">InfraVerse</h1>
              <p className="text-xs font-bold mt-1 text-blue-400">Digital Twin Platform</p>
            </div>
          </div>
        </div>

        {/* Clock strip */}
        <div className="px-5 py-2.5" style={{ borderBottom: "1px solid rgba(99,148,210,0.08)" }}>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm font-bold text-slate-300">
              {clock.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            {totalAlerts > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/30">
                <Bell size={12} className="text-red-400 animate-bounce" />
                <span className="text-xs font-black text-red-400">{totalAlerts} Alerts</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <p
            className="text-xs font-black uppercase px-3 mb-3 mt-1 tracking-widest text-slate-400"
          >
            MAIN MENU
          </p>
          {navItems.map(({ to, label, Icon, alertKey }) => {
            const badgeCount = alertKey ? (alerts[alertKey] ?? 0) : 0;
            return (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                    isActive ? "nav-active bg-blue-600/20 border border-blue-500/40 text-white shadow-lg" : "hover:bg-slate-800/60 text-slate-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <span
                        className="transition-all duration-200"
                        style={isActive
                          ? { color: "#60a5fa", filter: "drop-shadow(0 0 8px rgba(59,130,246,0.6))" }
                          : { color: "rgba(148,163,184,0.8)" }
                        }
                      >
                        <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
                      </span>
                      <span
                        className="font-bold text-sm transition-colors"
                        style={{ color: isActive ? "#ffffff" : "rgba(226,232,240,0.85)" }}
                      >
                        {label}
                      </span>
                    </span>
                    {badgeCount > 0 ? (
                      <span
                        className="text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 shadow-md"
                        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 2px 10px rgba(239,68,68,0.5)" }}
                      >
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    ) : (
                      !isActive && (
                        <ChevronRight size={13} style={{ color: "rgba(99,148,210,0.3)" }} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(99,148,210,0.1)" }}>
          <NavLink to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all group mb-2 ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
              }`
            }
          >
            <div
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black text-white flex-shrink-0 shadow-md"
              style={{
                background: `linear-gradient(135deg, ${roleColor[user?.role] ?? "#3b82f6"}90, ${roleColor[user?.role] ?? "#6366f1"})`,
                boxShadow: `0 3px 12px ${roleColor[user?.role] ?? "#3b82f6"}45`,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background: "#22c55e", borderColor: "#080f1f" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-100 leading-snug truncate">
                {user?.name ?? "User"}
              </p>
              <p className="text-xs mt-0.5 truncate font-semibold" style={{ color: roleColor[user?.role] ?? "#60a5fa" }}>
                {roleLabel[user?.role] ?? user?.role ?? "-"}
              </p>
            </div>
            <ChevronRight size={14} style={{ color: "rgba(99,148,210,0.3)" }} className="flex-shrink-0" />
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-800"
            style={{ color: "rgba(148,163,184,0.6)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "rgba(148,163,184,0.6)"; e.currentTarget.style.borderColor = ""; }}
          >
            <LogOut size={15} />
            Keluar Sistem
          </button>
        </div>
      </aside>


      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}


