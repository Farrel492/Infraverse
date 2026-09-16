import { AlertTriangle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmDialog({ message, onConfirm, onCancel, title = "Konfirmasi Hapus", confirmLabel = "Hapus", confirmVariant = "danger" }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-md z-10"
        >
          {/* Glow border */}
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-red-500/40 via-transparent to-transparent blur-sm pointer-events-none" />
          
          <div className="relative glass-strong rounded-3xl border border-slate-700/70 shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden">
            {/* Top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />

            <div className="p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
                  style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.3)", boxShadow: "0 0 30px rgba(239,68,68,0.2)" }}
                >
                  <Trash2 size={32} className="text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-black text-slate-100 text-center mb-2">{title}</h3>

              {/* Message */}
              <p className="text-sm text-slate-300 text-center leading-relaxed mb-8 max-w-xs mx-auto">
                {message}
              </p>

              {/* Warning */}
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-500/8 border border-red-500/20 mb-6">
                <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300 font-medium leading-snug">
                  Tindakan ini tidak dapat dibatalkan. Data yang dihapus tidak dapat dipulihkan kembali.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold border border-slate-700/60 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all active:scale-95"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
