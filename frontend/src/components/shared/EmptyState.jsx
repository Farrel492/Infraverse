import { Inbox, Plus } from "lucide-react";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      {/* Icon container */}
      <div className="relative mb-6">
        {/* Glow rings */}
        <div
          className="absolute inset-0 rounded-3xl opacity-30 blur-xl"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.35))" }}
        />
        <div
          className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{
            background: "rgba(10,20,42,0.85)",
            border: "1px solid rgba(79,140,220,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {icon ?? <Inbox size={30} style={{ color: "#1e3a5f" }} />}
        </div>
      </div>

      <h3 className="text-lg font-black text-slate-200 mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm font-medium mb-8 max-w-xs leading-relaxed" style={{ color: "#334155" }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary btn-md flex items-center gap-2"
        >
          <Plus size={15} />
          {action.label}
        </button>
      )}
    </div>
  );
}
