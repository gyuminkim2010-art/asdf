"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type StockHanja = { id: number; character: string; meaning: string; reading: string };
type StockNews  = { id: number; newsTitle: string; newsExcerpt: string; question: string; answer: string; wrongAnswer1: string; wrongAnswer2: string; wrongAnswer3: string; source: string };
type QuizMode   = "hanja" | "news";
type Difficulty = "easy" | "normal" | "hard";
type Screen     = "menu" | "vocab" | "play" | "result";
type Question   = { id: number; character?: string; meaning?: string; newsExcerpt?: string; newsTitle?: string; subPrompt?: string; source?: string; prompt: string; answer: string; choices: string[]; mode: QuizMode };

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function getRandom<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function sameLenPool(item: StockHanja, all: StockHanja[], getStr: (h: StockHanja) => string) {
  const pool = all.filter(h => h.id !== item.id && getStr(h).length === getStr(item).length);
  return pool.length >= 3 ? pool : all.filter(h => h.id !== item.id);
}
function makeEasyChoices(item: StockHanja, all: StockHanja[]) { return shuffle([item.reading, ...shuffle(sameLenPool(item, all, h => h.reading)).slice(0, 3).map(h => h.reading)]); }
function makeNormalChoices(item: StockHanja, all: StockHanja[]) { const c = `${item.meaning} [${item.reading}]`; return shuffle([c, ...shuffle(sameLenPool(item, all, h => h.reading)).slice(0, 3).map(h => `${h.meaning} [${h.reading}]`)]); }
function makeHardChoices(item: StockHanja, all: StockHanja[]) {
  const c = `${item.meaning} [${item.reading}]`; const cs = new Set<string>([c]); const rp = sameLenPool(item, all, h => h.reading);
  while (cs.size < 4) cs.add(`${getRandom(all).meaning} [${getRandom(rp).reading}]`);
  return shuffle(Array.from(cs));
}
function makeHanjaQuestion(item: StockHanja, all: StockHanja[], diff: Difficulty): Question {
  if (diff === "easy") return { id: item.id, character: item.character, meaning: item.meaning, prompt: "이 한자의 음(読み)은 무엇인가요?", answer: item.reading, choices: makeEasyChoices(item, all), mode: "hanja" };
  return { id: item.id, character: item.character, meaning: diff === "normal" ? item.meaning : undefined, prompt: "이 한자에 맞는 뜻 + 음을 골라주세요", answer: `${item.meaning} [${item.reading}]`, choices: diff === "normal" ? makeNormalChoices(item, all) : makeHardChoices(item, all), mode: "hanja" };
}
function extractTargetChar(question: string) {
  const m1 = question.match(/에서\s*[''''""]([一-龥]{1,6})[''''""]\s*자/); if (m1) return m1[1];
  const m2 = question.match(/[''''""]([一-龥]{1,6})[''''""]/); if (m2) return m2[1];
  return undefined;
}
function makeNewsQuestion(q: StockNews): Question {
  return { id: q.id, newsTitle: q.newsTitle, newsExcerpt: q.newsExcerpt, character: extractTargetChar(q.question), subPrompt: q.question, source: q.source, prompt: q.newsExcerpt, answer: q.answer, choices: shuffle([q.answer, q.wrongAnswer1, q.wrongAnswer2, q.wrongAnswer3]), mode: "news" };
}

const DIFF_CONFIG = {
  easy:   { label: "쉬움",   desc: "카드 예습 → 음(읽기)만 맞추기 · 뜻 힌트 제공", emoji: "🌱" },
  normal: { label: "보통",   desc: "뜻 힌트 보며 뜻+음 조합 맞추기",                emoji: "📖" },
  hard:   { label: "어려움", desc: "힌트 없이 뜻+음 맞추기 · 혼합 오답",            emoji: "🔥" },
} as const;

export default function StockQuizPage() {
  const [hanjaList, setHanjaList] = useState<StockHanja[]>([]);
  const [newsList, setNewsList]   = useState<StockNews[]>([]);
  const [loading, setLoading]     = useState(true);
  const [screen, setScreen]       = useState<Screen>("menu");
  const [mode, setMode]           = useState<QuizMode>("hanja");
  const [difficulty, setDiff]     = useState<Difficulty>("normal");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx]             = useState(0);
  const [vocabIdx, setVocabIdx]   = useState(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore]         = useState(0);

  useEffect(() => {
    Promise.all([fetch("/api/stock-hanja").then(r => r.json()), fetch("/api/stock-news").then(r => r.json())])
      .then(([hd, nd]) => { if (hd.ok) setHanjaList(hd.items); if (nd.ok) setNewsList(nd.items); })
      .finally(() => setLoading(false));
  }, []);

  const current    = screen === "play" ? questions[idx] ?? null : null;
  const isLast     = idx === questions.length - 1;
  const isCorrect  = useMemo(() => (!current || !selected) ? null : selected === current.answer, [current, selected]);

  const startHanja = (diff: Difficulty) => {
    if (hanjaList.length < 4) { alert("주식 한자가 최소 4개 이상 필요합니다."); return; }
    setMode("hanja"); setDiff(diff); setScore(0);
    if (diff === "easy") { setVocabIdx(0); setScreen("vocab"); return; }
    setQuestions([makeHanjaQuestion(getRandom(hanjaList), hanjaList, diff)]);
    setIdx(0); setSelected(null); setShowAnswer(false); setScreen("play");
  };

  const startEasyPlay = () => {
    setQuestions([makeHanjaQuestion(getRandom(hanjaList), hanjaList, "easy")]);
    setIdx(0); setSelected(null); setShowAnswer(false); setScreen("play");
  };

  const startNews = () => {
    if (newsList.length === 0) { alert("등록된 뉴스 문제가 없습니다."); return; }
    setMode("news"); setQuestions(shuffle(newsList).slice(0, 10).map(makeNewsQuestion));
    setIdx(0); setSelected(null); setShowAnswer(false); setScore(0); setScreen("play");
  };

  const handleChoice = (choice: string) => {
    if (showAnswer) return;
    setSelected(choice); setShowAnswer(true);
    if (choice === current?.answer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (!showAnswer) return;
    if (mode === "hanja") {
      setQuestions([makeHanjaQuestion(getRandom(hanjaList), hanjaList, difficulty)]);
      setIdx(0); setSelected(null); setShowAnswer(false); return;
    }
    if (isLast) { setScreen("result"); return; }
    setIdx(i => i + 1); setSelected(null); setShowAnswer(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl" style={GLASS}>
            📈
          </motion.div>
          <p className="text-[13px] text-white/35">불러오는 중...</p>
        </motion.div>
      </main>
    );
  }

  /* ── MENU ── */
  if (screen === "menu") return (
    <main className="min-h-screen flex items-center justify-center p-4 text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm space-y-4">

        <div className="flex items-center justify-between">
          <Link href="/hub" className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors">← 돌아가기</Link>
        </div>

        {/* 타이틀 */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative overflow-hidden rounded-3xl p-6 flex items-center gap-4" style={GLASS}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            📈
          </motion.div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-0.5">주식</p>
            <p className="text-[22px] font-black tracking-[-0.04em] text-white">주식 한자 퀴즈</p>
            <p className="text-[12px] text-white/35 mt-0.5">주식 용어 한자 · 뉴스 문제</p>
          </div>
        </motion.div>

        {/* 한자 난이도 */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-3xl p-4 space-y-2" style={GLASS}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 px-1">주식 한자 퀴즈 (무한 연습)</p>
          {(["easy", "normal", "hard"] as Difficulty[]).map((diff, i) => (
            <motion.button key={diff} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
              whileTap={{ scale: 0.97 }} onClick={() => startHanja(diff)}
              className="w-full rounded-2xl px-4 py-3.5 text-left transition-all hover:scale-[1.01]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{DIFF_CONFIG[diff].emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-white text-[13px]">{DIFF_CONFIG[diff].label}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{DIFF_CONFIG[diff].desc}</p>
                </div>
                <span className="text-white/20 text-sm">→</span>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* 뉴스 문제 */}
        <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }} onClick={startNews}
          className="relative overflow-hidden w-full rounded-3xl p-5 text-left transition-all hover:scale-[1.01]" style={GLASS}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">📰</span>
            <div className="flex-1">
              <p className="font-bold text-white text-[15px]">뉴스 기반 문제</p>
              <p className="text-[11px] text-white/35 mt-0.5">실제 주식 뉴스에서 출제 · {newsList.length}문제</p>
            </div>
            <span className="text-white/20">→</span>
          </div>
        </motion.button>

        {/* 통계 */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid grid-cols-2 gap-3">
          {[{ emoji: "漢", label: "등록 한자", count: hanjaList.length }, { emoji: "📰", label: "뉴스 문제", count: newsList.length }].map((item, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl p-5 text-center" style={GLASS_SUBTLE}>
              <p className="text-xl mb-1">{item.emoji}</p>
              <p className="text-[10px] text-white/28 mb-0.5">{item.label}</p>
              <p className="text-[22px] font-black text-white">{item.count}<span className="text-[13px] text-white/35 ml-0.5">개</span></p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </main>
  );

  /* ── VOCAB ── */
  if (screen === "vocab") {
    const vocabItem = hanjaList[vocabIdx];
    const isFirst = vocabIdx === 0;
    const isVocabLast = vocabIdx === hanjaList.length - 1;

    return (
      <main className="min-h-screen p-4 text-white">
        <div className="mx-auto max-w-sm flex flex-col" style={{ minHeight: "100dvh" }}>
          <header className="pt-2 pb-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <button onClick={() => setScreen("menu")} className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors">← 돌아가기</button>
              <span className="text-[12px] font-bold text-white/40">🌱 쉬움 모드</span>
            </div>

            <div className="relative overflow-hidden rounded-2xl px-4 py-3" style={GLASS_SUBTLE}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-white/35">
                  <span className="font-semibold">단어 카드</span>
                  <span>{vocabIdx + 1} / {hanjaList.length}</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div className="h-full rounded-full bg-white/60" animate={{ width: `${((vocabIdx + 1) / hanjaList.length) * 100}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
            </div>
          </header>

          <section className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={vocabIdx}
                initial={{ opacity: 0, x: 60, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -60, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <div className="relative overflow-hidden rounded-3xl px-5 py-12 text-center space-y-5" style={GLASS}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                  <motion.p key={vocabItem.character} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    className="text-[96px] font-black text-white leading-none" style={{ textShadow: "0 0 60px rgba(255,255,255,0.15)" }}>
                    {vocabItem.character}
                  </motion.p>
                  <div className="space-y-1.5">
                    <p className="text-[20px] font-bold text-white/80">{vocabItem.meaning}</p>
                    <p className="text-[16px] text-white/40">{vocabItem.reading}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 mt-4">
              {[{ disabled: isFirst, onClick: () => setVocabIdx(i => i - 1), label: "← 이전" }, { disabled: isVocabLast, onClick: () => setVocabIdx(i => i + 1), label: "다음 →" }].map((btn, i) => (
                <motion.button key={i} whileTap={!btn.disabled ? { scale: 0.95 } : {}} onClick={btn.onClick} disabled={btn.disabled}
                  className="flex-1 rounded-2xl py-3.5 text-[13px] font-bold transition-colors"
                  style={btn.disabled ? { ...GLASS_SUBTLE, color: "rgba(255,255,255,0.15)" } : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                  {btn.label}
                </motion.button>
              ))}
            </div>
          </section>

          <footer className="shrink-0 pt-4 pb-6">
            <motion.button whileTap={{ scale: 0.97 }} onClick={startEasyPlay}
              className="w-full rounded-2xl bg-white py-4 text-[14px] font-black text-black hover:bg-white/90 transition-colors"
              style={{ boxShadow: "0 0 32px rgba(255,255,255,0.15)" }}>
              퀴즈 시작 →
            </motion.button>
          </footer>
        </div>
      </main>
    );
  }

  /* ── RESULT ── */
  if (screen === "result") {
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <main className="min-h-screen flex items-center justify-center p-4 text-white">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-sm space-y-4">

          <div className="relative overflow-hidden rounded-3xl p-7 text-center space-y-5" style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 250 }} className="text-5xl">🎯</motion.div>
            <div>
              <p className="text-[11px] text-white/28 mb-1">뉴스 문제 완료</p>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="text-[56px] font-black tracking-[-0.04em] text-white">{accuracy}<span className="text-[24px] text-white/35">%</span></motion.p>
              <p className="text-[13px] text-white/45 mt-1">{score}개 정답 / {questions.length}문제</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button onClick={startNews} className="w-full rounded-2xl bg-white py-4 text-[14px] font-black text-black hover:bg-white/90 transition-colors" style={{ boxShadow: "0 0 32px rgba(255,255,255,0.15)" }}>다시 풀기</button>
            <button onClick={() => setScreen("menu")} className="w-full rounded-2xl py-3.5 text-[13px] font-semibold text-white/55 hover:text-white/80 transition-colors" style={GLASS_SUBTLE}>모드 선택으로</button>
            <Link href="/hub" className="flex items-center justify-center text-[12px] text-white/28 hover:text-white/50 transition-colors py-2">← 홈으로</Link>
          </div>
        </motion.div>
      </main>
    );
  }

  /* ── PLAY ── */
  if (!current) return null;
  const progressPercent = mode === "news" ? Math.round(((idx + 1) / questions.length) * 100) : null;

  return (
    <main className="min-h-screen p-4 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col">

        <header className="pt-2 pb-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => mode === "hanja" && difficulty === "easy" ? setScreen("vocab") : setScreen("menu")}
              className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors">
              ← {mode === "hanja" && difficulty === "easy" ? "단어장" : "모드 선택"}
            </button>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl px-3 py-2 text-[12px] font-bold text-white/60" style={GLASS_SUBTLE}>✓ {score}</div>
              <Link href="/hub" className="rounded-2xl px-3 py-2 text-[12px] font-semibold text-white/35 hover:text-white/60 transition-colors" style={GLASS_SUBTLE}>홈</Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl px-4 py-3" style={GLASS_SUBTLE}>
            {mode === "news" && progressPercent !== null ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-white/35">
                  <span className="font-semibold">📰 뉴스 문제 {idx + 1} / {questions.length}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div className="h-full rounded-full bg-white/60" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.4 }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-white/60">{DIFF_CONFIG[difficulty].emoji} {DIFF_CONFIG[difficulty].label}</span>
                <span className="text-[11px] text-white/25">무한 연습</span>
              </div>
            )}
          </div>
        </header>

        <section className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={`${current.id}-${idx}`}
              initial={{ opacity: 0, x: 50, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.97 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }} className="space-y-3">

              {/* 지문 카드 */}
              <div className="relative overflow-hidden rounded-3xl px-5 py-7" style={GLASS}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                {current.mode === "hanja" ? (
                  <div className="text-center space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/28">{current.prompt}</p>
                    <motion.p key={current.character} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="text-[96px] font-black text-white leading-none" style={{ textShadow: "0 0 60px rgba(255,255,255,0.15)" }}>
                      {current.character}
                    </motion.p>
                    {current.meaning && (
                      <div className="rounded-2xl px-4 py-3 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-[10px] font-bold text-white/25 mb-1">뜻 힌트</p>
                        <p className="text-[13px] font-semibold text-white/60 leading-relaxed">{current.meaning}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {current.character && (
                      <motion.p key={current.character} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="text-center text-[72px] font-black text-white leading-none" style={{ textShadow: "0 0 60px rgba(255,255,255,0.15)" }}>
                        {current.character}
                      </motion.p>
                    )}
                    <div className="rounded-2xl px-4 py-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="text-[10px] font-bold text-white/25 mb-1.5">📰 {current.newsTitle?.replace(/\([가-힣]+\)/g, "")}</p>
                      <p className="text-[13px] text-white/55 leading-relaxed">{current.newsExcerpt?.replace(/\([가-힣]+\)/g, "")}</p>
                      {current.source && <p className="text-[10px] text-white/20 mt-2">출처: {current.source}</p>}
                    </div>
                    <p className="font-bold text-white/75 text-[13px] leading-snug">{current.subPrompt}</p>
                  </div>
                )}
              </div>

              {/* 선택지 */}
              <div className="relative overflow-hidden rounded-3xl p-4 space-y-2" style={GLASS}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                {current.choices.map((choice, i) => {
                  const isSel = selected === choice, isAns = current.answer === choice;
                  const labels = ["①", "②", "③", "④"];
                  let bg = "rgba(255,255,255,0.04)", border = "rgba(255,255,255,0.07)", textColor = "rgba(255,255,255,0.75)", labelColor = "rgba(255,255,255,0.2)";
                  if (showAnswer) {
                    if (isAns) { bg = "rgba(16,185,129,0.12)"; border = "rgba(16,185,129,0.3)"; textColor = "rgba(52,211,153,0.9)"; labelColor = "rgba(52,211,153,0.7)"; }
                    else if (isSel) { bg = "rgba(239,68,68,0.1)"; border = "rgba(239,68,68,0.3)"; textColor = "rgba(252,165,165,0.8)"; labelColor = "rgba(252,165,165,0.6)"; }
                    else { bg = "rgba(255,255,255,0.02)"; border = "rgba(255,255,255,0.04)"; textColor = "rgba(255,255,255,0.2)"; labelColor = "rgba(255,255,255,0.1)"; }
                  }
                  return (
                    <motion.button key={choice} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      whileTap={!showAnswer ? { scale: 0.97 } : {}} onClick={() => handleChoice(choice)} disabled={showAnswer}
                      className="w-full rounded-2xl px-4 py-3 text-left transition-all duration-300"
                      style={{ background: bg, border: `1px solid ${border}` }}>
                      <div className="flex items-start gap-3">
                        <span className="text-[13px] font-black shrink-0 mt-0.5 transition-colors" style={{ color: labelColor }}>{labels[i]}</span>
                        <span className="font-medium text-[13px] leading-relaxed flex-1 transition-colors" style={{ color: textColor }}>{choice}</span>
                        {showAnswer && isAns && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }} className="ml-auto text-emerald-400 shrink-0">✓</motion.span>}
                        {showAnswer && isSel && !isAns && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }} className="ml-auto text-red-400 shrink-0">✗</motion.span>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showAnswer && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
                    className="rounded-2xl px-5 py-4"
                    style={{ background: isCorrect ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)", border: `1px solid ${isCorrect ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}` }}>
                    <p className={`font-black text-[13px] ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>{isCorrect ? "정답! 🎉" : "오답 😢"}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">정답: <span className="font-semibold text-emerald-400/80">{current.answer}</span></p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </section>

        <footer className="sticky bottom-0 pt-4 pb-6">
          <motion.button whileTap={showAnswer ? { scale: 0.97 } : {}} onClick={handleNext} disabled={!showAnswer}
            className="w-full rounded-2xl py-4 text-[14px] font-black transition-all duration-300"
            style={!showAnswer
              ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" }
              : { background: "white", color: "black", boxShadow: "0 0 32px rgba(255,255,255,0.15)" }
            }>
            {!showAnswer ? "선택지를 골라주세요" : mode === "news" && isLast ? "결과 보기 →" : "다음 문제 →"}
          </motion.button>
        </footer>
      </div>
    </main>
  );
}
