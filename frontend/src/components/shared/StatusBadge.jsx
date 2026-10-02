export default function StatusBadge({ status }) {
  const map = {
    active:      {
      label: "Aktif",
      dot: "#22c55e",
      bg: "rgba(34,197,94,0.09)",
      border: "rgba(34,197,94,0.22)",
      color: "#86efac",
      glow: "0 0 10px rgba(34,197,94,0.25)",
      pulse: true,
    },
    inactive:    {
      label: "Nonaktif",
      dot: "#64748b",
      bg: "rgba(100,116,139,0.08)",
      border: "rgba(100,116,139,0.18)",
      color: "#94a3b8",
      glow: "none",
      pulse: false,
    },
    maintenance: {
      label: "Maintenance",
      dot: "#eab308",
      bg: "rgba(234,179,8,0.09)",
      border: "rgba(234,179,8,0.22)",
      color: "#fde047",
      glow: "0 0 10px rgba(234,179,8,0.22)",
      pulse: false,
    },
    down:        {
      label: "Down",
      dot: "#ef4444",
      bg: "rgba(239,68,68,0.09)",
      border: "rgba(239,68,68,0.22)",
      color: "#fca5a5",
      glow: "0 0 12px rgba(239,68,68,0.30)",
      pulse: true,
    },
  };

  const s = map[status] ?? {
    label: status ?? "-",
    dot: "#64748b",
    bg: "rgba(100,116,139,0.08)",
    border: "rgba(100,116,139,0.18)",
    color: "#94a3b8",
    glow: "none",
    pulse: false,
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        boxShadow: s.glow,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: s.dot,
          boxShadow: `0 0 6px ${s.dot}`,
          animation: s.pulse ? "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" : "none",
        }}
      />
      {s.label}
    </span>
  );
}
