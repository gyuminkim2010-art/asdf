"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type HanjaItem = {
  id: number;
  character: string;
  meaning: string;
  reading: string;
};

type GameMode = "basic" | "ranking";
type Difficulty = "easy" | "normal" | "hard";
type ScreenMode = "menu" | "play" | "result";

type Question = {
  id: number;
  character: string;
  prompt: string;
  answer: string;
  choices: string[];
  difficulty: Difficulty;
};

function shuffleArray<T>(array: T[]) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function getRandomItem<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function makeEasyChoices(correctItem: HanjaItem, allItems: HanjaItem[]) {
  const wrongPool = allItems
    .filter((item) => item.id !== correctItem.id)
    .map((item) => item.reading);

  const uniqueWrongPool = Array.from(new Set(wrongPool));
  const wrongChoices = shuffleArray(uniqueWrongPool).slice(0, 3);

  return shuffleArray([correctItem.reading, ...wrongChoices]);
}

function makeNormalChoices(correctItem: HanjaItem, allItems: HanjaItem[]) {
  const correctCombo = `${correctItem.meaning} ${correctItem.reading}`;

  const wrongPool = allItems
    .filter((item) => item.id !== correctItem.id)
    .map((item) => `${item.meaning} ${item.reading}`);

  const uniqueWrongPool = Array.from(new Set(wrongPool));
  const wrongChoices = shuffleArray(uniqueWrongPool).slice(0, 3);

  return shuffleArray([correctCombo, ...wrongChoices]);
}

function makeHardChoices(correctItem: HanjaItem, allItems: HanjaItem[]) {
  const choices = new Set<string>();
  choices.add(`${correctItem.meaning} ${correctItem.reading}`);

  while (choices.size < 4) {
    const meaningSource = getRandomItem(allItems);
    const readingSource = getRandomItem(allItems);
    const mixed = `${meaningSource.meaning} ${readingSource.reading}`;
    choices.add(mixed);
  }

  return shuffleArray(Array.from(choices));
}

function makeQuestion(
  item: HanjaItem,
  allItems: HanjaItem[],
  difficulty: Difficulty
): Question {
  if (difficulty === "easy") {
    return {
      id: item.id,
      character: item.character,
      prompt: "이 한자의 음은 무엇인가요?",
      answer: item.reading,
      choices: makeEasyChoices(item, allItems),
      difficulty,
    };
  }

  if (difficulty === "normal") {
    return {
      id: item.id,
      character: item.character,
      prompt: "이 한자에 맞는 뜻+음을 골라주세요",
      answer: `${item.meaning} ${item.reading}`,
      choices: makeNormalChoices(item, allItems),
      difficulty,
    };
  }

  return {
    id: item.id,
    character: item.character,
    prompt: "이 한자에 맞는 뜻+음을 골라주세요",
    answer: `${item.meaning} ${item.reading}`,
    choices: makeHardChoices(item, allItems),
    difficulty,
  };
}

function makeRankingQuestions(count: number, allItems: HanjaItem[]) {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const item = getRandomItem(allItems);
    const difficulty: Difficulty = Math.random() < 0.5 ? "normal" : "hard";
    questions.push(makeQuestion(item, allItems, difficulty));
  }

  return questions;
}

