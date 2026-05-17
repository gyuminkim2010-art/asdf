"use client";

import Link from "next/link";
import MagneticButton from "./components/ui/magnetic-button";
import GlobeHero from "./components/ui/globe-hero";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";

/* ═══════════════════════════════ DATA ═══════════════════════════════ */

const MENU_CARDS = [
  {
    title: "한자퀴즈",
    description: "반복학습으로 쉽게 한자를 익혀보세요.",
    href: "/hub",
    icon: "漢",
    tag: "STUDY",
    gradient: "from-violet-500/25 via-indigo-500/15 to-transparent",
  },
  {
    title: "급식정보",
    description: "급식 메뉴를 확인합니다.",
    href: "/meal",
    icon: "🍱",
    tag: "INFO",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
  },
  {
    title: "학사일정",
    description: "학교 일정을 확인합니다.",
    href: "/schedule",
    icon: "📅",
    tag: "SCHEDULE",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    title: "학습자료공유",
    description: "학습자료를 배포하고 확인할 수 있습니다.",
    href: "/board",
    icon: "📚",
    tag: "SHARE",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
  },
];

const STATS = [
  { value: 4, suffix: "+", label: "기능" },
  { value: 100, suffix: "%", label: "무료 서비스" },
  { value: 365, suffix: "", label: "학습 일수/년" },
  { value: 0, suffix: "원", label: "이용 요금" },
];

const MARQUEE_ITEMS = [
  "Project · no NAME",
  "한자퀴즈",
  "학습자료공유",
  "급식정보",
  "학사일정",
];

/* ═══════════════════════════════ HOOKS ═══════════════════════════════ */

