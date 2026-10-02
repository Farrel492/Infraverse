import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import {
  Building2, Plus, Edit2, Trash2, ChevronRight, Layers,
  MapPin, Server, DoorOpen, Sparkles, Activity
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { refreshAlerts } from "../../stores/useNotificationStore";

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, type: "spring", stiffness: 90, damping: 18 } }),
};

export default function BuildingPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);

  const load = async () => {
    try {
      const res = await buildingService.getAll();
      setBuildings(res.data);
    } catch {
      toast.error("Gagal memuat daftar fasilitas gedung.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    try {
      await buildingService.remove(deleting.id);
      toast.success(`Gedung "${deleting.name}" berhasil dihapus.`);
      setDeleting(null);
      load();
      refreshAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus gedung.");
    }
  };

  if (loading) return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="h-8 rounded-xl w-48 shimmer" />
      <div className="h-32 rounded-3xl shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Manajemen Gedung" }]} />

      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{
                  background: "rgba(59,130,246,0.10)",
                  border: "1px solid rgba(59,130,246,0.22)",
                  color: "#93c5fd",
                }}
              >
                Infrastruktur Fisik
              </span>
              <span style={{ color: "#1e3a5f" }}>•</span>
              <span className="text-xs font-bold" style={{ color: "#334155" }}>
                {buildings.length} Gedung Terdaftar
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-gradient-brand">
              Manajemen Gedung &amp; Fasilitas
            </h1>
            <p className="text-sm mt-1.5 max-w-xl leading-relaxed font-medium" style={{ color: "rgba(148,163,184,0.65)" }}>
              Pusat inventaris spasial untuk pemetaan Digital Twin, hierarki lantai, ruangan server NOC, dan rack cabinet 42U.
            </p>
          </div>

          {canWrite && (
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              id="btn-add-building"
              onClick={() => navigate("/buildings/create")}
              className="flex items-center gap-2.5 px-5 py-3.5 text-white text-sm font-black rounded-2xl transition-all"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #3b82f6, #4f46e5)",
                boxShadow: "0 6px 28px rgba(59,130,246,0.40)",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 36px rgba(59,130,246,0.60)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(59,130,246,0.40)"}
            >
              <Plus size={18} />
              Daftarkan Gedung Baru
            </motion.button>
          )}
        </div>
      </div>

      {/* ─── Content ─── */}
      {buildings.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} style={{ color: "#1e3a5f" }} />}
          title="Belum Ada Gedung Terdaftar"
          description="Tambahkan fasilitas gedung untuk mengonfigurasi struktur lantai, ruangan server NOC, dan rack cabinet 42U."
          action={canWrite ? { label: "Daftarkan Gedung Baru", onClick: () => navigate("/buildings/create") } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {buildings.map((b, idx) => (
            <motion.div
              key={b.id}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="glass-card flex flex-col justify-between group relative overflow-hidden"
              style={{ padding: "1.5rem" }}
            >
              {/* Card glow decoration */}
              <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
              />

              {/* Card top */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{
                      background: "linear-gradient(135deg, rgba(37,99,235,0.20), rgba(99,102,241,0.15))",
                      border: "1px solid rgba(59,130,246,0.25)",
                    }}
                  >
                    <Building2 size={22} style={{ color: "#60a5fa" }} />
                  </div>

                  {/* Actions */}
                  {canWrite && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => navigate(`/buildings/${b.id}/edit`)}
                        title="Edit Gedung"
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        style={{ background: "rgba(30,50,80,0.8)", border: "1px solid rgba(79,140,220,0.18)", color: "#94a3b8" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(37,99,235,0.20)"; e.currentTarget.style.color = "#60a5fa"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.35)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(30,50,80,0.8)"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(79,140,220,0.18)"; }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleting(b)}
                        title="Hapus Gedung"
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                        style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.22)", color: "#f87171" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.20)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.40)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.09)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.22)"; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3
                  className="font-extrabold text-lg leading-snug mb-1 transition-colors duration-200"
                  style={{ color: "#f0f6ff" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#93c5fd"}
                  onMouseLeave={e => e.currentTarget.style.color = "#f0f6ff"}
                >
                  {b.name}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-2 mb-3 text-slate-400 font-semibold">
                  <MapPin size={14} className="text-indigo-400 flex-shrink-0" />
                  <span className="text-xs truncate">
                    {b.location ?? "Kampus Utama — Zona Belum Ditentukan"}
                  </span>
                </div>

                {/* Description */}
                <div
                  className="text-xs leading-relaxed truncate-2 min-h-[44px] p-3.5 rounded-2xl border"
                  style={{
                    background: "rgba(5, 12, 26, 0.70)",
                    borderColor: "rgba(79, 140, 220, 0.14)",
                    color: "#cbd5e1",
                  }}
                >
                  {b.description || "Fasilitas gedung smart campus terhubung ke monitoring NOC & Digital Twin."}
                </div>
              </div>

              {/* Card footer */}
              <div
                className="mt-5 pt-4 flex items-center justify-between gap-3"
                style={{ borderTop: "1px solid rgba(79,140,220,0.12)" }}
              >
                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
                    >
                      <Layers size={14} style={{ color: "#a78bfa" }} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-100">{b.total_floors} Lt</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lantai</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}
                    >
                      <DoorOpen size={14} style={{ color: "#34d399" }} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-100">{b.floors_count ?? b.total_floors}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terdaftar</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/buildings/${b.id}`)}
                  className="flex items-center gap-1.5 text-xs font-black text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                    boxShadow: "0 4px 14px rgba(59,130,246,0.30)",
                  }}
                >
                  Inspeksi
                  <ChevronRight size={13} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirm Delete */}
      {deleting && (
        <ConfirmDialog
          message={`Hapus gedung "${deleting.name}"? Semua data lantai, ruangan, rack cabinet 42U, dan perangkat hardware di dalamnya akan ikut terhapus secara permanen.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
