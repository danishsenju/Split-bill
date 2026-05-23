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
            className="fixed inset-0 z-40 sheet-backdrop"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface rounded-t-sheet px-4 pt-4 pb-8 max-w-mobile mx-auto"
          >
            <div className="w-10 h-1 bg-white/20 rounded-pill mx-auto mb-4" />
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-bold text-text-primary">{title}</h3>
                <button onClick={onClose} className="p-1 text-text-muted hover:text-text-secondary transition-colors">
                  <X size={20} />
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
