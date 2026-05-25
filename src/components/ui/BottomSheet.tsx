"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 sheet-backdrop"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%", scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: "100%", scale: 0.95, opacity: 0 }}
            transition={{
              y: { type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] },
              scale: { type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: 0.2 },
            }}
            style={{ transformOrigin: "bottom center" }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface border border-[rgba(232,184,75,0.10)] border-b-0 rounded-t-sheet px-4 pt-4 pb-8 max-w-mobile mx-auto"
          >
            <div className="w-10 h-1 bg-white/15 rounded-pill mx-auto mb-4" />
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-clash font-bold text-text-primary">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-btn text-text-muted hover:text-text-secondary active:scale-[0.97] transition-colors"
                  style={{ transition: "color 150ms var(--ease-out), transform 160ms var(--ease-out)" }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
