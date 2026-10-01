import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userService } from "../../services/userService.js";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import {
  Users, ArrowLeft, Save, ShieldCheck, Mail, Lock, Phone,
  Eye, EyeOff, UserCheck, Shield, AlertCircle, Sparkles, CheckCircle2,
  Wrench, Eye as EyeIcon, Compass, KeyRound, Camera
} from "lucide-react";
import toast from "react-hot-toast";

const ROLES = [
  {
    value: "admin",
    label: "Administrator System",
    badge: "Full Privilege",
    color: "red",
    icon: Shield,
    borderActive: "border-red-500/80 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    textActive: "text-red-300",
    desc: "Hak akses penuh ke seluruh modul sistem: Manajemen Gedung, Aset, Pengguna, Topologi, dan Simulasi Disaster Recovery.",
    capabilities: ["Kelola Gedung & Rack 42U", "Manajemen User & Reset Sandi", "Konfigurasi Perangkat IT", "Uji Simulasi & Maintenance"],
  },
  {
    value: "teknisi",
    label: "Teknisi IT & Network",
    badge: "Operasional NOC",
    color: "blue",
    icon: Wrench,
    borderActive: "border-blue-500/80 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    textActive: "text-blue-300",
    desc: "Akses operasional lapangan: Inventarisasi hardware aset, update status inspeksi rack 42U, eksekusi maintenance, dan topologi.",
    capabilities: ["Input & Edit Aset IT", "Konfigurasi Rack & Port", "Update Status Pemeliharaan", "Monitoring Topologi Jaringan"],
  },
  {
    value: "viewer",
    label: "System Viewer",
    badge: "Read Only",
    color: "emerald",
    icon: EyeIcon,
    borderActive: "border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    textActive: "text-emerald-300",
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

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
          if (u.avatar) {
            setAvatarPreview(u.avatar.startsWith('http') || u.avatar.startsWith('/storage/') ? u.avatar : `/storage/${u.avatar}`);
          }
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
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("email", form.email.trim());
      formData.append("role", form.role);
      if (form.phone) formData.append("phone", form.phone.trim());
      if (avatarFile) formData.append("avatar", avatarFile);

      if (isEditing) {
        if (form.password && form.password.trim().length >= 8) {
          formData.append("password", form.password.trim());
        }
        await userService.update(id, formData);
        toast.success("Data akun pengguna berhasil diperbarui!");
      } else {
        formData.append("password", form.password);
        await userService.create(formData);
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
  const RoleIcon = selectedRoleObj.icon;

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
              className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all shadow-lg hover:shadow-slate-800/50 cursor-pointer"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {isEditing ? "Mode Edit Pengguna" : "Pendaftaran Akun Baru"}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-semibold">Manajemen Identitas & Hak Akses RBAC</span>
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white mt-2">
                {isEditing ? `Edit Konfigurasi Akun: ${form.name}` : "Pendaftaran Pengguna & Otorisasi Sistem Baru"}
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                Konfigurasikan akun login personil, peran operasional (Administrator, Teknisi IT, atau Viewer), serta otorisasi modul platform InfraVerse.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="px-6 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm transition-all cursor-pointer"
            >
              Kembali ke Kelola User
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

      {/* Main Grid: Form (7 cols) & Live ID Badge Preview (5 cols) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Identitas Akun */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <Users size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Informasi Kredensial Pengguna</h2>
                <p className="text-xs text-slate-400 mt-0.5">Nama lengkap personil, alamat email login resmi, dan nomor kontak telepon</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Profile Photo / Avatar */}
              <div>
                <label className="form-label">
                  <span>Foto Profil Pengguna (Avatar)</span>
                  <span className="text-[11px] font-semibold text-slate-500">Opsional</span>
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 overflow-hidden flex items-center justify-center text-slate-400 shadow-md flex-shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={26} className="text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-200 hover:text-white cursor-pointer transition-all shadow-sm">
                      <Camera size={14} className="text-blue-400" />
                      <span>{avatarPreview ? "Ganti Foto Profil" : "Upload Foto Profil"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 3 * 1024 * 1024) {
                            toast.error("Ukuran foto maksimal 3MB.");
                            return;
                          }
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }}
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">Mendukung format PNG, JPG, atau WebP (maks. 3MB)</p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="form-label">
                  <span>Nama Lengkap Pengguna <span className="text-blue-400">*</span></span>
                  <span className="text-[11px] font-semibold text-slate-500">Wajib Diisi</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-blue-400">
                    <UserCheck size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Muhammad Farrel"
                    className="input-control"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">
                    <span>Alamat Email Login <span className="text-blue-400">*</span></span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box text-blue-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="farrel@infraverse.id"
                      className="input-control font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    <span>Nomor Telepon / WhatsApp</span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box text-indigo-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="0812-3456-7890"
                      className="input-control font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="form-label">
                  <span>
                    {isEditing ? "Ganti Kata Sandi (Kosongkan jika tidak diubah)" : "Kata Sandi Akun Baru "}
                    {!isEditing && <span className="text-blue-400">*</span>}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Minimal 8 Karakter</span>
                </label>
                <div className="input-group">
                  <div className="input-icon-box text-amber-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    required={!isEditing}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={isEditing ? "Biarkan kosong untuk mempertahankan kata sandi lama" : "Minimal 8 karakter aman"}
                    className="input-control"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="px-4 text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Peran Otorisasi (RBAC) */}
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Peran Otorisasi & Hak Akses (RBAC)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pilih tingkat otorisasi yang menentukan wewenang pengguna dalam platform</p>
              </div>
            </div>

            <div className="space-y-4">
              {ROLES.map(r => {
                const IconComp = r.icon;
                const isSelected = form.role === r.value;
                return (
                  <label
                    key={r.value}
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col gap-3 ${
                      isSelected
                        ? r.borderActive
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isSelected ? "bg-white/10 border-white/20 text-white" : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}>
                          <IconComp size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isSelected ? r.textActive : "text-slate-200"}`}>
                              {r.label}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isSelected ? "bg-white/15 text-white" : "bg-slate-800 text-slate-400"
                            }`}>
                              {r.badge}
                            </span>
                          </div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="user_role"
                        value={r.value}
                        checked={isSelected}
                        onChange={() => setForm({ ...form, role: r.value })}
                        className="accent-blue-500 w-4 h-4"
                      />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {r.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                      {r.capabilities.map((cap, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-1"
                        >
                          <CheckCircle2 size={11} className={isSelected ? "text-emerald-400" : "text-slate-500"} />
                          {cap}
                        </span>
                      ))}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate("/users")}
                className="w-full sm:w-1/3 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || !form.name || !form.email}
                className="w-full sm:w-2/3 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-black shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Save size={18} />
                <span>{saving ? "Menyimpan Akun..." : (isEditing ? "Simpan Perubahan Akun" : "Daftarkan Pengguna Baru")}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Live ID Badge Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <div className="glass p-8 rounded-3xl border border-slate-700/60 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Live Preview Kartu Identitas</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase border ${selectedRoleObj.textActive} bg-slate-900 border-slate-700`}>
                {selectedRoleObj.badge}
              </span>
            </div>

            {/* Cyber Access ID Card */}
            <div className="glass rounded-3xl p-7 border border-blue-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white text-xl font-black shadow-lg overflow-hidden flex-shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    form.name ? form.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${selectedRoleObj.textActive} bg-slate-900 border-slate-700`}>
                    {selectedRoleObj.label}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">InfraVerse ID</p>
                </div>
              </div>

              <div className="relative z-10">
                <h4 className="font-extrabold text-slate-100 text-xl leading-snug">
                  {form.name || "Nama Lengkap Personil"}
                </h4>
                <p className="text-xs text-blue-400 font-mono mt-1 flex items-center gap-1.5">
                  <Mail size={13} /> {form.email || "email.personil@infraverse.id"}
                </p>
                {form.phone && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <Phone size={13} /> {form.phone}
                  </p>
                )}
              </div>

              {/* Granted Capabilities Summary */}
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2 relative z-10 shadow-inner">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hak Akses Modul:</p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {selectedRoleObj.capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Terverifikasi Sistem
                </span>
                <span className="text-blue-400 font-bold">RBAC Otorisasi</span>
              </div>
            </div>

            {/* Guidance Callout */}
            <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-2 leading-relaxed shadow-lg">
              <p className="font-bold flex items-center gap-1.5 text-blue-300">
                <Compass size={16} /> Keamanan Kredensial:
              </p>
              <p className="text-slate-300">
                Pengguna dengan role <strong>Administrator</strong> memiliki kuasa penuh mereset sandi dan mengelola arsitektur gedung. Pastikan penugasan kredensial sesuai dengan kebijakan keamanan institusi.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
