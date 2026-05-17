"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

interface MagneticActionProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function MagneticAction({ onClick, children, className, style }: MagneticActionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 220, damping: 18 });
  const ySpring = useSpring(y, { stiffness: 220, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.55);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.55);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="inline-block"
    >
      <motion.div style={{ x: xSpring, y: ySpring }} whileTap={{ scale: 0.95 }}>
        <button onClick={onClick} className={className} style={style}>
          {children}
        </button>
      </motion.div>
    </div>
  );
}
