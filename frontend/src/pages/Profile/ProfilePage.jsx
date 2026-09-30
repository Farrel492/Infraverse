import { useState, useRef } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/authStore";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import api from "../../services/api.js";
import {
  User, ShieldCheck, KeyRound, Phone, Mail, CheckCircle2,
  Lock, Shield, Sparkles, Edit3, Camera, Globe, Activity,
  Server, Wrench, Eye, Clock, Fingerprint, Cpu, Star,
  AlertCircle, ChevronRight, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService.js";

const ROLE_CONFIG = {
  admin: {
    label: "Administrator System",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.25)]",
    gradient: "from-red-600 via-rose-600 to-red-700",
    color: "#f87171",
    icon: <Shield size={18} />,
    level: "Level S — Full Control",
  },
  teknisi: {
    label: "Teknisi IT & Network",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.25)]",
    gradient: "from-blue-600 via-indigo-600 to-blue-700",
    color: "#60a5fa",
    icon: <Cpu size={18} />,
    level: "Level A — Technical Access",
  },
  viewer: {
    label: "System Viewer",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.25)]",
    gradient: "from-emerald-600 via-teal-600 to-emerald-700",
    color: "#4ade80",
    icon: <Eye size={18} />,
    level: "Level B — Read Only",
  },
};

const PERMISSIONS = {
  admin: [
    { icon: <Shield size={15} />, label: "Full Control Akses Sistem", granted: true },
    { icon: <User size={15} />, label: "Kelola Pengguna & Hak Akses", granted: true },
    { icon: <Server size={15} />, label: "Manajemen Aset & Hardware", granted: true },
    { icon: <Globe size={15} />, label: "Konfigurasi Gedung & Floorplan", granted: true },
    { icon: <Wrench size={15} />, label: "Jadwal Maintenance & Servis", granted: true },
    { icon: <Activity size={15} />, label: "Eksekusi Simulasi Insiden", granted: true },
  ],
  teknisi: [
    { icon: <Shield size={15} />, label: "Full Control Akses Sistem", granted: false },
    { icon: <User size={15} />, label: "Kelola Pengguna & Hak Akses", granted: false },
    { icon: <Server size={15} />, label: "Manajemen Aset & Hardware", granted: true },
    { icon: <Globe size={15} />, label: "Konfigurasi Gedung & Floorplan", granted: true },
    { icon: <Wrench size={15} />, label: "Jadwal Maintenance & Servis", granted: true },
    { icon: <Activity size={15} />, label: "Eksekusi Simulasi Insiden", granted: true },
  ],
  viewer: [
    { icon: <Shield size={15} />, label: "Full Control Akses Sistem", granted: false },
    { icon: <User size={15} />, label: "Kelola Pengguna & Hak Akses", granted: false },
    { icon: <Server size={15} />, label: "Manajemen Aset & Hardware", granted: false },
    { icon: <Globe size={15} />, label: "Konfigurasi Gedung & Floorplan", granted: false },
    { icon: <Wrench size={15} />, label: "Jadwal Maintenance & Servis", granted: false },
    { icon: <Activity size={15} />, label: "Monitoring & Viewing Only", granted: true },
  ],
};

