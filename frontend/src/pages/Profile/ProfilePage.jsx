import { useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/authStore";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import api from "../../services/api.js";

const ROLE_BADGE = {
  admin:   "bg-red-500/20 text-red-400 border-red-500/30",
  teknisi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  viewer:  "bg-green-500/20 text-green-400 border-green-500/30",
};
const ROLE_LABEL = { admin:"Administrator", teknisi:"Teknisi IT", viewer:"Viewer" };

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [passForm, setPassForm]       = useState({ current_password:"", password:"", password_confirmation:"" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass]       = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch("/profile", profileForm);
      setAuth(res.data.user, token);
      toast.success("Profil berhasil diperbarui.");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui profil.");
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.password !== passForm.password_confirmation) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    setSavingPass(true);
    try {
      await api.patch("/profile/password", passForm);
      toast.success("Password berhasil diubah.");
      setPassForm({ current_password:"", password:"", password_confirmation:"" });
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat()[0] : (err.response?.data?.message ?? "Gagal mengubah password."));
    } finally { setSavingPass(false); }
  };

  return (
    <div className="p-8 max-w-3xl">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Profil" }]} />

      <h2 className="text-2xl font-bold text-slate-100 mb-8">Profil Akun</h2>

      {/* Avatar & role */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-100">{user?.name}</h3>
          <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
          <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full border font-medium capitalize ${ROLE_BADGE[user?.role] ?? ""}`}>
            {ROLE_LABEL[user?.role] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Informasi Profil</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
            <input required value={profileForm.name}
              onChange={e => setProfileForm({...profileForm, name: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input value={user?.email} disabled
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-500 text-sm cursor-not-allowed" />
            <p className="text-xs text-slate-600 mt-1">Email tidak dapat diubah.</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nomor Telepon</label>
            <input value={profileForm.phone}
              onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
              placeholder="+62..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={savingProfile}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Ganti Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label:"Password Saat Ini", key:"current_password" },
            { label:"Password Baru (min. 8 karakter)", key:"password" },
            { label:"Konfirmasi Password Baru", key:"password_confirmation" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input type="password" required value={passForm[key]}
                onChange={e => setPassForm({...passForm, [key]: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={savingPass}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {savingPass ? "Mengubah..." : "Ganti Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
