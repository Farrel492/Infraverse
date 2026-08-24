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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in delay-150">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex w-12 h-12 rounded-2xl items-center justify-center font-black text-white text-xl mb-3"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" }}
            >
              IV
            </div>
            <h1 className="text-xl font-bold text-gradient-blue">InfraVerse</h1>
          </div>

          {/* Form card */}
          <div
            className="p-7 rounded-2xl"
            style={{
              background: "rgba(11,20,38,0.8)",
              border: "1px solid rgba(99,148,210,0.15)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100">Masuk ke Akun</h2>
              <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.5)" }}>
                Selamat datang kembali di InfraVerse
              </p>
            </div>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(148,163,184,0.7)" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(99,148,210,0.4)" }} />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@infraverse.test"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl text-slate-200 outline-none transition-all"
                    style={{
                      background: "rgba(15,28,50,0.8)",
                      border: "1px solid rgba(99,148,210,0.15)",
                    }}
                    onFocus={e => { e.target.style.border = "1px solid rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                    onBlur={e => { e.target.style.border = "1px solid rgba(99,148,210,0.15)"; e.target.style.boxShadow = ""; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(148,163,184,0.7)" }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(99,148,210,0.4)" }} />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl text-slate-200 outline-none transition-all"
                    style={{
                      background: "rgba(15,28,50,0.8)",
                      border: "1px solid rgba(99,148,210,0.15)",
                    }}
                    onFocus={e => { e.target.style.border = "1px solid rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                    onBlur={e => { e.target.style.border = "1px solid rgba(99,148,210,0.15)"; e.target.style.boxShadow = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "rgba(99,148,210,0.4)" }}
                    onMouseEnter={e => e.target.style.color = "#60a5fa"}
                    onMouseLeave={e => e.target.style.color = "rgba(99,148,210,0.4)"}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-bold text-white rounded-xl mt-2 transition-all"
                style={{
                  background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(59,130,246,0.4)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={e => { if (!loading) e.target.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => e.target.style.transform = "translateY(0)"}
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
              Belum punya akun?{" "}
              <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


