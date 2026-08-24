import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import { Building2, Plus, Edit2, Trash2, ChevronRight, Layers, MapPin, Server, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function BuildingPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [form, setForm]           = useState({ name:"", location:"", total_floors:1, description:"" });

  const load = async () => {
    try { const res = await buildingService.getAll(); setBuildings(res.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name:"", location:"", total_floors:1, description:"" });
    setError(""); setShowForm(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ name:b.name, location:b.location??""  , total_floors:b.total_floors, description:b.description??"" });
    setError(""); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
      if (editing) await buildingService.update(editing.id, fd);
      else await buildingService.create(fd);
      setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.message ?? "Terjadi kesalahan.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await buildingService.remove(deleting.id);
    setDeleting(null); load();
  };

  if (loading) return (
    <div className="p-8">
      <div className="h-8 bg-slate-800/80 rounded-xl w-48 animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({length:3}).map((_,i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Smart Facility Gedung" }]} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
            Manajemen Gedung & Fasilitas
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {buildings.length} Gedung Terhubung dalam Ekosistem Smart Campus
          </p>
        </div>
        {canWrite && (
          <button onClick={() => navigate("/buildings/create")}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all">
            <Plus size={18} /> Tambah Gedung Baru
          </button>
        )}
      </div>

      {buildings.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} className="text-blue-400" />}
          title="Belum Ada Gedung Terdaftar"
          description="Tambahkan fasilitas gedung untuk mengonfigurasi struktur lantai, ruangan, dan rack server."
          action={canWrite ? { label: "Tambah Gedung Baru", onClick: () => navigate("/buildings/create") } : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {buildings.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className="glass rounded-2xl p-6 border border-slate-700/60 hover:border-blue-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Building2 size={24} />
                  </div>
                  {canWrite && (
                    <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/buildings/${b.id}/edit`)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleting(b)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-slate-100 text-lg group-hover:text-blue-300 transition-colors">{b.name}</h3>
                
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                  <MapPin size={13} className="text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{b.location ?? "Kampus Utama"}</span>
                </div>

                {b.description && (
                  <p className="text-slate-400 text-xs mt-3 line-clamp-2 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                    {b.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Layers size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{b.total_floors} Lt</p>
                      <p className="text-[10px] text-slate-500">Kapasitas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Activity size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{b.floors_count ?? b.total_floors}</p>
                      <p className="text-[10px] text-slate-500">Terdaftar</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => navigate(`/buildings/${b.id}`)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all">
                  Inspeksi <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal 
          title={editing ? "Edit Konfigurasi Gedung" : "Daftarkan Gedung Baru"} 
          subtitle="Masukkan informasi spasial gedung untuk pemetaaan Digital Twin & monitoring NOC."
          maxWidth="max-w-xl"
          onClose={() => setShowForm(false)}
        >
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs font-semibold text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nama Gedung / Fasilitas <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <input type="text" required value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Misal: Gedung Rektorat (Pusat Data Utama)"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:font-normal" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Lokasi / Zona Kampus
                </label>
                <input type="text" value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}
                  placeholder="Kampus Utama - Zona A"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Jumlah Lantai Fisik <span className="text-blue-400">*</span>
                </label>
                <input type="number" min={1} required value={form.total_floors}
                  onChange={e => setForm({...form, total_floors: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Deskripsi Infrastruktur
              </label>
              <textarea rows={3} value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Jelaskan peran gedung ini, contoh: Menampung NOC Utama, Server Farm, Router BGP Core, dan Sistem UPS Cadangan."
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none transition-all" />
            </div>

            <div className="flex gap-4 pt-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? "Menyimpan Gedung..." : "Simpan Fasilitas Gedung"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Hapus gedung "${deleting.name}"? Semua lantai, ruangan, rack, dan perangkat di dalamnya juga akan terhapus.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
