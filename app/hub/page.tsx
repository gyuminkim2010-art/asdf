"use client";

import Link from "next/link";
import MagneticButton from "../components/ui/magnetic-button";
import MagneticAction from "../components/ui/magnetic-action";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type MeUser = {
  id: number;
  email: string;
  nickname: string;
  role: string;
};

type RankingItem = {
  id: number;
  score: number;
  totalCount: number;
  elapsedSeconds: number;
  createdAt: string;
  user: { nickname: string };
};

const MEDAL = ["🥇", "🥈", "🥉"];

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

const QUIZ_ITEMS = [
  {
    href: "/quiz",
    icon: "漢",
    iconStyle: { background: "linear-gradient(135deg, #10b981, #0d9488)" },
    title: "한자 퀴즈",
    desc: "음독, 뜻+음 조합",
    accentColor: "rgba(16,185,129,0.15)",
    tag: "STUDY",
  },
  {
    href: "/stock-quiz",
    icon: "📈",
    iconStyle: { background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" },
    title: "주식 퀴즈",
    desc: "용어 · 뉴스 문제",
    accentColor: "rgba(59,130,246,0.15)",
    tag: "FINANCE",
  },
];

const SUB_ITEMS = [
  { href: "/phrase-quiz", icon: "📜", title: "논어 / 사자성어", desc: "배열 퀴즈" },
  { href: "/ranking", icon: "🏆", title: "랭킹 보기", desc: "전체 순위 확인" },
  { href: "/wrong-note", icon: "📝", title: "오답노트", desc: "틀린 문제 복습" },
];

function CardHover({ href, children, delay = 0 }: { href: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <Link href={href} className="block h-full">
        {children}
      </Link>
    </motion.div>
  );
}

export default function HubPage() {
  const [currentUser, setCurrentUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [topRankings, setTopRankings] = useState<RankingItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, rankingRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/ranking?limit=100", { cache: "no-store" }),
        ]);
        const meData = await meRes.json();
        const rankingData = await rankingRes.json();
        if (meRes.ok && meData.ok) setCurrentUser(meData.user);
        if (rankingRes.ok && rankingData.ok) {
          const seen = new Set<string | number>();
          setTopRankings(
            (rankingData.rankings as RankingItem[])
              .filter((item: any) => {
                const id = item.userId || item.user?.nickname;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
              })
              .slice(0, 10)
          );
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setCurrentUser(null);
    alert("로그아웃되었습니다.");
  };

  return (
    <main className="min-h-screen overflow-x-hidden text-white">
      {/* Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 right-0 top-0 z-50 px-4 py-4 md:px-6"
      >
        <div
          className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3"
          style={GLASS}
        >
          <MagneticButton
            href="/"
            className="flex items-center gap-1.5 text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors"
          >
            ← 메인화면
          </MagneticButton>

          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-black tracking-[0.06em] text-white">no NAME</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">hub</span>
          </div>

          <div className="flex items-center gap-2">
            {!loading && (currentUser ? (
              <>
                <div
                  className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {currentUser.nickname.charAt(0)}
                  </div>
                  <span className="font-semibold text-white/70">{currentUser.nickname}</span>
                </div>
                <MagneticAction
                  onClick={handleLogout}
                  className="rounded-full px-4 py-1.5 text-[11px] font-semibold text-red-400/80 hover:text-red-300 transition-colors"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
                >
                  로그아웃
                </MagneticAction>
              </>
            ) : (
              <MagneticButton
                href="/login"
                className="block rounded-full px-4 py-1.5 text-[11px] font-semibold text-white/55 hover:text-white/80 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                로그인
              </MagneticButton>
            ))}
          </div>
        </div>
      </motion.header>

      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 md:px-6">
        {/* Hero heading */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-center"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/30 mb-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            Project · no NAME
          </div>
          <h1 className="text-[clamp(42px,8vw,96px)] font-black tracking-[-0.055em] leading-none"
            style={{
              background: "linear-gradient(175deg, #ffffff 15%, rgba(255,255,255,0.6) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            한자 퀴즈
          </h1>
          <p className="mt-4 text-[13px] text-white/28">원하는 학습 방식을 선택하세요</p>
        </motion.div>

        <div className="grid md:grid-cols-[1fr_340px] gap-5 items-start">
          {/* Left column: quiz menu */}
          <div className="space-y-4">
            {/* Main 2-col quiz cards */}
            <div className="grid grid-cols-2 gap-4">
              {QUIZ_ITEMS.map((item, i) => (
                <CardHover key={item.href} href={item.href} delay={0.15 + i * 0.08}>
                  <div
                    className="relative overflow-hidden rounded-3xl p-6 h-full min-h-[170px] flex flex-col justify-between group"
                    style={GLASS}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse at 30% 30%, ${item.accentColor}, transparent 70%)` }}
                    />
                    <div className="relative z-10">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xl font-black mb-4 shadow-lg"
                        style={item.iconStyle}
                      >
                        {item.icon}
                      </div>
                      <span
                        className="text-[8px] font-bold uppercase tracking-[0.22em] px-2 py-0.5 rounded-full"
                        style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <p className="font-black text-white text-[18px] leading-tight tracking-[-0.02em]">{item.title}</p>
                      <p className="text-[12px] text-white/35 mt-1">{item.desc}</p>
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/22 group-hover:text-white/55 group-hover:translate-x-1 transition-all duration-300">
                        시작 →
                      </p>
                    </div>
                  </div>
                </CardHover>
              ))}
            </div>

            {/* 모의주식 full-width */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
            >
              <Link href="/stock-sim" className="block group">
                <div
                  className="relative overflow-hidden rounded-3xl px-6 py-5 flex items-center gap-5"
                  style={GLASS}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.12), transparent 65%)" }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20 shrink-0 relative z-10">
                    📊
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="font-black text-white text-[17px] tracking-[-0.02em]">모의주식</p>
                    <p className="text-[12px] text-white/35 mt-0.5">실시간 주가 · 한국·미국 주식 · 시작자금 200만원</p>
                  </div>
                  <span className="text-[11px] font-bold text-white/25 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-300 relative z-10 shrink-0">
                    시작 →
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Sub menu 3-col + profile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SUB_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.38 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3 }}
                >
                  <Link href={item.href} className="block group">
                    <div
                      className="relative overflow-hidden rounded-2xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(32px)",
                        WebkitBackdropFilter: "blur(32px)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <p className="text-2xl mb-2.5">{item.icon}</p>
                      <p className="font-bold text-white text-[13px] leading-tight">{item.title}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {/* Profile or Login */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.59, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
              >
                {currentUser ? (
                  <div
                    className="relative overflow-hidden rounded-2xl p-4"
                    style={{
                      background: "rgba(139,92,246,0.07)",
                      backdropFilter: "blur(32px)",
                      WebkitBackdropFilter: "blur(32px)",
                      border: "1px solid rgba(139,92,246,0.18)",
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold mb-2.5">
                      {currentUser.nickname.charAt(0)}
                    </div>
                    <p className="font-bold text-white text-[13px] leading-tight truncate">{currentUser.nickname}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{currentUser.role}</p>
                  </div>
                ) : (
                  <Link href="/login" className="block group">
                    <div
                      className="relative overflow-hidden rounded-2xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        backdropFilter: "blur(32px)",
                        WebkitBackdropFilter: "blur(32px)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <p className="text-2xl mb-2.5">🔑</p>
                      <p className="font-bold text-white text-[13px] leading-tight">로그인</p>
                      <p className="text-[11px] text-white/30 mt-0.5">랭킹 기록 저장</p>
                    </div>
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Admin menu */}
            {currentUser?.role === "admin" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.65 }}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { href: "/admin", icon: "⚙️", label: "관리자" },
                  { href: "/admin/phrases", icon: "📚", label: "문구 관리" },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="block">
                    <div
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(251,146,60,0.07)",
                        border: "1px solid rgba(251,146,60,0.16)",
                        backdropFilter: "blur(24px)",
                      }}
                    >
                      <p className="text-xl mb-2">{item.icon}</p>
                      <p className="font-bold text-orange-300/80 text-[13px]">{item.label}</p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right column: Ranking TOP 10 */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative overflow-hidden rounded-3xl p-5" style={GLASS}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">실시간</p>
                  <h2 className="text-[20px] font-black tracking-[-0.04em] text-white mt-0.5">랭킹 TOP 10</h2>
                </div>
                <div
                  className="rounded-full px-3 py-1.5 text-[10px] font-bold"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "rgba(251,191,36,0.85)" }}
                >
                  🏆 TOP
                </div>
              </div>

              {loading ? (
                <div className="space-y-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
              ) : topRankings.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-2xl mb-2">🌱</p>
                  <p className="font-semibold text-white/60 text-[13px]">아직 랭킹이 없습니다</p>
                  <p className="text-[11px] text-white/28 mt-1">첫 번째 도전자가 되어보세요!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topRankings.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-2xl px-4 py-3 flex items-center gap-3"
                      style={index < 3 ? {
                        background: index === 0 ? "rgba(251,191,36,0.08)" : index === 1 ? "rgba(148,163,184,0.08)" : "rgba(251,146,60,0.08)",
                        border: index === 0 ? "1px solid rgba(251,191,36,0.2)" : index === 1 ? "1px solid rgba(148,163,184,0.18)" : "1px solid rgba(251,146,60,0.18)",
                      } : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-base w-7 text-center shrink-0 font-bold">
                        {index < 3 ? MEDAL[index] : <span className="text-white/30 text-[13px]">{index + 1}</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-[13px] truncate">{item.user.nickname}</p>
                        <p className="text-[11px] text-white/30">{item.elapsedSeconds}초</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-white text-[13px]">
                          {item.score}<span className="text-white/25 font-normal">/{item.totalCount}</span>
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <MagneticButton
                href="/ranking"
                className="mt-4 flex items-center justify-center rounded-2xl py-3 text-[12px] font-bold text-white/70 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                전체 랭킹 보기 →
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