export default function ProfilePage() {
  const { user, setAuth, token, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role ?? "viewer";
  const roleConf = ROLE_CONFIG[role] ?? ROLE_CONFIG.viewer;
  const permissions = PERMISSIONS[role] ?? PERMISSIONS.viewer;

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [passForm, setPassForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `/storage/${user.avatar}` : null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch("/profile", profileForm);
      setAuth(res.data.user, token);
      toast.success("Profil akun berhasil diperbarui.");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui profil.");
    } finally { setSavingProfile(false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/jpg','image/webp'].includes(file.type)) {
      toast.error("Format gambar harus JPG, PNG, atau WebP."); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2MB."); return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);
      formData.append("_method", "PATCH");
      const res = await api.post("/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAuth(res.data.user, token);
      setAvatarFile(null);
      toast.success("Foto profil berhasil diperbarui!");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal mengunggah foto profil.");
    } finally { setUploadingAvatar(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.password !== passForm.password_confirmation) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setSavingPass(true);
    try {
      await api.patch("/profile/password", passForm);
      toast.success("Kata sandi berhasil diperbarui.");
      setPassForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat()[0] : (err.response?.data?.message ?? "Gagal mengubah password."));
    } finally { setSavingPass(false); }
  };

  const handleLogout = async () => {
    try { await authService.logout(); toast.success("Berhasil keluar."); }
    finally { clearAuth(); navigate("/login"); }
  };

  const initials = user?.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() ?? "U";
  const joinDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at top, #0f172a, #020617)" }}>

      {/* Cover / Hero Section */}
      <div className="relative h-52 sm:h-64 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #0a1628 0%, #0d2347 40%, #10183d 70%, #060d1c 100%)`,
          }}
        />
        {/* Animated grid */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        {/* Orb glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full" style={{ background: `radial-gradient(circle, ${roleConf.color}18 0%, transparent 70%)` }} />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${roleConf.color}, rgba(99,102,241,0.9), transparent)` }} />

        {/* Breadcrumb inside cover */}
        <div className="relative z-10 p-6">
          <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profil Akun" }]} />
        </div>

        {/* Stars decoration */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              background: "#fff",
              opacity: 0.3 + Math.random() * 0.4,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="px-6 lg:px-10 max-w-6xl mx-auto pb-16 -mt-20 relative z-10">

        {/* Avatar upload confirmation banner */}
        {avatarFile && (
          <div className="mb-4 flex items-center gap-4 p-4 rounded-2xl border border-blue-500/40 bg-blue-500/10 backdrop-blur-sm animate-pulse-slow">
            <Camera size={18} className="text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-blue-300">Foto profil baru dipilih: <span className="text-white">{avatarFile.name}</span></p>
              <p className="text-xs text-slate-400 mt-0.5">Klik "Simpan Foto" untuk mengunggah ke server.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { setAvatarFile(null); setAvatarPreview(user?.avatar ? `/storage/${user.avatar}` : null); }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 transition-all"
              >
                Batalkan
              </button>
              <button
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {uploadingAvatar ? "Mengunggah..." : <><CheckCircle2 size={13} /> Simpan Foto</>}
              </button>
            </div>
          </div>
        )}

        {/* Profile Identity Card */}
        <div className="glass rounded-3xl border border-slate-700/60 shadow-2xl overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-black text-white border-4 border-slate-800 overflow-hidden ${roleConf.glow}`}
                  style={!avatarPreview ? { background: `linear-gradient(135deg, ${roleConf.color}cc, ${roleConf.color}66)` } : {}}
                >
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-3 border-slate-900 flex items-center justify-center shadow-[0_0_12px_#10b981]">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                {/* Camera button - triggers file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Ganti Foto Profil"
                  className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center hover:bg-blue-500 transition-all shadow-lg"
                >
                  <Camera size={13} className="text-white" />
                </button>
              </div>

              {/* Identity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-slate-100">{user?.name ?? "Pengguna"}</h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${roleConf.badge}`}>
                    {roleConf.icon}
                    {roleConf.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><Mail size={14} className="text-blue-400" />{user?.email}</span>
                  {user?.phone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-emerald-400" />{user.phone}</span>}
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400" />Bergabung {joinDate}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck size={14} />
                  Sesi Aktif
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all"
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-6 pt-6 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <Star size={16} />, label: "Level Akses", value: roleConf.level, color: roleConf.color },
                { icon: <Fingerprint size={16} />, label: "Autentikasi", value: "Sanctum Token", color: "#60a5fa" },
                { icon: <Activity size={16} />, label: "Status Akun", value: "Aktif & Terverifikasi", color: "#4ade80" },
                { icon: <Globe size={16} />, label: "Platform", value: "InfraVerse v2.0", color: "#a78bfa" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                  <div className="flex-shrink-0" style={{ color: stat.color }}>{stat.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{stat.label}</p>
                    <p className="text-xs font-bold text-slate-200 truncate mt-0.5">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-slate-900/60 backdrop-blur p-1.5 rounded-2xl border border-slate-800/60 w-fit">
          {[
            { id: "profile", label: "Edit Profil", icon: <Edit3 size={15} /> },
            { id: "security", label: "Keamanan", icon: <Lock size={15} /> },
            { id: "permissions", label: "Hak Akses", icon: <Shield size={15} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 glass p-8 rounded-3xl border border-slate-700/60 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Informasi Personal Akun</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Perbarui nama tampilan dan kontak telepon</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="form-label">
                    <span>Nama Lengkap Akun <span className="text-blue-400">*</span></span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box text-blue-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Masukkan nama lengkap Anda"
                      className="input-control text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    <span>Alamat Email Login (Terkunci)</span>
                  </label>
                  <div className="input-group opacity-70">
                    <div className="input-icon-box text-slate-500">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      className="input-control text-sm font-semibold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Email digunakan sebagai identitas login utama dan dilindungi oleh sistem.</p>
                </div>

                <div>
                  <label className="form-label">
                    <span>Nomor Telepon / WhatsApp</span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box text-emerald-400 font-bold text-xs">
                      +62
                    </div>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="812-3456-7890"
                      className="input-control text-sm font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit3 size={16} />
                  <span>{savingProfile ? "Menyimpan Perubahan..." : "Simpan Perubahan Profil"}</span>
                </button>
              </form>
            </div>

            {/* Side info card */}
            <div className="lg:col-span-2 space-y-5">
              <div className="glass p-6 rounded-3xl border border-slate-700/60 shadow-xl">
                <h4 className="text-sm font-black text-slate-100 mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-indigo-400" /> Aktivitas Terkini
                </h4>
                <div className="space-y-3">
                  {[
                    { action: "Login ke sistem", time: "Baru saja", color: "bg-emerald-500" },
                    { action: "Lihat katalog aset", time: "5 menit lalu", color: "bg-blue-500" },
                    { action: "Update perangkat", time: "30 menit lalu", color: "bg-amber-500" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activity.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{activity.action}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-slate-700/60 shadow-xl">
                <h4 className="text-sm font-black text-slate-100 mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" /> Info Akun
                </h4>
                <div className="space-y-3 text-xs">
                  {[
                    { label: "Role", value: roleConf.label },
                    { label: "Status", value: "Aktif" },
                    { label: "Autentikasi", value: "Laravel Sanctum" },
                    { label: "2FA", value: "Belum Aktif" },
                  ].map((info, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/60 last:border-0">
                      <span className="text-slate-400 font-semibold">{info.label}</span>
                      <span className="text-slate-200 font-bold">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 glass p-8 rounded-3xl border border-slate-700/60 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Ubah Kata Sandi</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Perbarui kata sandi untuk keamanan akun</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="form-label">
                    <span>Kata Sandi Saat Ini <span className="text-blue-400">*</span></span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      required
                      value={passForm.current_password}
                      onChange={e => setPassForm({ ...passForm, current_password: e.target.value })}
                      placeholder="Masukkan kata sandi lama Anda"
                      className="input-control text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(v => !v)}
                      className="px-4 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                      title={showCurrentPass ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showCurrentPass ? <Eye size={17} /> : <Lock size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    <span>Kata Sandi Baru <span className="text-blue-400">*</span></span>
                  </label>
                  <div className="input-group">
                    <div className="input-icon-box text-indigo-400">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={passForm.password}
                      onChange={e => setPassForm({ ...passForm, password: e.target.value })}
                      placeholder="Minimal 8 karakter kombinasi"
                      className="input-control text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(v => !v)}
                      className="px-4 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                      title={showNewPass ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showNewPass ? <Eye size={17} /> : <Lock size={17} />}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {passForm.password && (
                    <div className="mt-2.5">
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            passForm.password.length < 6 ? "w-1/4 bg-red-500 shadow-[0_0_8px_#ef4444]" :
                            passForm.password.length < 10 ? "w-2/4 bg-amber-500 shadow-[0_0_8px_#f59e0b]" :
                            "w-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                          }`}
                        />
                      </div>
                      <p className={`text-[11px] font-bold mt-1.5 flex items-center gap-1.5 ${
                        passForm.password.length < 6 ? "text-red-400" :
                        passForm.password.length < 10 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        <span>Tingkat Keamanan:</span>
                        <span className="uppercase">{passForm.password.length < 6 ? "Lemah" : passForm.password.length < 10 ? "Sedang" : "Kuat & Aman"}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    <span>Konfirmasi Kata Sandi Baru <span className="text-blue-400">*</span></span>
                  </label>
                  <div className={`input-group ${
                    passForm.password_confirmation && passForm.password !== passForm.password_confirmation
                      ? "ring-1 ring-red-500/50"
                      : ""
                  }`}>
                    <div className="input-icon-box text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={passForm.password_confirmation}
                      onChange={e => setPassForm({ ...passForm, password_confirmation: e.target.value })}
                      placeholder="Ulangi kata sandi baru untuk verifikasi"
                      className="input-control text-sm font-semibold"
                    />
                    {passForm.password_confirmation && (
                      <div className="flex items-center px-4">
                        {passForm.password === passForm.password_confirmation
                          ? <CheckCircle2 size={17} className="text-emerald-400" />
                          : <AlertCircle size={17} className="text-red-400" />}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPass}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white text-sm font-bold rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound size={16} />
                  <span>{savingPass ? "Mengubah Kata Sandi..." : "Perbarui Kata Sandi Akun"}</span>
                </button>
              </form>
            </div>

            {/* Security Tips */}
            <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-700/60 shadow-xl h-fit">
              <h4 className="text-sm font-black text-slate-100 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" /> Tips Keamanan
              </h4>
              <div className="space-y-3">
                {[
                  "Gunakan minimal 12 karakter kombinasi huruf, angka, dan simbol",
                  "Jangan gunakan password yang sama di platform lain",
                  "Aktifkan 2FA untuk perlindungan tambahan",
                  "Ganti password secara berkala setiap 90 hari",
                  "Jangan bagikan credentials kepada siapapun",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="glass p-8 rounded-3xl border border-slate-700/60 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Hak Akses & Otorisasi Peran</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kapabilitas sistem yang diizinkan untuk peran <strong className="text-slate-200">{roleConf.label}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissions.map((perm, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                    perm.granted
                      ? "bg-emerald-500/8 border-emerald-500/25 hover:border-emerald-500/50"
                      : "bg-slate-900/40 border-slate-800/60 opacity-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    perm.granted ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-600"
                  }`}>
                    {perm.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${perm.granted ? "text-slate-100" : "text-slate-500 line-through"}`}>
                      {perm.label}
                    </p>
                    <p className={`text-[10px] font-bold mt-0.5 ${perm.granted ? "text-emerald-400" : "text-slate-600"}`}>
                      {perm.granted ? "✓ Diizinkan" : "✗ Tidak Diizinkan"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-blue-500/8 border border-blue-500/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Hak akses ditentukan oleh Administrator sistem. Untuk perubahan role atau penambahan izin, hubungi Admin InfraVerse.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