function useScrambleText(text: string, trigger: boolean) {
  const [output, setOutput] = useState(text);
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%★✦";

  useEffect(() => {
    if (!trigger) return;
    let frame = 0;
    const totalFrames = text.length * 5;
    let rafId: number;

    const tick = () => {
      setOutput(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < frame / 5) return char;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );
      frame++;
      if (frame <= totalFrames) {
        rafId = requestAnimationFrame(tick);
      } else {
        setOutput(text);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [trigger, text]);

  return output;
}

/* ═══════════════════════════════ ANIMATED NUMBER ═══════════════════════════════ */

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView || value === 0) return;
    const start = performance.now();
    const duration = 1600;
    const raf = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {value === 0 ? "0" : display}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════ WORD REVEAL ═══════════════════════════════ */

function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={isInView ? { y: 0 } : { y: "110%" }}
            transition={{
              duration: 0.75,
              delay: delay + i * 0.09,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ═══════════════════════════════ SCRAMBLE HEADING ═══════════════════════════════ */

function ScrambleHeading({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const scrambled = useScrambleText(text, isInView);

  return (
    <h2 ref={ref} className={className}>
      {scrambled}
    </h2>
  );
}

/* ═══════════════════════════════ NAVBAR ═══════════════════════════════ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 top-0 z-50 px-6 py-4"
    >
      <div
        className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-5 py-3 transition-all duration-700"
        style={scrolled ? {
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(48px) saturate(180%)",
          WebkitBackdropFilter: "blur(48px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.4)",
        } : {}}
      >
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-black tracking-[0.06em] text-white">no NAME</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">project</span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 rounded-full px-2 py-1.5 md:flex"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09)",
          }}
        >
          {[
            { label: "한자퀴즈", href: "/hub" },
            { label: "학습자료", href: "/board" },
            { label: "급식", href: "/meal" },
            { label: "일정", href: "/schedule" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wide text-white/35 transition-all duration-200 hover:bg-white/[0.07] hover:text-white/80"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <MagneticButton
          href="/hub"
          className="block rounded-full bg-white px-5 py-2.5 text-[11px] font-bold tracking-wider text-black"
          style={{ boxShadow: "0 0 24px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.3)" }}
        >
          시작하기
        </MagneticButton>
      </div>
    </motion.header>
  );
}

/* ═══════════════════════════════ HERO ═══════════════════════════════ */

function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.55], [1, 0.94]);
  const heroY = useTransform(scrollYProgress, [0, 0.55], [0, -60]);

  const titleChars = "no NAME".split("");

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center"
    >
      {/* Globe → Building background sequence */}
      <GlobeHero />

      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-8 flex items-center gap-3"
        >
          <motion.div
            animate={{ scaleX: [0, 1] }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-px w-8 origin-left bg-gradient-to-r from-transparent to-white/25"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.38em] text-white/30">Project</span>
          <motion.div
            animate={{ scaleX: [0, 1] }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-px w-8 origin-right bg-gradient-to-l from-transparent to-white/25"
          />
        </motion.div>

        {/* "Project." */}
        <div className="overflow-hidden">
          <motion.p
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-1 text-[clamp(20px,3.5vw,42px)] font-light tracking-[-0.01em]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Project<span style={{ color: "rgba(255,255,255,0.75)" }}>.</span>
          </motion.p>
        </div>

        {/*         {/* no NAME — char by char + globe float animation */}
        <div className="relative">
          {/* 배경 글로우 — 지구 빛쳌럼 */}
          <motion.div
            className="pointer-events-none absolute inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.22, 0.14, 0.22] }}
            transition={{ duration: 7, delay: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(ellipse 80% 55% at 50% 60%, rgba(255,255,255,0.13), transparent 72%)",
              filter: "blur(28px)",
            }}
          />
          <motion.div
            className="flex"
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 7.5, delay: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {titleChars.map((char, i) => (
              <div key={i} className="overflow-hidden">
                <motion.span
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.85, delay: 0.3 + i * 0.058, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block text-[clamp(58px,11.5vw,148px)] font-black leading-[0.88] tracking-[-0.055em]"
                  style={{
                    WebkitTextStroke: "1.5px rgba(255,255,255,0.38)",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                  }}
                >
                  {char === " " ? " " : char}
                </motion.span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.05 }}
          className="mt-10 max-w-[320px] text-[13px] leading-[1.9] text-white/30"
        >
           —<br />
          Everything you need
        </motion.p>

        {/* CTAs — magnetic */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.25 }}
          className="mt-10 flex items-center gap-3"
        >
          <MagneticButton
            href="/hub"
            className="block rounded-full bg-white px-8 py-3.5 text-[12px] font-bold tracking-wider text-black"
            style={{ boxShadow: "0 0 36px rgba(255,255,255,0.2), 0 6px 24px rgba(0,0,0,0.35)" }}
          >
            시작하기
          </MagneticButton>

          <MagneticButton
            href="/board"
            className="block rounded-full px-8 py-3.5 text-[12px] font-bold tracking-wider text-white/55 transition-colors hover:text-white/80"
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            학습자료 보기
          </MagneticButton>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9 }}
          className="mt-20 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ scaleY: [0, 1, 0], opacity: [0, 0.45, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-px origin-top bg-gradient-to-b from-white/55 to-transparent"
          />
          <span className="text-[9px] font-bold uppercase tracking-[0.38em] text-white/18">scroll</span>
        </motion.div>
      </motion.div>

      {/* Decorative glass orbs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-[6%] top-[28%] hidden h-28 w-28 rounded-full lg:block z-10"
        style={{ background: "rgba(139,92,246,0.07)", backdropFilter: "blur(32px)", border: "1px solid rgba(139,92,246,0.18)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute right-[7%] top-[38%] hidden h-20 w-20 rounded-full lg:block"
        style={{ background: "rgba(59,130,246,0.07)", backdropFilter: "blur(24px)", border: "1px solid rgba(59,130,246,0.15)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
      />
      <motion.div
        animate={{ y: [-7, 7, -7] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-[22%] left-[12%] hidden h-14 w-14 rounded-full lg:block"
        style={{ background: "rgba(16,185,129,0.07)", backdropFilter: "blur(18px)", border: "1px solid rgba(16,185,129,0.14)" }}
      />
    </section>
  );
}

/* ═══════════════════════════════ MARQUEE ═══════════════════════════════ */

function Marquee() {
  return (
    <div
      className="relative overflow-hidden border-y py-5"
      style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)", backdropFilter: "blur(24px)" }}
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="mx-8 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.12)" }}>
            {item}&nbsp;&nbsp;·
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════ FEATURE CARD (with shine sweep) ═══════════════════════════════ */

function FeatureCard({
  item,
  index,
  className,
}: {
  item: (typeof MENU_CARDS)[0];
  index: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const [hovered, setHovered] = useState(false);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 420, damping: 28 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 420, damping: 28 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 44, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delay: index * 0.09, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
      className={className}
    >
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { mx.set(0); my.set(0); setHovered(false); }}
        className="group h-full"
      >
        <Link href={item.href} className="block h-full">
          <div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-7 transition-all duration-500"
            style={{
              background: "rgba(255,255,255,0.038)",
              backdropFilter: "blur(48px) saturate(170%)",
              WebkitBackdropFilter: "blur(48px) saturate(170%)",
              border: "1px solid rgba(255,255,255,0.085)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
            }}
          >
            {/* Hover gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />

            {/* ✨ Shine sweep on hover */}
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-[55%] -skew-x-[18deg]"
              initial={{ x: "-130%" }}
              animate={hovered ? { x: "260%" } : { x: "-130%" }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)" }}
            />

            {/* Specular top line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 flex items-start justify-between">
              <span
                className="rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}
              >
                {item.tag}
              </span>
              <motion.span
                className="text-3xl leading-none"
                style={{ opacity: 0.45 }}
                whileHover={{ scale: 1.18, opacity: 1, rotate: [0, -8, 8, 0] }}
                transition={{ type: "spring", stiffness: 280 }}
              >
                {item.icon}
              </motion.span>
            </div>

            <div className="relative z-10">
              <h3 className="text-[22px] font-black tracking-[-0.03em] text-white">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/32">{item.description}</p>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/24 transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-white/60">
                바로가기 →
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════ FEATURES SECTION ═══════════════════════════════ */

function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-32">
      <div className="mb-20 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="mb-4 text-[10px] font-bold uppercase tracking-[0.38em] text-white/22"
        >
          Features
        </motion.p>

        {/* Scramble heading */}
        <ScrambleHeading
          text="무엇을 찾고 있나요?"
          className="text-[clamp(30px,5vw,54px)] font-black tracking-[-0.04em] text-white"
        />

        {/* Word reveal subtitle */}
        <p className="mt-4 text-[13px] text-white/28">
          <WordReveal text="원하는 기능을 선택하세요" delay={0.2} />
        </p>
      </div>

      <div className="grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:row-span-2">
          <FeatureCard item={MENU_CARDS[0]} index={0} className="h-full" />
        </div>
        <FeatureCard item={MENU_CARDS[1]} index={1} className="h-full" />
        <FeatureCard item={MENU_CARDS[2]} index={2} className="h-full" />
        <div className="sm:col-span-2">
          <FeatureCard item={MENU_CARDS[3]} index={3} className="h-full" />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════ STATS ═══════════════════════════════ */

function StatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-3xl"
        style={{
          background: "rgba(255,255,255,0.033)",
          backdropFilter: "blur(48px) saturate(160%)",
          WebkitBackdropFilter: "blur(48px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), 0 32px 80px rgba(0,0,0,0.4)",
        }}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09, duration: 0.65 }}
              className="flex flex-col items-center justify-center border-r border-white/[0.05] px-6 py-14 text-center last:border-r-0"
            >
              <p className="text-[clamp(36px,4.5vw,54px)] font-black tracking-[-0.055em] text-white">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/22">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════ CTA BANNER ═══════════════════════════════ */

function CTABanner() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[40px] px-10 py-24 text-center"
        style={{
          background: "rgba(255,255,255,0.042)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 48px 120px rgba(0,0,0,0.45)",
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(255,255,255,0.045) 0%, transparent 55%)" }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
        <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)", filter: "blur(20px)" }} />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)", filter: "blur(20px)" }} />

        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-3 text-[10px] font-bold uppercase tracking-[0.38em] text-white/25"
          >
            지금 바로
          </motion.p>

          {/* Scramble on the CTA heading */}
          <div className="overflow-hidden">
            <ScrambleHeading
              text="한자 공부를 시작하세요"
              className="text-[clamp(26px,4.5vw,52px)] font-black tracking-[-0.04em] text-white"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-[13px] text-white/32"
          >
            반복학습이 가장 효과적인 방법입니다
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex justify-center"
          >
            <MagneticButton
              href="/hub"
              className="block rounded-full bg-white px-10 py-4 text-[12px] font-bold tracking-wider text-black"
              style={{ boxShadow: "0 0 44px rgba(255,255,255,0.22), 0 8px 32px rgba(0,0,0,0.35)" }}
            >
              한자퀴즈 시작
            </MagneticButton>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════ FOOTER ═══════════════════════════════ */

function Footer() {
  return (
    <footer
      className="border-t px-6 py-10"
      style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)", backdropFilter: "blur(24px)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-black tracking-[0.06em] text-white/55">no NAME</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/18">· 2026</span>
        </div>
        <div className="flex gap-6">
          {[
            { label: "한자퀴즈", href: "/hub" },
            { label: "학습자료", href: "/board" },
            { label: "급식", href: "/meal" },
            { label: "일정", href: "/schedule" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[10px] font-semibold uppercase tracking-widest text-white/18 transition-colors hover:text-white/45"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */

export default function IntroPage() {
  return (
    <main className="min-h-screen overflow-x-hidden text-white">
      <Navbar />
      <HeroSection />
      <Marquee />
      <FeaturesSection />
      <StatsSection />
      <CTABanner />
      <Footer />
    </main>
  );
}
