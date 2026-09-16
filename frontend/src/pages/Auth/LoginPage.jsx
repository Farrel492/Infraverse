import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import useAuthStore from "../../stores/authStore";
import { Eye, EyeOff, Lock, Mail, Activity, Server, Zap, Shield } from "lucide-react";

const FEATURES = [
  { Icon: Activity,  label: "Monitoring Real-time",   sub: "Pantau status infrastruktur" },
  { Icon: Server,    label: "Digital Twin 3D",        sub: "Visualisasi rack interaktif" },
  { Icon: Zap,       label: "Simulasi Insiden",       sub: "Latih respons tim IT" },
  { Icon: Shield,    label: "Predictive Maintenance", sub: "Cegah downtime lebih awal" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.login(form);
      setAuth(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message ?? "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-base)" }}>

      {/* ===== LEFT PANEL — BRAND ===== */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-10"
        style={{
          background: "linear-gradient(135deg, #060d1a 0%, #0a1628 40%, #0d1f3c 100%)",
          borderRight: "1px solid rgba(99,148,210,0.1)",
        }}
      >
        {/* Animated grid */}
        <div className="absolute inset-0 bg-grid opacity-40" />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />

        {/* Top: Logo */}
        <div className="relative flex items-center gap-3 animate-fade-in">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.5)" }}
          >
            IV
          </div>
          <div>
            <h1 className="text-base font-bold text-gradient-blue leading-none">InfraVerse</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.45)" }}>Smart Infrastructure Platform</p>
          </div>
        </div>

        {/* Center: Headline */}
        <div className="relative animate-slide-up delay-100">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Platform Digital Twin Infrastruktur
          </div>
          <h2 className="text-4xl font-black leading-tight mb-4" style={{ color: "#f1f5f9" }}>
            Kelola Infrastruktur<br />
            <span className="text-gradient">Digital dengan Cerdas</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.6)", maxWidth: "380px" }}>
            InfraVerse menghadirkan solusi manajemen infrastruktur digital kampus yang inklusif, efisien, dan berkelanjutan — mendukung transformasi digital Indonesia 2045.
          </p>
        </div>

        {/* Bottom: Features */}
        <div className="relative grid grid-cols-2 gap-3 animate-slide-up delay-200">
          {FEATURES.map(({ Icon, label, sub }, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{
                background: "rgba(15,28,50,0.6)",
                border: "1px solid rgba(99,148,210,0.1)",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(59,130,246,0.15)" }}
              >
                <Icon size={13} style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.45)" }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== RIGHT PANEL — FORM ===== */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md animate-fade-in delay-150">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex w-14 h-14 rounded-2xl items-center justify-center font-black text-white text-2xl mb-3 shadow-[0_4px_20px_rgba(59,130,246,0.4)] bg-gradient-to-br from-blue-500 to-indigo-600"
            >
              IV
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">InfraVerse</h1>
          </div>

          {/* Form card */}
          <div
            className="p-8 sm:p-10 rounded-3xl"
            style={{
              background: "rgba(11,20,38,0.85)",
              border: "1px solid rgba(99,148,210,0.2)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 70px rgba(0,0,0,0.6)",
            }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-100">Masuk ke Akun</h2>
              <p className="text-sm mt-1.5 font-medium" style={{ color: "rgba(148,163,184,0.65)" }}>
                Selamat datang kembali di Platform InfraVerse
              </p>
            </div>

            {error && (
              <div
                className="mb-6 px-4 py-3.5 rounded-2xl text-sm font-semibold flex items-center gap-3"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Quick Demo Selector for Competition Presentation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Akun Demo Pengujian Cepat:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: "Admin", email: "admin@infraverse.test", pass: "password" },
                    { role: "Teknisi", email: "teknisi@infraverse.test", pass: "password" },
                    { role: "Viewer", email: "viewer@infraverse.test", pass: "password" },
                  ].map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => setForm({ email: acc.email, password: acc.pass })}
                      className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700/70 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 transition-all text-center"
                    >
                      {acc.role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email with Separate Addon Box (No overlap guaranteed) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">
                  Alamat Email Pengguna
                </label>
                <div className="flex rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <div className="flex items-center justify-center px-4 bg-slate-800/60 border-r border-slate-700/60 text-blue-400 flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Masukkan alamat email"
                    className="w-full px-4 py-3.5 text-[15px] font-medium bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Password with Separate Addon Box (No overlap guaranteed) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">
                  Kata Sandi Akun
                </label>
                <div className="flex rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
                  <div className="flex items-center justify-center px-4 bg-slate-800/60 border-r border-slate-700/60 text-blue-400 flex-shrink-0">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Masukkan kata sandi"
                    className="w-full px-4 py-3.5 text-[15px] font-medium bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-base font-black text-white rounded-2xl mt-4 transition-all shadow-[0_4px_25px_rgba(59,130,246,0.4)] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99]"
              >
                {loading ? "Memproses Autentikasi..." : "Masuk ke Sistem InfraVerse"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs sm:text-sm font-medium text-slate-400">
              Belum memiliki akun?{" "}
              <Link to="/register" className="font-bold text-blue-400 hover:text-blue-300 transition-colors underline">
                Daftar akun di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


