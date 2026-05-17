"use client";

import { motion } from "framer-motion";

export default function AnimatedBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#04040a]" />

      <motion.div
        animate={{ x: [0, 40, -20, 15, 0], y: [0, -50, 30, -20, 0], scale: [1, 1.12, 0.95, 1.05, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-[10%] -top-[15%] h-[750px] w-[750px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(109,40,217,0.08) 40%, transparent 70%)", filter: "blur(2px)" }}
      />
      <motion.div
        animate={{ x: [0, -45, 25, -10, 0], y: [0, 35, -40, 20, 0], scale: [1, 0.92, 1.1, 0.98, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute -right-[8%] top-[5%] h-[650px] w-[650px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.16) 0%, rgba(37,99,235,0.06) 45%, transparent 70%)" }}
      />
      <motion.div
        animate={{ x: [0, 30, -35, 10, 0], y: [0, -25, 40, -15, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        className="absolute bottom-[0%] left-[15%] h-[550px] w-[550px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)" }}
      />
      <motion.div
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -20, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 12 }}
        className="absolute bottom-[20%] right-[5%] h-[500px] w-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(251,146,60,0.1) 0%, transparent 65%)" }}
      />

      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}
