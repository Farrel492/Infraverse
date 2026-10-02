import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-xs mb-6 animate-fade-in">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all font-medium"
        style={{ color: "#334155" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#60a5fa"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#334155"; }}
      >
        <Home size={11} />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={11} style={{ color: "#1e293b" }} className="flex-shrink-0" />
          {item.href && i < items.length - 1 ? (
            <Link
              to={item.href}
              className="px-1.5 py-0.5 rounded-lg transition-all font-semibold"
              style={{ color: "#475569" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#60a5fa"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#475569"; }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="px-1.5 py-0.5 rounded-lg font-bold"
              style={i === items.length - 1
                ? { color: "#93c5fd" }
                : { color: "#475569" }
              }
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
