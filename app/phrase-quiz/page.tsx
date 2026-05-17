"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type PhraseItem = { id: number; category: string; title: string | null; hanjaText: string; koreanText: string; hanjaTokens: string; koreanTokens: string };
type CurrentUser = { id: number; email: string; nickname: string; role: string };
type Direction = "hanja-to-korean" | "korean-to-hanja";
type QuizQuestion = { id: number; category: string; title: string | null; direction: Direction; promptText: string; answerTokens: string[]; poolTokens: string[] };

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

function shuffleArray<T>(array: T[]) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copied[i], copied[j]] = [copied[j], copied[i]]; }
  return copied;
}

function parseTokens(value: string) { return value.split("|").map(v => v.trim()).filter(Boolean); }

export default function PhraseQuizPage() {
  const [items, setItems] = useState<PhraseItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"mixed" | "analects" | "idiom">("mixed");
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [phraseRes, meRes] = await Promise.all([fetch("/api/phrases", { cache: "no-store" }), fetch("/api/me", { cache: "no-store" })]);
        const [phraseData, meData] = await Promise.all([phraseRes.json(), meRes.json()]);
        if (phraseRes.ok && phraseData.ok) setItems(phraseData.items);
        if (meRes.ok && meData.ok) setCurrentUser(meData.user);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const currentQuestion = questions[currentIndex] || null;

  const buildQuestion = (item: PhraseItem, pool: PhraseItem[]): QuizQuestion => {
    const direction: Direction = Math.random() > 0.5 ? "hanja-to-korean" : "korean-to-hanja";
    const answerTokens = direction === "hanja-to-korean" ? parseTokens(item.koreanTokens) : parseTokens(item.hanjaTokens);
    const distractorSource = direction === "hanja-to-korean" ? pool.flatMap(p => parseTokens(p.koreanTokens)) : pool.flatMap(p => parseTokens(p.hanjaTokens));
    const extra = shuffleArray(distractorSource.filter(token => !answerTokens.includes(token))).slice(0, Math.min(3, distractorSource.length));
    return { id: item.id, category: item.category, title: item.title, direction, promptText: direction === "hanja-to-korean" ? item.hanjaText : item.koreanText, answerTokens, poolTokens: shuffleArray([...answerTokens, ...extra]) };
  };

  const startQuiz = () => {
    const filtered = category === "mixed" ? items : items.filter(item => item.category === category);
    if (filtered.length < 3) { alert("해당 카테고리의 문구가 3개 이상 필요합니다."); return; }
    const generated = shuffleArray(filtered).slice(0, Math.min(10, filtered.length)).map(item => buildQuestion(item, filtered));
    setQuestions(generated); setCurrentIndex(0);
    setSelectedTokens([]); setAvailableTokens(generated[0].poolTokens);
    setChecked(false); setIsCorrect(null); setStarted(true);
  };

  useEffect(() => {
    if (currentQuestion) { setSelectedTokens([]); setAvailableTokens(currentQuestion.poolTokens); setChecked(false); setIsCorrect(null); }
  }, [currentIndex, currentQuestion?.id]);

  const moveUp = (token: string, idx: number) => {
    if (checked) return;
    const next = [...availableTokens]; next.splice(idx, 1);
    setAvailableTokens(next); setSelectedTokens(prev => [...prev, token]);
  };

  const moveDown = (token: string, idx: number) => {
    if (checked) return;
    const next = [...selectedTokens]; next.splice(idx, 1);
    setSelectedTokens(next); setAvailableTokens(prev => [...prev, token]);
  };

  const checkAnswer = async () => {
    if (!currentQuestion) return;
    if (selectedTokens.length !== currentQuestion.answerTokens.length) { alert("모든 칸을 채운 뒤 확인해 주세요."); return; }
    const correct = JSON.stringify(selectedTokens) === JSON.stringify(currentQuestion.answerTokens);
    setChecked(true); setIsCorrect(correct);
    if (!correct && currentUser) {
      fetch("/api/wrong-note", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: currentQuestion.category === "analects" ? "phrase-analects" : "phrase-idiom",
          contentId: currentQuestion.id,
          questionText: currentQuestion.promptText,
          questionPrompt: currentQuestion.direction === "hanja-to-korean" ? "한문을 보고 한국어 순서를 배열해 주세요" : "한국어를 보고 한문 순서를 배열해 주세요",
          correctAnswer: currentQuestion.answerTokens.join(" "),
          selectedAnswer: selectedTokens.join(" "),
          extraData: JSON.stringify({ questionType: "arrange", direction: currentQuestion.direction, answerTokens: currentQuestion.answerTokens, poolTokens: currentQuestion.poolTokens }),
        }),
      }).catch(() => {});
    }
  };

  const goNext = () => {
    if (!checked) return;
    if (currentIndex === questions.length - 1) { setStarted(false); return; }
    setCurrentIndex(prev => prev + 1);
  };

  const tokenStateStyle = (token: string, index: number): React.CSSProperties => {
    if (!checked || !currentQuestion) return { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" };
    const correct = currentQuestion.answerTokens[index];
    if (token === correct) return { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "rgba(52,211,153,0.9)" };
    return { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "rgba(252,165,165,0.8)" };
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl font-black" style={GLASS}>
            文
          </motion.div>
          <p className="text-[13px] text-white/35">문구 데이터를 불러오는 중...</p>
        </motion.div>
      </main>
    );
  }

  /* ── MENU ── */
  if (!started) {
    return (
      <main className="min-h-screen text-white overflow-x-hidden">
        <div className="mx-auto max-w-3xl px-4 py-24 md:px-6 space-y-6">

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 mb-1">배열 퀴즈</p>
              <h1 className="text-[clamp(32px,6vw,56px)] font-black tracking-[-0.05em] leading-none"
                style={{ background: "linear-gradient(175deg,#ffffff 15%,rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                논어 / 사자성어
              </h1>
            </div>
            <Link href="/hub" className="shrink-0 rounded-full px-5 py-2.5 text-[12px] font-semibold text-white/45 hover:text-white/75 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
              ← 홈
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl p-7 space-y-6" style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-2">퀴즈 방식</p>
              <p className="text-[13px] text-white/40 leading-relaxed">보기에서 토큰을 눌러 위쪽 답안칸으로 올리고, 다시 누르면 아래로 내려갑니다.</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-3">카테고리 선택</p>
              <div className="grid gap-3 md:grid-cols-3">
                {([
                  { val: "mixed" as const, label: "전체 랜덤", emoji: "🔀" },
                  { val: "analects" as const, label: "논어", emoji: "📜" },
                  { val: "idiom" as const, label: "사자성어", emoji: "🈳" },
                ]).map(({ val, label, emoji }, i) => (
                  <motion.button key={val} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
                    whileTap={{ scale: 0.97 }} onClick={() => setCategory(val)}
                    className="rounded-2xl px-4 py-4 font-bold text-[13px] transition-all"
                    style={category === val
                      ? { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "white" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }
                    }>
                    <span className="block text-xl mb-1">{emoji}</span>
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={startQuiz}
              className="w-full rounded-2xl bg-white py-4 text-[14px] font-black text-black hover:bg-white/90 transition-colors"
              style={{ boxShadow: "0 0 32px rgba(255,255,255,0.15)" }}>
              배열 퀴즈 시작
            </motion.button>
          </motion.div>
        </div>
      </main>
    );
  }

  if (!currentQuestion) return null;

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 md:px-6">

        <header className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/hub" className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors">← 홈</Link>
            <div className="rounded-2xl px-3 py-2 text-[12px] font-bold text-white/50" style={GLASS_SUBTLE}>
              {currentIndex + 1} / {questions.length}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl px-4 py-3" style={GLASS_SUBTLE}>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-white/35">
                <span>{currentQuestion.direction === "hanja-to-korean" ? "한문 → 한국어" : "한국어 → 한문"}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div className="h-full rounded-full bg-white/60" animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section key={`${currentQuestion.id}-${currentIndex}`}
            initial={{ opacity: 0, x: 60, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.98 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 space-y-4">

            {/* 지문 */}
            <div className="relative overflow-hidden rounded-3xl px-6 py-8 text-center" style={GLASS}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/28 mb-4">
                {currentQuestion.direction === "hanja-to-korean" ? "한문을 보고 한국어 순서를 배열해 주세요" : "한국어를 보고 한문 순서를 배열해 주세요"}
              </p>
              <motion.p key={currentQuestion.promptText} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="text-[clamp(20px,4vw,32px)] font-extrabold leading-relaxed text-white">
                {currentQuestion.promptText}
              </motion.p>
              {currentQuestion.title && (
                <p className="text-[11px] text-white/28 mt-3 font-semibold">{currentQuestion.title}</p>
              )}
            </div>

            {/* 답안 칸 */}
            <div className="relative overflow-hidden rounded-3xl p-5" style={GLASS}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-3">정답 배열</p>
              <div className="min-h-[80px] rounded-2xl p-3 flex flex-wrap gap-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)" }}>
                <AnimatePresence>
                  {selectedTokens.map((token, index) => (
                    <motion.button layout key={`selected-${index}-${token}`}
                      initial={{ opacity: 0, scale: 0.8, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -8 }} transition={{ duration: 0.22 }}
                      whileTap={!checked ? { scale: 0.93 } : {}}
                      onClick={() => moveDown(token, index)}
                      className="rounded-2xl px-4 py-2.5 text-[13px] font-bold transition-all"
                      style={tokenStateStyle(token, index)}>
                      {token}
                    </motion.button>
                  ))}
                </AnimatePresence>
                {selectedTokens.length === 0 && (
                  <p className="text-[12px] text-white/20 self-center px-1">토큰을 눌러 배치하세요</p>
                )}
              </div>
            </div>

            {/* 보기 */}
            <div className="relative overflow-hidden rounded-3xl p-5" style={GLASS_SUBTLE}>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-3">보기</p>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {availableTokens.map((token, index) => (
                    <motion.button layout key={`available-${index}-${token}`}
                      initial={{ opacity: 0, scale: 0.8, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -8 }} transition={{ duration: 0.22 }}
                      whileTap={!checked ? { scale: 0.93 } : {}}
                      onClick={() => moveUp(token, index)} disabled={checked}
                      className="rounded-2xl px-4 py-2.5 text-[13px] font-bold transition-all"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                      {token}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* 피드백 */}
            <AnimatePresence>
              {checked && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  className="rounded-2xl px-5 py-4"
                  style={{ background: isCorrect ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${isCorrect ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}` }}>
                  {isCorrect ? (
                    <div>
                      <p className="font-black text-emerald-400 text-[13px]">정답입니다 🎉</p>
                      <p className="text-[11px] text-white/40 mt-0.5">다음 문제로 진행해 주세요.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-black text-red-400 text-[13px]">오답입니다 😢</p>
                      <p className="text-[11px] text-white/40 mt-0.5">빨간 토큰이 틀린 위치입니다.</p>
                      <p className="text-[11px] text-white/35 mt-1">정답: <span className="text-emerald-400/80 font-semibold">{currentQuestion.answerTokens.join(" ")}</span></p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </AnimatePresence>

        <footer className="sticky bottom-0 mt-4 pb-4">
          <motion.button whileTap={{ scale: 0.97 }} onClick={checked ? goNext : checkAnswer}
            className="w-full rounded-2xl bg-white py-4 text-[14px] font-black text-black hover:bg-white/90 transition-colors"
            style={{ boxShadow: "0 0 32px rgba(255,255,255,0.15)" }}>
            {checked ? (currentIndex === questions.length - 1 ? "완료" : "다음 문제 →") : "확인"}
          </motion.button>
        </footer>
      </div>
    </main>
  );
}
