import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userService } from "../../services/userService.js";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Users, ArrowLeft, Save, ShieldCheck, Mail, Lock, Phone,
  Eye, EyeOff, UserCheck, Shield, AlertCircle, Sparkles, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";

const ROLES = [
  {
    value: "admin",
    label: "Administrator System",
    badge: "Full Privilege",
    color: "red",
    desc: "Hak akses penuh ke seluruh modul sistem: Manajemen Gedung, Aset, Pengguna, Topologi, dan Simulasi Disaster Recovery.",
    capabilities: ["Kelola Gedung & Rack", "Manajemen User & Reset Password", "Konfigurasi Perangkat IT", "Uji Simulasi & Maintenance"],
  },
  {
    value: "teknisi",
    label: "Teknisi IT & Network",
    badge: "Operasional NOC",
    color: "blue",
    desc: "Akses operasional lapangan: Inventarisasi hardware aset, update status inspeksi rack 42U, eksekusi maintenance, dan topologi.",
    capabilities: ["Input & Edit Aset IT", "Konfigurasi Rack & Port", "Update Status Pemeliharaan", "Monitoring Topologi Jaringan"],
  },
  {
    value: "viewer",
    label: "System Viewer",
    badge: "Read Only",
    color: "emerald",
    desc: "Akses pemantauan (Read-Only) untuk pimpinan institusi dan auditor: Dashboard KPI, Digital Twin 3D, dan analitik energi.",
    capabilities: ["Monitoring Dashboard Real-Time", "Inspeksi Visual Digital Twin 3D", "Melihat Laporan Aset & Servis", "Tinjau Riwayat Simulasi"],
  },
];

