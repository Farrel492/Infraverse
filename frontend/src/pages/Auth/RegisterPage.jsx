import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import useAuthStore from "../../stores/authStore";
import { Eye, EyeOff, Lock, Mail, User, CheckCircle } from "lucide-react";

const STEPS = [
  "Infrastruktur terpantau real-time",
  "Digital Twin 3D interaktif",
  "Simulasi & prediksi insiden",
  "Laporan otomatis & analitik",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.register(form);
      setAuth(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) setError(Object.values(errors).flat().join(" "));
      else setError(err.response?.data?.message ?? "Terjadi kesalahan.");
    } finally { setLoading(false); }
  };

  const InputField = ({ label, name, type = "text", placeholder, icon: Icon, showToggle, show, onToggle }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(148,163,184,0.7)" }}>
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(99,148,210,0.4)" }} />}
        <input
          type={showToggle ? (show ? "text" : "password") : type}
          required
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className="w-full py-2.5 text-sm rounded-xl text-slate-200 outline-none transition-all"
          style={{
            paddingLeft: Icon ? "2.5rem" : "1rem",
            paddingRight: showToggle ? "2.5rem" : "1rem",
            background: "rgba(15,28,50,0.8)",
            border: "1px solid rgba(99,148,210,0.15)",
          }}
          onFocus={e => { e.target.style.border = "1px solid rgba(59,130,246,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
          onBlur={e => { e.target.style.border = "1px solid rgba(99,148,210,0.15)"; e.target.style.boxShadow = ""; }}
        />
        {showToggle && (
          <button
            type="button" onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "rgba(99,148,210,0.4)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#60a5fa"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(99,148,210,0.4)"}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-bg-base)" }}>

      {/* LEFT PANEL — BRAND */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-10"
        style={{
          background: "linear-gradient(135deg, #060d1a 0%, #0a1628 40%, #0d1f3c 100%)",
          borderRight: "1px solid rgba(99,148,210,0.1)",
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.5)" }}>
            IV
          </div>
          <div>
            <h1 className="text-base font-bold text-gradient-blue leading-none">InfraVerse</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.45)" }}>Smart Infrastructure Platform</p>
          </div>
        </div>

        {/* Center */}
        <div className="relative animate-slide-up delay-100">
          <h2 className="text-3xl font-black leading-tight mb-4" style={{ color: "#f1f5f9" }}>
            Bergabunglah dengan<br />
            <span className="text-gradient">Ekosistem Digital Cerdas</span>
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(148,163,184,0.55)", maxWidth: "340px" }}>
            Daftarkan diri dan mulai kelola infrastruktur IT kampus dengan lebih efisien menggunakan teknologi Digital Twin terdepan.
          </p>
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 animate-slide-left" style={{ animationDelay: `${200 + i * 80}ms` }}>
                <CheckCircle size={15} style={{ color: "#22c55e", flexShrink: 0 }} />
                <p className="text-sm font-medium" style={{ color: "rgba(203,213,225,0.75)" }}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat */}
        <div
          className="relative p-4 rounded-2xl animate-slide-up delay-400"
          style={{ background: "rgba(15,28,50,0.6)", border: "1px solid rgba(99,148,210,0.12)" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "#60a5fa" }}>InfraVerse — Digital Twin Platform</p>
          <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
            Solusi manajemen infrastruktur kampus berbasis AI & visualisasi 3D untuk Indonesia 2045.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL — FORM */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in delay-150">

          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-2xl items-center justify-center font-black text-white text-xl mb-3"
              style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" }}>
              IV
            </div>
            <h1 className="text-xl font-bold text-gradient-blue">InfraVerse</h1>
          </div>

          <div className="p-7 rounded-2xl" style={{
            background: "rgba(11,20,38,0.8)",
            border: "1px solid rgba(99,148,210,0.15)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100">Buat Akun Baru</h2>
              <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.5)" }}>Daftar dan mulai eksplorasi InfraVerse</p>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <InputField label="Nama Lengkap"   name="name"                  type="text"     placeholder="Nama kamu"           icon={User} />
              <InputField label="Email"           name="email"                 type="email"    placeholder="email@kamu.com"      icon={Mail} />
              <InputField label="Password"        name="password"              showToggle      placeholder="Min. 8 karakter"     icon={Lock} show={showPass}  onToggle={() => setShowPass(v => !v)} />
              <InputField label="Konfirmasi Password" name="password_confirmation" showToggle  placeholder="Ulangi password"    icon={Lock} show={showPass2} onToggle={() => setShowPass2(v => !v)} />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-bold text-white rounded-xl mt-1 transition-all"
                style={{
                  background: loading ? "rgba(59,130,246,0.4)" : "linear-gradient(135deg, #3b82f6, #6366f1)",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(59,130,246,0.4)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
              Sudah punya akun?{" "}
              <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
