export default function StatusBadge({ status }) {
  const map = {
    active:      { label:"Aktif",       dot:"#22c55e", cls:"bg-green-500/10 text-green-400 border-green-500/25",   glow:"shadow-green-500/20" },
    inactive:    { label:"Nonaktif",    dot:"#64748b", cls:"bg-slate-500/10 text-slate-400 border-slate-500/20",   glow:"" },
    maintenance: { label:"Maintenance", dot:"#eab308", cls:"bg-yellow-500/10 text-yellow-400 border-yellow-500/25", glow:"shadow-yellow-500/20" },
    down:        { label:"Down",        dot:"#ef4444", cls:"bg-red-500/10 text-red-400 border-red-500/25",         glow:"shadow-red-500/20" },
  };
  const s = map[status] ?? { label: status ?? "-", dot:"#64748b", cls:"bg-slate-500/10 text-slate-400 border-slate-500/20", glow:"" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${s.cls} ${s.glow}`}>
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: s.dot,
          boxShadow: `0 0 6px ${s.dot}88`,
          ...(status === "active" || status === "down" ? { animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" } : {})
        }}
      />
      {s.label}
    </span>
  );
}
