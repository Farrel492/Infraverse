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
  MapPin, Server, Activity, DoorOpen, HardDrive, Sparkles 
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function BuildingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);

  const load = async () => {
    try { 
      const res = await buildingService.getAll(); 
      setBuildings(res.data); 
    } catch (err) {
      toast.error("Gagal memuat daftar fasilitas gedung.");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    try {
      await buildingService.remove(deleting.id);
      toast.success(`Gedung ${deleting.name} berhasil dihapus.`);
      setDeleting(null); 
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus gedung.");
    }
  };

  if (loading) return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="h-10 bg-slate-800/80 rounded-2xl w-64 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" }, 
        { label: "Manajemen Fasilitas Gedung" }
      ]} />

      {/* Header Banner */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Infrastruktur Fisik & Spasial
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-semibold">{buildings.length} Gedung Terdaftar</span>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
              Manajemen Gedung & Fasilitas Kampus
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Pusat inventaris spasial untuk pemetaan Digital Twin, hierarki lantai bertingkat, ruangan server NOC, dan rak kabinet 42U.
            </p>
          </div>

          <button 
            id="btn-add-building"
            onClick={() => navigate("/buildings/create")}
            className="flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_35px_rgba(59,130,246,0.6)] transition-all"
          >
            <Plus size={20} />
            <span>Daftarkan Gedung Baru</span>
          </button>
        </div>
      </div>

      {buildings.length === 0 ? (
        <EmptyState
          icon={<Building2 size={40} className="text-blue-400" />}
          title="Belum Ada Gedung Terdaftar"
          description="Tambahkan fasilitas gedung untuk mengonfigurasi struktur lantai, ruangan server NOC, dan rack cabinet 42U."
          action={{ label: "Daftarkan Gedung Baru", onClick: () => navigate("/buildings/create") }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {buildings.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="glass rounded-3xl p-7 border border-slate-700/60 hover:border-blue-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_45px_rgba(59,130,246,0.2)] transition-all group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md group-hover:scale-105 transition-transform">
                    <Building2 size={26} />
                  </div>
                  {canWrite && (
                    <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/buildings/${b.id}/edit`)}
                        title="Edit Konfigurasi Gedung"
                        className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        onClick={() => setDeleting(b)}
                        title="Hapus Gedung"
                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors shadow-sm"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-100 text-xl group-hover:text-blue-300 transition-colors leading-snug">
                    {b.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 text-xs mt-1.5 font-medium">
                    <MapPin size={14} className="text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{b.location ?? "Kampus Utama - Zona Belum Ditentukan"}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-300 line-clamp-2 leading-relaxed min-h-[58px]">
                  {b.description || "Fasilitas gedung smart campus terhubung ke monitoring NOC & Digital Twin."}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between relative z-10 gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Layers size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-100">{b.total_floors} Lt</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Kapasitas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <DoorOpen size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-100">{b.floors_count ?? b.total_floors}</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Terdaftar</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/buildings/${b.id}`)}
                  className="flex items-center gap-2 text-xs font-bold text-white px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all"
                >
                  <span>Inspeksi</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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
