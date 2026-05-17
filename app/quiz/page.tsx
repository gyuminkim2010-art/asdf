"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type HanjaItem = { id: number; character: string; meaning: string; reading: string };
type GameMode = "basic" | "ranking";
type Difficulty = "easy" | "normal" | "hard";
type ScreenMode = "menu" | "play" | "result";
type Question = { id: number; character: string; prompt: string; answer: string; choices: string[]; difficulty: Difficulty };

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
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function getRandomItem<T>(array: T[]) { return array[Math.floor(Math.random() * array.length)]; }

function makeEasyChoices(correctItem: HanjaItem, allItems: HanjaItem[]) {
  const wrongPool = Array.from(new Set(allItems.filter(i => i.id !== correctItem.id).map(i => i.reading)));
  return shuffleArray([correctItem.reading, ...shuffleArray(wrongPool).slice(0, 3)]);
}

function makeNormalChoices(correctItem: HanjaItem, allItems: HanjaItem[]) {
  const correct = `${correctItem.meaning} ${correctItem.reading}`;
  const wrongPool = Array.from(new Set(allItems.filter(i => i.id !== correctItem.id).map(i => `${i.meaning} ${i.reading}`)));
  return shuffleArray([correct, ...shuffleArray(wrongPool).slice(0, 3)]);
}

function makeHardChoices(correctItem: HanjaItem, allItems: HanjaItem[]) {
  const choices = new Set<string>();
  choices.add(`${correctItem.meaning} ${correctItem.reading}`);
  while (choices.size < 4) {
    const m = getRandomItem(allItems);
    const r = getRandomItem(allItems);
    choices.add(`${m.meaning} ${r.reading}`);
  }
  return shuffleArray(Array.from(choices));
}

function makeQuestion(item: HanjaItem, allItems: HanjaItem[], difficulty: Difficulty): Question {
  if (difficulty === "easy") return { id: item.id, character: item.character, prompt: "이 한자의 음은 무엇인가요?", answer: item.reading, choices: makeEasyChoices(item, allItems), difficulty };
  const answer = `${item.meaning} ${item.reading}`;
  return { id: item.id, character: item.character, prompt: "이 한자에 맞는 뜻+음을 골라주세요", answer, choices: difficulty === "normal" ? makeNormalChoices(item, allItems) : makeHardChoices(item, allItems), difficulty };
}

function makeRankingQuestions(count: number, allItems: HanjaItem[]) {
  return Array.from({ length: count }, () => {
    const item = getRandomItem(allItems);
    return makeQuestion(item, allItems, Math.random() < 0.5 ? "normal" : "hard");
  });
}