export default function UserFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "teknisi",
    phone: "",
  });

  useEffect(() => {
    if (isEditing) {
      userService.getOne(id)
        .then(res => {
          const u = res.data;
          setForm({
            name: u.name ?? "",
            email: u.email ?? "",
            password: "",
            role: u.role ?? "teknisi",
            phone: u.phone ?? "",
          });
        })
        .catch(() => {
          toast.error("Gagal memuat data pengguna.");
          navigate("/users");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email pengguna wajib diisi.");
      return;
    }
    if (!isEditing && (!form.password || form.password.length < 8)) {
      toast.error("Kata sandi akun baru minimal 8 karakter.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isEditing) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          phone: form.phone ? form.phone.trim() : null,
        };
        if (form.password && form.password.trim().length >= 8) {
          payload.password = form.password.trim();
        }
        await userService.update(id, payload);
        toast.success("Data akun pengguna berhasil diperbarui!");
      } else {
        await userService.create({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone ? form.phone.trim() : null,
        });
        toast.success("Akun pengguna baru berhasil didaftarkan ke sistem!");
      }
      navigate("/users");
    } catch (err) {
      const errs = err.response?.data?.errors;
      const msg = errs ? Object.values(errs).flat().join(" ") : (err.response?.data?.message ?? "Terjadi kesalahan saat menyimpan akun pengguna.");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedRoleObj = ROLES.find(r => r.value === form.role) || ROLES[1];

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-blue-500/20" />
          <p className="text-base font-semibold text-slate-300">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kelola Pengguna", href: "/users" },
        { label: isEditing ? `Edit Akun: ${form.name || "User"}` : "Pendaftaran Pengguna Baru" }
      ]} />

      {/* Top Banner Header */}
      <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate("/users")}
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {isEditing ? "Mode Edit Pengguna" : "Pendaftaran Akun Baru"}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Manajemen Identitas & Hak Akses</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                {isEditing ? `Edit Konfigurasi Akun: ${form.name}` : "Pendaftaran Pengguna & Hak Akses Baru"}
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Konfigurasikan kredensial, peran operasional (Admin, Teknisi IT, atau Viewer), serta otorisasi kontrol platform InfraVerse.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all"
            >
              Batal & Kembali
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm font-semibold text-red-400 flex items-center gap-3 shadow-lg">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Form Inputs (7 cols) & Live User Card (5 cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Identitas Akun */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Informasi Kredensial Pengguna</h2>
                <p className="text-xs text-slate-400 mt-0.5">Nama lengkap, email login, dan nomor telepon kontak</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Nama Lengkap Pengguna <span className="text-blue-400">*</span>
                </label>
                <div className="flex rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <div className="flex items-center justify-center px-4 bg-slate-800/60 border-r border-slate-700/60 text-blue-400">
                    <UserCheck size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Muhammad Farrel"
                    className="w-full px-4 py-3.5 text-sm font-semibold bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Alamat Email Login <span className="text-blue-400">*</span>
                  </label>
                  <div className="flex rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <div className="flex items-center justify-center px-4 bg-slate-800/60 border-r border-slate-700/60 text-blue-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="user@infraverse.ac.id"
                      className="w-full px-4 py-3.5 text-sm font-semibold bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                    Nomor Telepon / WhatsApp
                  </label>
                  <div className="flex rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                    <div className="flex items-center justify-center px-4 bg-slate-800/60 border-r border-slate-700/60 text-blue-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="0812-3456-7890"
                      className="w-full px-4 py-3.5 text-sm font-semibold bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                  Kata Sandi {isEditing ? "(Kosongkan jika tidak ingin mengubah)" : <span className="text-blue-400">*</span>}
                </label>
                <div className="flex rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <div className="flex items-center justify-center px-4 bg-slate-800/60 border-r border-slate-700/60 text-blue-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    required={!isEditing}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={isEditing ? "Ketik sandi baru untuk mengganti..." : "Minimal 8 karakter rahasia"}
                    className="w-full px-4 py-3.5 text-sm font-semibold bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="px-4 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role Selection Cards */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <Shield size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Peran & Tingkat Hak Akses</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pilih wewenang pengguna dalam ekosistem InfraVerse</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {ROLES.map((r) => {
                const isSelected = form.role === r.value;
                return (
                  <label
                    key={r.value}
                    className={`block p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/70 shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-white/10"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="role_selector"
                          value={r.value}
                          checked={isSelected}
                          onChange={() => setForm({ ...form, role: r.value })}
                          className="accent-blue-500 w-4 h-4 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className={`text-base font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                              {r.label}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              r.value === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                              r.value === 'teknisi' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}>
                              {r.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{r.desc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Permissions tags */}
                    <div className="flex flex-wrap gap-2 mt-3.5 pt-3 border-t border-slate-800/80 pl-7">
                      {r.capabilities.map((c, i) => (
                        <span key={i} className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                          ✓ {c}
                        </span>
                      ))}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => navigate("/users")}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all shadow-md"
              >
                Batal
              </button>
              <button 
                type="submit" 
                disabled={saving}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
              >
                <Save size={20} />
                <span>{saving ? "Menyimpan Akun..." : isEditing ? "Simpan Perubahan Akun" : "Daftarkan Pengguna Baru"}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Live User Card Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Live Preview Kartu Akun</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                {form.role.toUpperCase()}
              </span>
            </div>

            {/* Identity Card */}
            <div className="glass rounded-3xl p-7 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-white/20 flex-shrink-0">
                  {form.name ? form.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-black text-slate-100 truncate">
                    {form.name || "Nama Pengguna"}
                  </h4>
                  <p className="text-xs text-blue-400 font-mono truncate mt-0.5">
                    {form.email || "email@infraverse.ac.id"}
                  </p>
                  <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    form.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    form.role === 'teknisi' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {selectedRoleObj.label}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Kontak Telepon:</span>
                  <span className="font-semibold text-slate-200">{form.phone || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Status Akun:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Aktif
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Tingkat Hak Akses:</span>
                  <span className="font-semibold text-indigo-300">{selectedRoleObj.badge}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Cakupan Akses:</span>
                <ul className="text-xs text-slate-400 space-y-1">
                  {selectedRoleObj.capabilities.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
