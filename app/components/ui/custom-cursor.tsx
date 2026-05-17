"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function CustomCursor() {
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const ringScale = useMotionValue(1);

  const dotX = useSpring(cursorX, { stiffness: 700, damping: 36 });
  const dotY = useSpring(cursorY, { stiffness: 700, damping: 36 });
  const ringX = useSpring(cursorX, { stiffness: 115, damping: 20 });
  const ringY = useSpring(cursorY, { stiffness: 115, damping: 20 });
  const ringScaleSpring = useSpring(ringScale, { stiffness: 260, damping: 22 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      ringScale.set(
        el.closest("a, button, [role='button'], input, select, textarea") ? 1.7 : 1
      );
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [cursorX, cursorY, ringScale]);

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-[999] rounded-full bg-white"
        style={{ x: dotX, y: dotY, width: 5, height: 5, top: 0, left: 0, marginLeft: -2.5, marginTop: -2.5 }}
      />
      <motion.div
        className="pointer-events-none fixed z-[998] rounded-full border border-white/40"
        style={{ x: ringX, y: ringY, width: 36, height: 36, top: 0, left: 0, marginLeft: -18, marginTop: -18, scale: ringScaleSpring }}
      />
    </>
  );
}