export default function QuizPage() {
  const [hanjaItems, setHanjaItems] = useState<HanjaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [screen, setScreen] = useState<ScreenMode>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("basic");
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string; nickname: string; role: string } | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wrongPenaltySeconds, setWrongPenaltySeconds] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setLoadError("");
        const [hanjaRes, meRes] = await Promise.all([fetch("/api/hanja", { cache: "no-store" }), fetch("/api/me", { cache: "no-store" })]);
        const [hanjaData, meData] = await Promise.all([hanjaRes.json(), meRes.json()]);
        if (hanjaRes.ok && hanjaData.ok) setHanjaItems(hanjaData.items); else { setHanjaItems([]); setLoadError(hanjaData.message || "한자 데이터를 불러오지 못했습니다."); }
        if (meRes.ok && meData.ok) setCurrentUser(meData.user); else setCurrentUser(null);
      } catch { setHanjaItems([]); setCurrentUser(null); setLoadError("데이터를 불러오는 중 오류가 발생했습니다."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const currentQuestion = screen === "play" && questions[currentIndex] ? questions[currentIndex] : null;
  const isLastRankingQuestion = gameMode === "ranking" && currentIndex === questions.length - 1;
  const isCorrect = useMemo(() => (!currentQuestion || !selected) ? null : selected === currentQuestion.answer, [currentQuestion, selected]);

  useEffect(() => {
    if (screen !== "play" || gameMode !== "ranking") return;
    const timer = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, [screen, gameMode]);

  useEffect(() => {
    if (wrongPenaltySeconds <= 0) return;
    const timer = setInterval(() => setWrongPenaltySeconds(p => p <= 1 ? 0 : p - 1), 1000);
    return () => clearInterval(timer);
  }, [wrongPenaltySeconds]);

  const startBasicMode = (difficulty: Difficulty) => {
    if (hanjaItems.length < 4) { alert("한자가 최소 4개는 있어야 퀴즈를 만들 수 있습니다."); return; }
    setGameMode("basic"); setSelectedDifficulty(difficulty);
    setQuestions([makeQuestion(getRandomItem(hanjaItems), hanjaItems, difficulty)]);
    setCurrentIndex(0); setSelected(null); setShowAnswer(false); setScore(0); setElapsedSeconds(0); setWrongPenaltySeconds(0);
    setScreen("play");
  };

  const startRankingMode = () => {
    if (!currentUser) { alert("랭킹 모드는 로그인 후 이용하실 수 있습니다."); return; }
    if (hanjaItems.length < 4) { alert("퀴즈를 시작하려면 한자 데이터가 4개 이상 필요합니다."); return; }
    setGameMode("ranking"); setQuestions(makeRankingQuestions(30, hanjaItems));
    setCurrentIndex(0); setSelected(null); setShowAnswer(false); setScore(0); setElapsedSeconds(0); setWrongPenaltySeconds(0);
    setScreen("play");
  };

  const handleChoiceClick = async (choice: string) => {
    if (!currentQuestion || showAnswer) return;
    setSelected(choice); setShowAnswer(true);
    const correct = choice === currentQuestion.answer;
    fetch("/api/stats/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ correct }) }).catch(() => {});
    if (!correct) {
      fetch("/api/wrong-note", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: "hanja", contentId: currentQuestion.id, questionText: currentQuestion.character, questionPrompt: currentQuestion.prompt, correctAnswer: currentQuestion.answer, selectedAnswer: choice }) }).catch(() => {});
    }
    if (correct) setScore(p => p + 1);
    else if (gameMode === "ranking") setWrongPenaltySeconds(5);
  };

  const handleNext = async () => {
    if (!showAnswer || !currentQuestion) return;
    if (gameMode === "ranking" && isCorrect === false && wrongPenaltySeconds > 0) return;
    if (gameMode === "basic") {
      setQuestions([makeQuestion(getRandomItem(hanjaItems), hanjaItems, selectedDifficulty)]);
      setCurrentIndex(0); setSelected(null); setShowAnswer(false); return;
    }
    if (isLastRankingQuestion) {
      await fetch("/api/ranking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score, totalCount: questions.length, elapsedSeconds }) });
      setScreen("result"); return;
    }
    setCurrentIndex(p => p + 1); setSelected(null); setShowAnswer(false); setWrongPenaltySeconds(0);
  };

  const handleBackToMenu = () => { setScreen("menu"); setSelected(null); setShowAnswer(false); setWrongPenaltySeconds(0); };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl font-black" style={GLASS}>
            漢
          </motion.div>
          <p className="text-[13px] text-white/35">불러오는 중...</p>
        </motion.div>
      </main>
    );
  }

  if (loadError || hanjaItems.length < 4) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl p-7 text-center max-w-xs w-full space-y-3" style={GLASS}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <p className="text-3xl">{loadError ? "⚠️" : "📭"}</p>
          <p className="font-bold text-white">{loadError || "한자 데이터가 부족합니다"}</p>
          <p className="text-[12px] text-white/35">{loadError ? "잠시 후 다시 시도해 주세요." : "관리자 페이지에서 한자를 추가해 주세요."}</p>
        </motion.div>
      </main>
    );
  }

  /* ───────────── MENU ───────────── */
  if (screen === "menu") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-white">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm space-y-4">

          <div className="flex items-center justify-between">
            <Link href="/hub" className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors">← 돌아가기</Link>
            {currentUser && (
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px]" style={GLASS_SUBTLE}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">{currentUser.nickname.charAt(0)}</div>
                <span className="font-semibold text-white/70">{currentUser.nickname}</span>
              </div>
            )}
          </div>

          {/* 타이틀 */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative overflow-hidden rounded-3xl p-6 flex items-center gap-4" style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black text-white shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              漢
            </motion.div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-0.5">한자</p>
              <p className="text-[22px] font-black tracking-[-0.04em] text-white">한자 퀴즈</p>
              <p className="text-[12px] text-white/35 mt-0.5">모드와 난이도를 선택하세요</p>
            </div>
          </motion.div>

          {/* 난이도 버튼 */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-3xl p-4 space-y-2" style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 px-1">일반 모드</p>
            {([
              { diff: "easy" as Difficulty, emoji: "🌱", label: "쉬움", desc: "음만 맞추기" },
              { diff: "normal" as Difficulty, emoji: "📖", label: "보통", desc: "뜻 + 음 조합 맞추기" },
              { diff: "hard" as Difficulty, emoji: "🔥", label: "어려움", desc: "혼합 오답이 포함된 뜻+음" },
            ]).map(({ diff, emoji, label, desc }, i) => (
              <motion.button key={diff} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
                whileTap={{ scale: 0.97 }} onClick={() => startBasicMode(diff)}
                className="w-full rounded-2xl px-4 py-3.5 text-left transition-all hover:scale-[1.01]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-white text-[13px]">{label}</p>
                    <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
                  </div>
                  <span className="text-white/20 text-sm">→</span>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* 랭킹 모드 */}
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.97 }} onClick={startRankingMode}
            className="relative overflow-hidden w-full rounded-3xl p-5 text-left transition-all hover:scale-[1.01]"
            style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div className="flex-1">
                <p className="font-bold text-white text-[15px]">랭킹 모드</p>
                <p className="text-[11px] text-white/35 mt-0.5">30문제 · 오답 5초 패널티 · 로그인 필요</p>
              </div>
              {currentUser ? (
                <span className="rounded-full px-3 py-1 text-[11px] font-bold text-amber-300" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)" }}>도전</span>
              ) : (
                <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white/30" style={GLASS_SUBTLE}>잠금</span>
              )}
            </div>
          </motion.button>

          {!currentUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <Link href="/login" className="flex items-center justify-center rounded-2xl px-4 py-3 text-[12px] font-medium text-white/35 hover:text-white/55 transition-colors" style={GLASS_SUBTLE}>
                로그인하고 랭킹에 도전하기 →
              </Link>
            </motion.div>
          )}
        </motion.div>
      </main>
    );
  }

  /* ───────────── RESULT ───────────── */
  if (screen === "result") {
    const totalCount = questions.length;
    const wrongCount = totalCount - score;
    const accuracy = Math.round((score / totalCount) * 100);

    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-white">
        <motion.div initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm space-y-4">

          <div className="relative overflow-hidden rounded-3xl p-7 text-center space-y-5" style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 250 }} className="text-5xl">🏆</motion.div>
            <div>
              <p className="text-[11px] text-white/28 mb-1">랭킹 모드 완료</p>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="text-[56px] font-black tracking-[-0.04em] text-white">{accuracy}<span className="text-[24px] text-white/35">%</span></motion.p>
              <p className="text-[13px] text-white/45 mt-1">{score}개 정답 / {totalCount}문제</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ label: "걸린 시간", value: elapsedSeconds, unit: "초" }, { label: "오답 수", value: wrongCount, unit: "개" }].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                className="relative overflow-hidden rounded-2xl p-5 text-center" style={GLASS}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                <p className="text-[10px] text-white/28 mb-1">{stat.label}</p>
                <p className="text-[28px] font-black text-white">{stat.value}<span className="text-[13px] text-white/35 ml-0.5">{stat.unit}</span></p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2.5">
            <motion.button whileTap={{ scale: 0.97 }} onClick={startRankingMode}
              className="w-full rounded-2xl bg-white py-4 text-[14px] font-black text-black hover:bg-white/90 transition-colors"
              style={{ boxShadow: "0 0 32px rgba(255,255,255,0.15)" }}>
              다시 도전하기
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleBackToMenu}
              className="w-full rounded-2xl py-3.5 text-[13px] font-semibold text-white/55 hover:text-white/80 transition-colors" style={GLASS_SUBTLE}>
              모드 선택으로
            </motion.button>
            <Link href="/hub" className="flex items-center justify-center text-[12px] text-white/28 hover:text-white/50 transition-colors py-2">
              ← 홈으로
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  /* ───────────── PLAY ───────────── */
  if (!currentQuestion) return null;

  const diffLabel: Record<Difficulty, string> = { easy: "🌱 쉬움", normal: "📖 보통", hard: "🔥 어려움" };
  const progressPercent = gameMode === "ranking" ? Math.round(((currentIndex + 1) / questions.length) * 100) : null;

  return (
    <main className="min-h-screen p-4 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col">

        {/* 헤더 */}
        <header className="pt-2 pb-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button onClick={handleBackToMenu} className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors">← 모드 선택</button>
            <div className="flex items-center gap-2">
              {gameMode === "ranking" && (
                <div className="rounded-2xl px-3 py-2 text-[12px] font-bold text-white/60" style={GLASS_SUBTLE}>⏱ {elapsedSeconds}초</div>
              )}
              <div className="rounded-2xl px-3 py-2 text-[12px] font-bold text-white/60" style={GLASS_SUBTLE}>✓ {score}</div>
              <Link href="/hub" className="rounded-2xl px-3 py-2 text-[12px] font-semibold text-white/35 hover:text-white/60 transition-colors" style={GLASS_SUBTLE}>홈</Link>
            </div>
          </div>

          {/* 진행 상태 */}
          <div className="relative overflow-hidden rounded-2xl px-4 py-3" style={GLASS_SUBTLE}>
            {gameMode === "ranking" && progressPercent !== null ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-white/35">
                  <span className="font-semibold">{currentIndex + 1} / {questions.length} 문제</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div className="h-full rounded-full bg-white/60" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-white/60">{diffLabel[currentQuestion.difficulty]}</span>
                <span className="text-[11px] text-white/25">무한 연습</span>
              </div>
            )}
          </div>
        </header>

        {/* 퀴즈 카드 */}
        <section className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentQuestion.id}-${currentIndex}`}
              initial={{ opacity: 0, x: 50, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.97 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* 한자 표시 */}
              <div className="relative overflow-hidden rounded-3xl px-6 py-10 text-center space-y-3" style={GLASS}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/28">{currentQuestion.prompt}</p>
                <motion.p
                  key={currentQuestion.character}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-[96px] font-black text-white leading-none"
                  style={{ textShadow: "0 0 60px rgba(255,255,255,0.15)" }}
                >
                  {currentQuestion.character}
                </motion.p>
              </div>

              {/* 선택지 */}
              <div className="relative overflow-hidden rounded-3xl p-4 space-y-2" style={GLASS}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                {currentQuestion.choices.map((choice, idx) => {
                  const isSelected = selected === choice;
                  const isAnswer = currentQuestion.answer === choice;
                  const labels = ["①", "②", "③", "④"];

                  let bg = "rgba(255,255,255,0.04)";
                  let border = "rgba(255,255,255,0.07)";
                  let textColor = "rgba(255,255,255,0.75)";
                  let labelColor = "rgba(255,255,255,0.2)";

                  if (showAnswer) {
                    if (isAnswer) { bg = "rgba(16,185,129,0.12)"; border = "rgba(16,185,129,0.3)"; textColor = "rgba(52,211,153,0.9)"; labelColor = "rgba(52,211,153,0.7)"; }
                    else if (isSelected) { bg = "rgba(239,68,68,0.1)"; border = "rgba(239,68,68,0.3)"; textColor = "rgba(252,165,165,0.8)"; labelColor = "rgba(252,165,165,0.6)"; }
                    else { bg = "rgba(255,255,255,0.02)"; border = "rgba(255,255,255,0.04)"; textColor = "rgba(255,255,255,0.2)"; labelColor = "rgba(255,255,255,0.1)"; }
                  }

                  return (
                    <motion.button
                      key={choice}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileTap={!showAnswer ? { scale: 0.97 } : {}}
                      onClick={() => handleChoiceClick(choice)}
                      disabled={showAnswer}
                      className="w-full rounded-2xl px-4 py-3.5 text-left transition-all duration-300"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-black w-5 shrink-0 transition-colors" style={{ color: labelColor }}>{labels[idx]}</span>
                        <span className="font-semibold flex-1 text-[13px] transition-colors" style={{ color: textColor }}>{choice}</span>
                        {showAnswer && isAnswer && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }} className="text-emerald-400 text-base">✓</motion.span>}
                        {showAnswer && isSelected && !isAnswer && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }} className="text-red-400 text-base">✗</motion.span>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* 피드백 */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28 }}
                    className="rounded-2xl px-5 py-4"
                    style={{ background: isCorrect ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${isCorrect ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}` }}
                  >
                    {isCorrect ? (
                      <div>
                        <p className="font-black text-emerald-400 text-[13px]">정답! 🎉</p>
                        <p className="text-[11px] text-white/40 mt-0.5">정답: <span className="font-semibold text-emerald-400/80">{currentQuestion.answer}</span></p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-black text-red-400 text-[13px]">오답 😢</p>
                        <p className="text-[11px] text-white/40 mt-0.5">정답: <span className="font-semibold text-emerald-400/80">{currentQuestion.answer}</span></p>
                        {gameMode === "ranking" && wrongPenaltySeconds > 0 && (
                          <p className="text-red-400/70 text-[11px] font-semibold mt-1">⏳ {wrongPenaltySeconds}초 후 이동 가능</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* 하단 버튼 */}
        <footer className="sticky bottom-0 pt-4 pb-6">
          <motion.button
            whileTap={showAnswer && !(gameMode === "ranking" && isCorrect === false && wrongPenaltySeconds > 0) ? { scale: 0.97 } : {}}
            onClick={handleNext}
            disabled={!showAnswer || (gameMode === "ranking" && isCorrect === false && wrongPenaltySeconds > 0)}
            className="w-full rounded-2xl py-4 text-[14px] font-black transition-all duration-300"
            style={!showAnswer || (gameMode === "ranking" && isCorrect === false && wrongPenaltySeconds > 0)
              ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" }
              : { background: "white", color: "black", boxShadow: "0 0 32px rgba(255,255,255,0.15)" }
            }
          >
            {!showAnswer ? "선택지를 골라주세요"
              : gameMode === "ranking" && isCorrect === false && wrongPenaltySeconds > 0 ? `${wrongPenaltySeconds}초 후 이동 가능`
              : isLastRankingQuestion ? "결과 보기 →" : "다음 문제 →"}
          </motion.button>
        </footer>
      </div>
    </main>
  );
}
