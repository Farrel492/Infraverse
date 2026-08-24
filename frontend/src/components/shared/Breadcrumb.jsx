import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-xs mb-6 animate-fade-in">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-slate-700 flex-shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link
              to={item.href}
              className="text-slate-500 hover:text-blue-400 transition-colors font-medium px-1 py-0.5 rounded hover:bg-blue-500/8"
            >
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1
              ? "text-slate-300 font-semibold px-1"
              : "text-slate-500 px-1"
            }>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

