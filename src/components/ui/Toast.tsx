"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
}

const icons = {
  success: <CheckCircle size={18} className="text-success" />,
  error: <XCircle size={18} className="text-danger" />,
  info: <AlertCircle size={18} className="text-accent" />,
};

export default function Toast({ message, type = "info", visible }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 max-w-mobile mx-auto"
        >
          <div className="flex items-center gap-2 bg-bg-surface border border-[rgba(232,184,75,0.15)] rounded-card px-4 py-3 shadow-xl">
            {icons[type]}
            <span className="text-text-primary text-sm font-dm">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
