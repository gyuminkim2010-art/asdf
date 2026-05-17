"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type WrongNote = {
  id: number;
  contentType: string;
  contentId: number;
  questionText: string;
  questionPrompt: string;
  correctAnswer: string;
  selectedAnswer: string;
  createdAt: string;
};

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

const GLASS_SUBTLE = {
  background: "rgba(255,255,255,0.025)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.06)",
} as React.CSSProperties;

export default function WrongNotePage() {
  const [notes, setNotes] = useState<WrongNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/wrong-note", { cache: "no-store" });
      const data = await res.json();
      if (res.status === 401) { setLoginRequired(true); setNotes([]); return; }
      if (res.ok && data.ok) setNotes(data.notes);
      else setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotes(); }, []);

  const handleDeleteOne = async (id: number) => {
    const res = await fetch(`/api/wrong-note/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) { alert(data.message || "오답 삭제 중 오류가 발생했습니다."); return; }
    await loadNotes();
    alert("오답이 삭제되었습니다.");
  };

  const handleDeleteAll = async () => {
    const res = await fetch("/api/wrong-note", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) { alert(data.message || "오답노트 삭제 중 오류가 발생했습니다."); return; }
    await loadNotes();
    alert("오답노트가 전체 삭제되었습니다.");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-white/35">오답노트를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  if (loginRequired) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 text-white">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-8 text-center max-w-sm w-full"
          style={GLASS}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-[22px] font-black tracking-[-0.04em] text-white mb-2">로그인이 필요합니다</h1>
          <p className="text-[13px] text-white/35 mb-6">오답노트는 로그인 후 이용하실 수 있습니다.</p>
          <div className="space-y-2">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3.5 text-[13px] font-bold text-black hover:bg-white/90 transition-colors"
              style={{ boxShadow: "0 0 24px rgba(255,255,255,0.15)" }}
            >
              로그인하기
            </Link>
            <Link
              href="/hub"
              className="flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-[13px] font-semibold text-white/45 hover:text-white/70 transition-colors"
              style={GLASS_SUBTLE}
            >
              홈으로 이동
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto max-w-4xl px-4 py-24 md:px-6 space-y-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between gap-4"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 mb-1">로그인 사용자 전용</p>
            <h1
              className="text-[clamp(32px,6vw,56px)] font-black tracking-[-0.05em] leading-none"
              style={{
                background: "linear-gradient(175deg, #ffffff 15%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              오답노트
            </h1>
          </div>
          <Link
            href="/hub"
            className="shrink-0 rounded-full px-5 py-2.5 text-[12px] font-semibold text-white/45 hover:text-white/75 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            ← 홈
          </Link>
        </motion.div>

        {/* Action cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-3 md:grid-cols-3"
        >
          <div className="relative overflow-hidden rounded-2xl p-5" style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-2">저장된 오답</p>
            <p className="text-[36px] font-black tracking-[-0.05em] text-white">{notes.length}<span className="text-[16px] text-white/35 ml-1 font-normal">개</span></p>
          </div>

          <Link
            href="/wrong-note/play"
            className={`relative overflow-hidden rounded-2xl p-5 text-center font-bold transition-all duration-300 flex items-center justify-center ${
              notes.length === 0 ? "pointer-events-none opacity-40" : "hover:scale-[1.01]"
            }`}
            style={notes.length > 0 ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", backdropFilter: "blur(24px)" } : GLASS_SUBTLE}
          >
            <span className={`text-[14px] font-bold ${notes.length > 0 ? "text-emerald-300" : "text-white/30"}`}>
              오답 다시 풀기
            </span>
          </Link>

          <button
            onClick={handleDeleteAll}
            disabled={notes.length === 0}
            className={`relative overflow-hidden rounded-2xl p-5 text-center font-bold transition-all duration-300 ${
              notes.length === 0 ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.01]"
            }`}
            style={notes.length > 0 ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", backdropFilter: "blur(24px)" } : GLASS_SUBTLE}
          >
            <span className={`text-[14px] font-bold ${notes.length > 0 ? "text-red-400" : "text-white/30"}`}>
              오답 전체 삭제
            </span>
          </button>
        </motion.div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <div className="rounded-3xl p-10 text-center" style={GLASS_SUBTLE}>
            <p className="text-3xl mb-3">📝</p>
            <p className="font-bold text-white/55 text-[15px]">저장된 오답이 없습니다</p>
            <p className="text-[12px] text-white/28 mt-1">문제를 틀리면 자동으로 이곳에 저장됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl p-6"
                style={GLASS}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />

                <div className="flex items-center justify-between mb-4">
                  <span
                    className="rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em]"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
                  >
                    {index + 1}번째 오답
                  </span>
                  <p className="text-[10px] text-white/22">{new Date(note.createdAt).toLocaleString("ko-KR")}</p>
                </div>

                {/* Question */}
                <div
                  className="rounded-2xl p-5 text-center mb-4"
                  style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)" }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300/50 mb-2">{note.questionPrompt}</p>
                  <p className="text-[clamp(36px,6vw,60px)] font-black text-white tracking-[-0.04em]">{note.questionText}</p>
                </div>

                {/* Answers */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400/50 mb-1.5">선택한 답</p>
                    <p className="text-[15px] font-bold text-red-300/80">{note.selectedAnswer}</p>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/50 mb-1.5">정답</p>
                    <p className="text-[15px] font-bold text-emerald-300/80">{note.correctAnswer}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-semibold text-white/30"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    유형: {note.contentType}
                  </span>
                  <button
                    onClick={() => handleDeleteOne(note.id)}
                    className="rounded-full px-4 py-1.5 text-[11px] font-bold text-red-400/70 hover:text-red-300 transition-colors"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
                  >
                    삭제
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
