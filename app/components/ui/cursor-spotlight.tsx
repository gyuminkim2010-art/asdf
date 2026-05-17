"use client";

import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { useEffect } from "react";

export default function CursorSpotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 22 });
  const bg = useMotionTemplate`radial-gradient(680px circle at ${smoothX}px ${smoothY}px, rgba(139,92,246,0.075), transparent 38%)`;

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-20"
      style={{ background: bg }}
    />
  );
}