export default function QuizPage() {
  const [hanjaItems, setHanjaItems] = useState<HanjaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [screen, setScreen] = useState<ScreenMode>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("basic");
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    nickname: string;
    role: string;
  } | null>(null);

  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>("easy");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const [score, setScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wrongPenaltySeconds, setWrongPenaltySeconds] = useState(0);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [hanjaRes, meRes] = await Promise.all([
          fetch("/api/hanja", { cache: "no-store" }),
          fetch("/api/me", { cache: "no-store" }),
        ]);

        const hanjaData = await hanjaRes.json();
        const meData = await meRes.json();

        if (hanjaRes.ok && hanjaData.ok) {
          setHanjaItems(hanjaData.items);
        } else {
          setHanjaItems([]);
          setLoadError(hanjaData.message || "한자 데이터를 불러오지 못했습니다.");
        }

        if (meRes.ok && meData.ok) {
          setCurrentUser(meData.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setHanjaItems([]);
        setCurrentUser(null);
        setLoadError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const currentQuestion =
    screen === "play" && questions[currentIndex] ? questions[currentIndex] : null;

  const isLastRankingQuestion =
    gameMode === "ranking" && currentIndex === questions.length - 1;

  const isCorrect = useMemo(() => {
    if (!currentQuestion || !selected) return null;
    return selected === currentQuestion.answer;
  }, [currentQuestion, selected]);

  useEffect(() => {
    if (screen !== "play" || gameMode !== "ranking") return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, gameMode]);

  useEffect(() => {
    if (wrongPenaltySeconds <= 0) return;

    const timer = setInterval(() => {
      setWrongPenaltySeconds((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [wrongPenaltySeconds]);

  const startBasicMode = (difficulty: Difficulty) => {
    if (hanjaItems.length < 4) {
      alert("한자가 최소 4개는 있어야 퀴즈를 만들 수 있습니다.");
      return;
    }

    const firstItem = getRandomItem(hanjaItems);
    setGameMode("basic");
    setSelectedDifficulty(difficulty);
    setQuestions([makeQuestion(firstItem, hanjaItems, difficulty)]);
    setCurrentIndex(0);
    setSelected(null);
    setShowAnswer(false);
    setScore(0);
    setElapsedSeconds(0);
    setWrongPenaltySeconds(0);
    setScreen("play");
  };

  const startRankingMode = () => {
    if (!currentUser) {
      alert("랭킹 모드는 로그인 후 이용하실 수 있습니다.");
      return;
    }

    if (hanjaItems.length < 4) {
      alert("퀴즈를 시작하려면 한자 데이터가 4개 이상 필요합니다.");
      return;
    }

    setGameMode("ranking");
    setQuestions(makeRankingQuestions(30, hanjaItems));
    setCurrentIndex(0);
    setSelected(null);
    setShowAnswer(false);
    setScore(0);
    setElapsedSeconds(0);
    setWrongPenaltySeconds(0);
    setScreen("play");
  };

  const handleChoiceClick = async (choice: string) => {
    if (!currentQuestion || showAnswer) return;

    setSelected(choice);
    setShowAnswer(true);

    const correct = choice === currentQuestion.answer;

    fetch("/api/stats/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ correct }),
    }).catch(() => {});

    if (!correct) {
      fetch("/api/wrong-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: "hanja",
          contentId: currentQuestion.id,
          questionText: currentQuestion.character,
          questionPrompt: currentQuestion.prompt,
          correctAnswer: currentQuestion.answer,
          selectedAnswer: choice,
        }),
      }).catch(() => {});
    }

    if (correct) {
      setScore((prev) => prev + 1);
    } else if (gameMode === "ranking") {
      setWrongPenaltySeconds(5);
    }
  };

  const goToNextBasicQuestion = () => {
    const nextItem = getRandomItem(hanjaItems);
    setQuestions([makeQuestion(nextItem, hanjaItems, selectedDifficulty)]);
    setCurrentIndex(0);
    setSelected(null);
    setShowAnswer(false);
  };

  const handleNext = async () => {
    if (!showAnswer || !currentQuestion) return;

    if (gameMode === "ranking" && isCorrect === false && wrongPenaltySeconds > 0) {
      return;
    }

    if (gameMode === "basic") {
      goToNextBasicQuestion();
      return;
    }

    if (isLastRankingQuestion) {

      await fetch("/api/ranking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: score,
          totalCount: questions.length,
          elapsedSeconds: elapsedSeconds
        })
      });

  setScreen("result");
  return;
}
    setCurrentIndex((prev) => prev + 1);
    setSelected(null);
    setShowAnswer(false);
    setWrongPenaltySeconds(0);
  };

  const handleBackToMenu = () => {
    setScreen("menu");
    setSelected(null);
    setShowAnswer(false);
    setWrongPenaltySeconds(0);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <p className="text-gray-600">한자 데이터를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">{loadError}</p>
          <p className="mt-2 text-sm text-gray-500">
            잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </main>
    );
  }

  if (hanjaItems.length < 4) {
    return (
      <main className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 font-semibold">
            퀴즈를 시작하려면 한자 데이터가 4개 이상 필요합니다.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            관리자 페이지에서 한자를 추가하거나 기본 목록으로 초기화해 주세요.
          </p>
        </div>
      </main>
    );
}
  if (screen === "menu") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-green-100 bg-white p-6 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mb-3 text-5xl">📘</div>
              <h1 className="text-3xl font-extrabold text-gray-900">한자 퀴즈</h1>
              <p className="mt-2 text-gray-500">모드와 난이도를 선택해 주세요.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => startBasicMode("easy")}
                className="w-full rounded-2xl bg-green-500 px-5 py-4 text-left text-white shadow-lg shadow-green-200 active:scale-[0.98]"
              >
                <p className="text-lg font-bold">쉬움</p>
                <p className="mt-1 text-sm text-green-50">
                  음만 맞추기
                </p>
              </button>

              <button
                onClick={() => startBasicMode("normal")}
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left text-gray-900 shadow-sm active:scale-[0.98]"
              >
                <p className="text-lg font-bold">보통</p>
                <p className="mt-1 text-sm text-gray-500">
                  나무 목 같은 정확한 뜻+음 조합
                </p>
              </button>

              <button
                onClick={() => startBasicMode("hard")}
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left text-gray-900 shadow-sm active:scale-[0.98]"
              >
                <p className="text-lg font-bold">어려움</p>
                <p className="mt-1 text-sm text-gray-500">
                  나무 금 같은 혼합 오답 포함
                </p>
              </button>

              <button
                onClick={startRankingMode}
                className="w-full rounded-2xl bg-yellow-400 px-5 py-4 text-left text-gray-900 shadow-lg active:scale-[0.98]"
              >
                <p className="text-lg font-bold">랭킹 모드</p>
                <p className="mt-1 text-sm text-gray-700">
                  30문제 · 보통/어려움 섞기 · 오답 5초 패널티 · 로그인 필요
                </p>
              </button>

              <Link
                href="/hub"
                className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-base font-bold text-gray-800"
              >
                홈으로 가기
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "result") {
    const totalCount = questions.length;
    const wrongCount = totalCount - score;

    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-lime-50 p-4">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-green-100 bg-white p-6 shadow-xl">
            <div className="mb-5 text-center">
              <div className="mb-3 text-5xl">🏆</div>
              <h1 className="text-3xl font-extrabold text-gray-900">랭킹 모드 종료</h1>
              <p className="mt-2 text-gray-500">기록을 확인해보세요.</p>
            </div>

            <div className="mb-4 rounded-3xl bg-green-50 p-5 text-center">
              <p className="text-sm text-gray-500">맞힌 개수</p>
              <p className="mt-2 text-5xl font-extrabold text-green-600">
                {score} / {questions.length}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">걸린 시간</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {elapsedSeconds}초
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">오답</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{wrongCount}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={startRankingMode}
                className="w-full rounded-2xl bg-green-500 px-5 py-4 text-base font-bold text-white shadow-lg shadow-green-200"
              >
                랭킹 모드 다시하기
              </button>

              <button
                onClick={handleBackToMenu}
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-base font-bold text-gray-800"
              >
                모드 선택으로
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!currentQuestion) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="mb-4 pt-2">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handleBackToMenu}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm"
            >
              ← 모드 선택
            </button>

            <div className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-green-600 shadow-sm">
              점수 {score}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-gray-700">
                {gameMode === "ranking"
                  ? `${currentIndex + 1} / ${questions.length}`
                  : selectedDifficulty === "easy"
                  ? "쉬움"
                  : selectedDifficulty === "normal"
                  ? "보통"
                  : "어려움"}
              </p>

              <p className="text-gray-500">
                {gameMode === "ranking" ? `${elapsedSeconds}초` : "무한 연습"}
              </p>
            </div>
          </div>
        </header>

        <section className="flex-1 rounded-[28px] border border-green-100 bg-white p-5 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentQuestion.id}-${currentIndex}`}
              initial={{ opacity: 0, x: 90, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -90, scale: 0.96 }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="mb-5 text-center">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  {currentQuestion.prompt}
                </p>
                <div className="rounded-[28px] border-2 border-green-100 bg-green-50 px-4 py-10 shadow-inner">
                  <p className="text-7xl font-extrabold text-gray-900">
                    {currentQuestion.character}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {currentQuestion.choices.map((choice) => {
                  const isSelected = selected === choice;
                  const isAnswer = currentQuestion.answer === choice;

                  let buttonClass =
                    "w-full rounded-2xl border px-4 py-4 text-left text-lg font-bold shadow-sm transition-all duration-500 active:scale-[0.98] ";

                  if (!showAnswer) {
                    buttonClass += "border-gray-200 bg-white text-gray-800";
                  } else if (isAnswer) {
                    buttonClass += "border-green-400 bg-green-100 text-green-700";
                  } else if (isSelected && !isAnswer) {
                    buttonClass += "border-red-300 bg-red-100 text-red-600";
                  } else {
                    buttonClass += "border-gray-200 bg-gray-50 text-gray-400";
                  }

                  return (
                    <button
                      key={choice}
                      onClick={() => handleChoiceClick(choice)}
                      disabled={showAnswer}
                      className={buttonClass}
                    >
                      <div className="flex items-center justify-between">
                        <span>{choice}</span>
                        {showAnswer && isAnswer && <span>✅</span>}
                        {showAnswer && isSelected && !isAnswer && <span>❌</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 min-h-[88px] rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
            {!showAnswer && (
              <p className="text-sm leading-6 text-gray-500">
                아래 보기 중 정답을 선택해  주세요.
              </p>
            )}

            {showAnswer && isCorrect && (
              <div>
                <p className="text-lg font-bold text-green-600">정답!</p>
                <p className="mt-1 text-sm text-gray-600">
                  정답은{" "}
                  <span className="font-semibold text-green-600">
                    {currentQuestion.answer}
                  </span>
                  입니다.
                </p>
              </div>
            )}

            {showAnswer && isCorrect === false && (
              <div>
                <p className="text-lg font-bold text-red-500">오답!</p>
                <p className="mt-1 text-sm text-gray-600">
                  정답은{" "}
                  <span className="font-semibold text-green-600">
                    {currentQuestion.answer}
                  </span>
                  입니다.
                </p>

                {gameMode === "ranking" && wrongPenaltySeconds > 0 && (
                  <p className="mt-2 text-sm font-semibold text-red-500">
                    패널티: {wrongPenaltySeconds}초 후 다음 문제로 이동 가능
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="sticky bottom-0 mt-4 pb-4">
          <button
            onClick={handleNext}
            disabled={
              !showAnswer ||
              (gameMode === "ranking" &&
                isCorrect === false &&
                wrongPenaltySeconds > 0)
            }
            className={`w-full rounded-2xl px-5 py-4 text-base font-bold text-white shadow-lg transition-all duration-500 active:scale-[0.98] ${
              !showAnswer ||
              (gameMode === "ranking" &&
                isCorrect === false &&
                wrongPenaltySeconds > 0)
                ? "bg-gray-300 shadow-none"
                : "bg-green-500 shadow-green-200"
            }`}
          >
            {gameMode === "ranking"
              ? isLastRankingQuestion
                ? "결과 보기"
                : "다음 문제"
              : "다음 문제"}
          </button>
        </footer>
      </div>
    </main>
  );
}