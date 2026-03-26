"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type PhraseItem = {
  id: number;
  category: string;
  title: string | null;
  hanjaText: string;
  koreanText: string;
  hanjaTokens: string;
  koreanTokens: string;
};

type CurrentUser = {
  id: number;
  email: string;
  nickname: string;
  role: string;
};

type Direction = "hanja-to-korean" | "korean-to-hanja";

type QuizQuestion = {
  id: number;
  category: string;
  title: string | null;
  direction: Direction;
  promptText: string;
  answerTokens: string[];
  poolTokens: string[];
};

function shuffleArray<T>(array: T[]) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function parseTokens(value: string) {
  return value
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

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
        const [phraseRes, meRes] = await Promise.all([
          fetch("/api/phrases", { cache: "no-store" }),
          fetch("/api/me", { cache: "no-store" }),
        ]);

        const phraseData = await phraseRes.json();
        const meData = await meRes.json();

        if (phraseRes.ok && phraseData.ok) {
          setItems(phraseData.items);
        }

        if (meRes.ok && meData.ok) {
          setCurrentUser(meData.user);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const currentQuestion = questions[currentIndex] || null;

  const buildQuestion = (item: PhraseItem, pool: PhraseItem[]): QuizQuestion => {
    const direction: Direction =
      Math.random() > 0.5 ? "hanja-to-korean" : "korean-to-hanja";

    const answerTokens =
      direction === "hanja-to-korean"
        ? parseTokens(item.koreanTokens)
        : parseTokens(item.hanjaTokens);

    const distractorSource =
      direction === "hanja-to-korean"
        ? pool.flatMap((p) => parseTokens(p.koreanTokens))
        : pool.flatMap((p) => parseTokens(p.hanjaTokens));

    const extra = shuffleArray(
      distractorSource.filter((token) => !answerTokens.includes(token))
    ).slice(0, Math.min(3, distractorSource.length));

    const poolTokens = shuffleArray([...answerTokens, ...extra]);

    return {
      id: item.id,
      category: item.category,
      title: item.title,
      direction,
      promptText: direction === "hanja-to-korean" ? item.hanjaText : item.koreanText,
      answerTokens,
      poolTokens,
    };
  };

  const startQuiz = () => {
    const filtered =
      category === "mixed"
        ? items
        : items.filter((item) => item.category === category);

    if (filtered.length < 3) {
      alert("해당 카테고리의 문구가 3개 이상 필요합니다.");
      return;
    }

    const generated = shuffleArray(filtered)
      .slice(0, Math.min(10, filtered.length))
      .map((item) => buildQuestion(item, filtered));

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedTokens([]);
    setAvailableTokens(generated[0].poolTokens);
    setChecked(false);
    setIsCorrect(null);
    setStarted(true);
  };

  useEffect(() => {
    if (currentQuestion) {
      setSelectedTokens([]);
      setAvailableTokens(currentQuestion.poolTokens);
      setChecked(false);
      setIsCorrect(null);
    }
  }, [currentIndex, currentQuestion?.id]);

  const moveUp = (token: string, idx: number) => {
    if (checked) return;

    const nextAvailable = [...availableTokens];
    nextAvailable.splice(idx, 1);
    setAvailableTokens(nextAvailable);
    setSelectedTokens((prev) => [...prev, token]);
  };

  const moveDown = (token: string, idx: number) => {
    if (checked) return;

    const nextSelected = [...selectedTokens];
    nextSelected.splice(idx, 1);
    setSelectedTokens(nextSelected);
    setAvailableTokens((prev) => [...prev, token]);
  };

  const checkAnswer = async () => {
    if (!currentQuestion) return;
    if (selectedTokens.length !== currentQuestion.answerTokens.length) {
      alert("모든 칸을 채운 뒤 확인해 주세요.");
      return;
    }

    const correct =
      JSON.stringify(selectedTokens) === JSON.stringify(currentQuestion.answerTokens);

    setChecked(true);
    setIsCorrect(correct);

    if (!correct && currentUser) {
      fetch("/api/wrong-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType:
            currentQuestion.category === "analects"
              ? "phrase-analects"
              : "phrase-idiom",
          contentId: currentQuestion.id,
          questionText: currentQuestion.promptText,
          questionPrompt:
            currentQuestion.direction === "hanja-to-korean"
              ? "한문을 보고 한국어 순서를 배열해 주세요"
              : "한국어를 보고 한문 순서를 배열해 주세요",
          correctAnswer: currentQuestion.answerTokens.join(" "),
          selectedAnswer: selectedTokens.join(" "),
          extraData: JSON.stringify({
            questionType: "arrange",
            direction: currentQuestion.direction,
            answerTokens: currentQuestion.answerTokens,
            poolTokens: currentQuestion.poolTokens,
          }),
        }),
      }).catch(() => {});
    }
  };

  const goNext = () => {
    if (!checked) return;

    if (currentIndex === questions.length - 1) {
      setStarted(false);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const tokenStateClass = (token: string, index: number) => {
    if (!checked || !currentQuestion) {
      return "border-gray-200 bg-white text-gray-800";
    }

    const correctToken = currentQuestion.answerTokens[index];

    if (token === correctToken) {
      return "border-green-400 bg-green-100 text-green-700";
    }

    return "border-red-300 bg-red-100 text-red-600";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">문구 데이터를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-gray-900">
              논어 / 사자성어 배열 퀴즈
            </h1>

            <Link
              href="/hub"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm"
            >
              홈으로 이동
            </Link>
          </div>

          <div className="rounded-[28px] border border-green-100 bg-white p-6 shadow-xl">
            <p className="text-gray-600">
              아래 보기에서 토큰을 눌러 위쪽 답안칸으로 올리고, 다시 누르면 아래로 내려갑니다.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button
                onClick={() => setCategory("mixed")}
                className={`rounded-2xl px-4 py-4 font-bold ${
                  category === "mixed"
                    ? "bg-green-500 text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                전체 랜덤
              </button>

              <button
                onClick={() => setCategory("analects")}
                className={`rounded-2xl px-4 py-4 font-bold ${
                  category === "analects"
                    ? "bg-green-500 text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                논어
              </button>

              <button
                onClick={() => setCategory("idiom")}
                className={`rounded-2xl px-4 py-4 font-bold ${
                  category === "idiom"
                    ? "bg-green-500 text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                사자성어
              </button>
            </div>

            <button
              onClick={startQuiz}
              className="mt-5 w-full rounded-2xl bg-green-500 px-4 py-4 text-base font-bold text-white"
            >
              배열 퀴즈 시작
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!currentQuestion) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
        <header className="mb-4 pt-2">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/hub"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm"
            >
              ← 홈
            </Link>

            <div className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-green-600 shadow-sm">
              {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${currentQuestion.id}-${currentIndex}`}
            initial={{ opacity: 0, x: 60, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 rounded-[28px] border border-green-100 bg-white p-5 shadow-xl"
          >
            <div className="mb-5 text-center">
              <p className="mb-2 text-sm font-medium text-gray-500">
                {currentQuestion.direction === "hanja-to-korean"
                  ? "한문을 보고 한국어 순서를 배열해 주세요"
                  : "한국어를 보고 한문 순서를 배열해 주세요"}
              </p>

              <div className="rounded-[28px] border-2 border-green-100 bg-green-50 px-4 py-8 shadow-inner">
                <p className="text-3xl font-extrabold leading-relaxed text-gray-900">
                  {currentQuestion.promptText}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-600">정답 배열</p>

              <div className="min-h-[88px] rounded-2xl border border-dashed border-gray-300 bg-white p-3">
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {selectedTokens.map((token, index) => (
                      <motion.button
                        layout
                        key={`selected-${index}-${token}`}
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -8 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => moveDown(token, index)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-sm ${tokenStateClass(
                          token,
                          index
                        )}`}
                      >
                        {token}
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-600">보기</p>

              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {availableTokens.map((token, index) => (
                    <motion.button
                      layout
                      key={`available-${index}-${token}`}
                      initial={{ opacity: 0, scale: 0.8, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -8 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => moveUp(token, index)}
                      disabled={checked}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 shadow-sm"
                    >
                      {token}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-5 min-h-[88px] rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
              {!checked && (
                <p className="text-sm leading-6 text-gray-500">
                  보기에서 단어를 눌러 위로 올리고, 위의 단어를 다시 누르면 아래로 돌아옵니다.
                </p>
              )}

              {checked && isCorrect && (
                <div>
                  <p className="text-lg font-bold text-green-600">정답입니다</p>
                  <p className="mt-1 text-sm text-gray-600">
                    다음 문제로 진행해 주세요.
                  </p>
                </div>
              )}

              {checked && isCorrect === false && (
                <div>
                  <p className="text-lg font-bold text-red-500">오답입니다</p>
                  <p className="mt-1 text-sm text-gray-600">
                    빨간 토큰이 틀린 위치입니다.
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        </AnimatePresence>

        <footer className="sticky bottom-0 mt-4 pb-4">
          {!checked ? (
            <button
              onClick={checkAnswer}
              className="w-full rounded-2xl bg-green-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-green-200"
            >
              확인
            </button>
          ) : (
            <button
              onClick={goNext}
              className="w-full rounded-2xl bg-green-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-green-200"
            >
              다음 문제
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}