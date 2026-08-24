import { Inbox } from "lucide-react";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      {/* Icon container with glow ring */}
      <div
        className="relative w-20 h-20 flex items-center justify-center mb-6"
      >
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-2xl opacity-20"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))",
            filter: "blur(12px)",
          }}
        />
        <div
          className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-slate-500"
          style={{
            background: "rgba(15,28,50,0.8)",
            border: "1px solid rgba(99,148,210,0.12)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          {icon ?? <Inbox size={32} className="text-slate-600" />}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-300 mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
