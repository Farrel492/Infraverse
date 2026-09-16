import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService.js";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import { SkeletonTable } from "../../components/shared/Skeleton.jsx";
import toast from "react-hot-toast";
import {
  Users, UserPlus, Search, Edit2, Trash2, KeyRound,
  ShieldCheck, Mail, Phone, ShieldAlert, CheckCircle2, UserCheck
} from "lucide-react";
import { motion } from "framer-motion";

const ROLE_BADGE = {
  admin:   "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]",
  teknisi: "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]",
  viewer:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
};

const ROLE_LABEL = { admin:"Administrator", teknisi:"Teknisi IT", viewer:"Viewer" };

export default function UserListPage() {
  const navigate                    = useNavigate();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [resetting, setResetting]   = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ search: debouncedSearch, role: filterRole });
      setUsers(res.data);
    } catch {
      toast.error("Gagal memuat daftar pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [debouncedSearch, filterRole]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    setSaving(true);
    try {
      await userService.resetPassword(resetting.id, { password: newPassword });
      toast.success(`Kata sandi akun ${resetting.name} berhasil diperbarui.`);
      setResetting(null);
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal mereset kata sandi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await userService.remove(deleting.id);
      toast.success("Akun pengguna berhasil dihapus.");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus pengguna.");
    }
  };

  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === "admin").length,
    teknisi: users.filter(u => u.role === "teknisi").length,
    viewer: users.filter(u => u.role === "viewer").length,
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Kelola Akun Pengguna" }]} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 glass p-7 rounded-3xl border border-slate-700/60 shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100">
            Manajemen Akun & Hak Akses
          </h2>
          <p className="text-slate-400 text-sm font-semibold mt-1.5">
            Kelola Otorisasi Administrator, Teknisi IT, dan Viewer Platform InfraVerse
          </p>
        </div>

        <button onClick={() => navigate("/users/create")}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all">
          <UserPlus size={18} /> Tambah Akun Pengguna
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: "Total Akun", value: counts.total, icon: Users, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
          { label: "Administrator", value: counts.admin, icon: ShieldAlert, color: "text-red-400 border-red-500/30 bg-red-500/10" },
          { label: "Teknisi IT", value: counts.teknisi, icon: ShieldCheck, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
          { label: "Viewer", value: counts.viewer, icon: UserCheck, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className={`glass p-5 rounded-3xl border ${s.color} flex items-center gap-4 shadow-lg`}>
            <div className="p-3 rounded-2xl bg-slate-900/80">
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-slate-100">{s.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[280px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari nama, email, telepon..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all" />
          </div>

          {/* Role Filter */}
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-300 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all">
            <option value="">Semua Peran (Roles)</option>
            <option value="admin">Administrator</option>
            <option value="teknisi">Teknisi IT</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      {loading ? <SkeletonTable rows={5} /> : (
        <div className="glass-strong rounded-3xl border border-slate-700/60 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider text-xs font-black">
                  <th className="px-6 py-4.5">Pengguna</th>
                  <th className="px-6 py-4.5">Role / Otorisasi</th>
                  <th className="px-6 py-4.5">Nomor Telepon</th>
                  <th className="px-6 py-4.5">Tanggal Terdaftar</th>
                  <th className="px-6 py-4.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-100 text-sm">{u.name}</p>
                          <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Mail size={12} className="text-blue-400" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4.5">
                      <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${ROLE_BADGE[u.role] ?? ""}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4.5 text-slate-300 font-mono text-xs">
                      {u.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-slate-500" /> {u.phone}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4.5 text-slate-400 text-xs font-semibold">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>

                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setResetting(u); setNewPassword(""); }}
                          title="Reset Password"
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all shadow">
                          <KeyRound size={15} />
                        </button>
                        <button onClick={() => navigate(`/users/${u.id}/edit`)}
                          title="Edit Akun"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleting(u)}
                          title="Hapus Akun"
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all shadow">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetting && (
        <Modal
          title={`Reset Kata Sandi: ${resetting.name}`}
          subtitle="Masukkan password baru untuk mengganti password lama pengguna ini."
          maxWidth="max-w-md"
          onClose={() => setResetting(null)}
        >
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Kata Sandi Baru <span className="text-amber-400">*</span>
              </label>
              <input type="password" required value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-amber-500 transition-all" />
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => setResetting(null)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all disabled:opacity-50">
                {saving ? "Mereset..." : "Update Kata Sandi"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <ConfirmDialog
          message={`Hapus akun pengguna "${deleting.name}" (${deleting.email})?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
