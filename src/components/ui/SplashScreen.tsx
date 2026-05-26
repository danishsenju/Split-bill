"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "visible" | "exiting" | "done";

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("visible");

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("splash_shown");
    if (alreadyShown) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("splash_shown", "1");
    const t = setTimeout(() => setPhase("exiting"), 2500);
    return () => clearTimeout(t);
  }, []);

  if (phase === "done") return null;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15, delayChildren: 0.25 },
    },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
    },
  };

  return (
    <AnimatePresence onExitComplete={() => setPhase("done")}>
      {phase !== "exiting" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }}
          className="fixed inset-0 z-[9999] bg-midnight flex flex-col items-center justify-center overflow-hidden"
          aria-label="kolekduit sedang dimuatkan"
          aria-live="polite"
        >
          {/* Atmospheric orb — green, top-left */}
          <div
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full orb-animate pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgb(160,224,171) 0%, transparent 70%)",
              opacity: 0.28,
              filter: "blur(48px)",
            }}
          />

          {/* Atmospheric orb — orange-red, bottom-right */}
          <div
            className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full orb-animate-slow pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgb(255,172,46) 0%, rgb(165,45,37) 60%, transparent 80%)",
              opacity: 0.25,
              filter: "blur(56px)",
            }}
          />

          {/* Content stack */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex flex-col items-center gap-3 px-8 text-center"
          >
            {/* Gradient accent line */}
            <motion.div variants={itemVariants} className="mb-2">
              <div
                className="w-10 h-0.5 rounded-full mx-auto"
                style={{ background: "var(--gradient-deep-ocean)" }}
              />
            </motion.div>

            {/* Wordmark */}
            <motion.h1
              variants={itemVariants}
              className="font-clash font-bold text-frost leading-none tracking-tight"
              style={{ fontSize: "52px" }}
            >
              kolekduit
            </motion.h1>

            {/* Tagline */}
            <motion.p
              variants={itemVariants}
              className="font-dm text-whisper text-base"
            >
              Settle hutang, tanpa drama.
            </motion.p>
          </motion.div>

          {/* Bottom progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: "var(--gradient-deep-ocean)", transformOrigin: "left" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.3, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
