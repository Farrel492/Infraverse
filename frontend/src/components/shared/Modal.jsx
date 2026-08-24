import { X } from "lucide-react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({ title, onClose, children, maxWidth = "max-w-2xl", subtitle }) {
  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className={`relative w-full ${maxWidth} z-10 glass-strong rounded-3xl border border-slate-700/70 shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden my-auto`}
        >
          {/* Top glowing cyan/indigo border */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />

          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800/90 bg-slate-900/60">
            <div>
              <h3 className="text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_#3b82f6]" />
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700/60 flex items-center justify-center transition-all shadow-sm hover:scale-105"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-7 py-6 max-h-[82vh] overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
