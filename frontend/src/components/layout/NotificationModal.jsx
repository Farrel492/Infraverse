import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, X, RefreshCw, AlertTriangle, ShieldAlert,
  Server, Wrench, CheckCircle2, ChevronRight, Zap,
  Clock, ShieldCheck, Activity, ExternalLink
} from "lucide-react";
import useNotificationStore from "../../stores/useNotificationStore";

export default function NotificationModal() {
  const {
    isModalOpen,
    setModalOpen,
    summary,
    predictive,
    alerts,
    isRefreshing,
    fetchAlerts,
    lastUpdated,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState("all"); // 'all', 'down', 'maintenance', 'ai'
  const navigate = useNavigate();

  if (!isModalOpen) return null;

  const downDevices = summary?.down_devices ?? [];
  const upcomingMaintenances = summary?.upcoming_maintenances ?? [];
  const overdueMaintenances = summary?.overdue_maintenances ?? [];
  const predictiveRisks = predictive ?? [];

  const handleNavigate = (path) => {
    setModalOpen(false);
    navigate(path);
  };

  const handleManualRefresh = () => {
    fetchAlerts(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={() => setModalOpen(false)}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh] border border-blue-500/20"
        style={{
          background: "linear-gradient(180deg, #091326 0%, #070d1a 100%)",
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.8), 0 0 40px rgba(59,130,246,0.15)",
        }}
      >
        {/* Top Accent Gradient */}
        <div
          className="h-1.5 w-full"
          style={{
            background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
          }}
        />

        {/* Modal Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                alerts.total > 0
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              }`}
            >
              {alerts.total > 0 ? (
                <Bell size={22} className="animate-bounce" />
              ) : (
                <ShieldCheck size={22} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100 tracking-tight">
                  Pusat Notifikasi & Alarm Realtime
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sinkronisasi otomatis dengan database setiap 5 detik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Segarkan data notifikasi sekarang"
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-400" : ""} />
              <span>{isRefreshing ? "Menyinkronkan..." : "Segarkan"}</span>
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center border border-transparent hover:border-slate-700 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <span>Semua Alarm</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "all" ? "bg-white/20" : "bg-slate-800 text-slate-400"}`}>
              {alerts.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("down")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "down"
                ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Server size={13} />
            <span>Perangkat Down</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "down" ? "bg-white/20" : "bg-slate-800 text-slate-400"}`}>
              {alerts.down}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "maintenance"
                ? "bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Wrench size={13} />
            <span>Maintenance</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "maintenance" ? "bg-white/20" : "bg-slate-800 text-slate-400"}`}>
              {alerts.maintenance}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Zap size={13} />
            <span>Prediksi Risiko AI</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "ai" ? "bg-white/20" : "bg-slate-800 text-slate-400"}`}>
              {predictiveRisks.length}
            </span>
          </button>
        </div>

        {/* Modal Body / Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
          {/* Empty State - All Good / No Data */}
          {alerts.total === 0 && predictiveRisks.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <CheckCircle2 size={42} />
              </div>
              <h4 className="text-xl font-black text-slate-100 mb-1">
                Semua Sistem Normal & Terkendali
              </h4>
              <p className="text-sm text-slate-400 max-w-md mb-4">
                Tidak ada anomali perangkat yang down, jadwal maintenance overdue, ataupun peringatan risiko kritis pada data saat ini.
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400">
                <Clock size={13} className="text-blue-400" />
                <span>Terakhir diverifikasi: {lastUpdated ? lastUpdated.toLocaleTimeString("id-ID") : "Baru saja"}</span>
              </div>
            </div>
          )}

          {/* DOWN DEVICES LIST */}
          {(activeTab === "all" || activeTab === "down") && downDevices.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Perangkat Terputus / Down ({downDevices.length})
                </p>
                <button
                  onClick={() => handleNavigate("/assets")}
                  className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  Kelola Aset <ChevronRight size={13} />
                </button>
              </div>

              {downDevices.map((d) => (
                <div
                  key={`down-${d.id}`}
                  onClick={() => handleNavigate(`/assets`)}
                  className="p-3.5 rounded-2xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                      <Server size={18} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100 group-hover:text-red-300 transition-colors">
                        {d.name}
                      </h5>
                      <p className="text-xs text-slate-400">
                        Tipe: <span className="text-slate-300 font-semibold uppercase">{d.type}</span> {d.ip_address && `• IP: ${d.ip_address}`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                    DOWN
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* OVERDUE MAINTENANCE LIST */}
          {(activeTab === "all" || activeTab === "maintenance") && overdueMaintenances.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <Clock size={14} />
                  Maintenance Terlambat / Overdue ({overdueMaintenances.length})
                </p>
                <button
                  onClick={() => handleNavigate("/maintenance")}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  Buka Jadwal <ChevronRight size={13} />
                </button>
              </div>

              {overdueMaintenances.map((m) => (
                <div
                  key={`overdue-${m.id}`}
                  onClick={() => handleNavigate("/maintenance")}
                  className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 flex-shrink-0">
                      <Wrench size={18} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100 group-hover:text-red-300 transition-colors">
                        Perawatan: {m.device ?? "Perangkat"}
                      </h5>
                      <p className="text-xs text-red-400/90 font-medium">
                        Jadwal: {new Date(m.scheduled_date).toLocaleDateString("id-ID")} (Melewati Batas Waktu)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
                    OVERDUE
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* UPCOMING MAINTENANCE LIST */}
          {(activeTab === "all" || activeTab === "maintenance") && upcomingMaintenances.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Wrench size={14} />
                  Jadwal Maintenance Mendatang ({upcomingMaintenances.length})
                </p>
                <button
                  onClick={() => handleNavigate("/maintenance")}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  Buka Jadwal <ChevronRight size={13} />
                </button>
              </div>

              {upcomingMaintenances.map((m) => (
                <div
                  key={`up-${m.id}`}
                  onClick={() => handleNavigate("/maintenance")}
                  className="p-3.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        Perawatan: {m.device ?? "Perangkat"}
                      </h5>
                      <p className="text-xs text-slate-400">
                        Tanggal: <span className="text-slate-200">{new Date(m.scheduled_date).toLocaleDateString("id-ID")}</span> • Tipe: {m.type}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    TERJADWAL
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AI PREDICTIVE RISKS */}
          {(activeTab === "all" || activeTab === "ai") && predictiveRisks.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Zap size={14} />
                  Analisis Risiko Prediktif AI ({predictiveRisks.length})
                </p>
                <button
                  onClick={() => handleNavigate("/dashboard")}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Dashboard AI <ChevronRight size={13} />
                </button>
              </div>

              {predictiveRisks.slice(0, 5).map((risk, idx) => (
                <div
                  key={`risk-${idx}`}
                  className="p-3.5 rounded-2xl border border-purple-500/25 bg-purple-500/10 hover:bg-purple-500/15 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-100">
                        {risk.name}
                      </h5>
                      <p className="text-xs text-purple-300/80">
                        {risk.reasons?.join(" • ") || "Perlu inspeksi teknis"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${
                      risk.risk === "high"
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    }`}
                  >
                    RISIKO {risk.risk?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Total Perangkat: <strong className="text-slate-200">{summary?.total_devices ?? 0}</strong></span>
            <span>Total Maintenance: <strong className="text-slate-200">{summary?.total_maintenances ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Activity size={12} className="text-emerald-400" />
            <span>InfraVerse Realtime Daemon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
