"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function shuffleArray<T>(array: T[]) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

export default function WrongNotePlayPage() {
  const [notes, setNotes] = useState<WrongNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);

  const currentNote = notes[currentIndex] ?? null;

  const choices = useMemo(() => {
    if (!currentNote) return [];

    const wrongPool = notes
      .filter((note) => note.id !== currentNote.id)
      .map((note) => note.correctAnswer)
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 3);

    const merged = [currentNote.correctAnswer, ...wrongPool];

    return shuffleArray(merged);
  }, [currentNote, notes]);

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/wrong-note", { cache: "no-store" });
      const data = await res.json();

      if (res.status === 401) {
        setLoginRequired(true);
        setNotes([]);
        return;
      }

      if (res.ok && data.ok) {
        setNotes(data.notes);
      } else {
        setNotes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const isCorrect = useMemo(() => {
    if (!currentNote || !selected) return null;
    return selected === currentNote.correctAnswer;
  }, [currentNote, selected]);

  const handleChoiceClick = (choice: string) => {
    if (!currentNote || showAnswer) return;

    setSelected(choice);
    setShowAnswer(true);
  };

  const handleNext = async () => {
    if (!currentNote || !showAnswer) return;

    if (isCorrect) {
      await fetch(`/api/wrong-note/${currentNote.id}`, {
        method: "DELETE",
      });

      const newNotes = notes.filter((note) => note.id !== currentNote.id);
      setNotes(newNotes);
      setSolvedCount((prev) => prev + 1);

      setSelected(null);
      setShowAnswer(false);

      if (currentIndex >= newNotes.length) {
        setCurrentIndex(0);
      }
      return;
    }

    const nextIndex = currentIndex + 1 < notes.length ? currentIndex + 1 : 0;
    setCurrentIndex(nextIndex);
    setSelected(null);
    setShowAnswer(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">오답 문제를 불러오는 중입니다...</p>
      </main>
    );
  }

  if (loginRequired) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6">
        <div className="mx-auto max-w-md rounded-[28px] border border-red-100 bg-white p-6 text-center shadow-xl">
          <div className="mb-3 text-5xl">🔒</div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            로그인이 필요합니다
          </h1>
          <p className="mt-2 text-gray-600">
            오답노트 복습은 로그인 후 이용하실 수 있습니다.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-2xl bg-green-500 px-4 py-4 text-base font-bold text-white"
            >
              로그인하기
            </Link>
            <Link
              href="/hub"
              className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-bold text-gray-800"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (notes.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6">
        <div className="mx-auto max-w-md rounded-[28px] border border-green-100 bg-white p-6 text-center shadow-xl">
          <div className="mb-3 text-5xl">✅</div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            복습할 오답이 없습니다
          </h1>
          <p className="mt-2 text-gray-600">
            현재 저장된 오답 문제가 없거나 모두 복습이 완료되었습니다.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              href="/wrong-note"
              className="flex w-full items-center justify-center rounded-2xl bg-green-500 px-4 py-4 text-base font-bold text-white"
            >
              오답노트로 이동
            </Link>
            <Link
              href="/quiz"
              className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-bold text-gray-800"
            >
              퀴즈 시작
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="mb-4 pt-2">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/wrong-note"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm"
            >
              ← 오답노트
            </Link>

            <div className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-green-600 shadow-sm">
              복습 완료 {solvedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold text-gray-700">
                {currentIndex + 1} / {notes.length}
              </p>
              <p className="text-gray-500">오답 복습 모드</p>
            </div>
          </div>
        </header>

        <section className="flex-1 rounded-[28px] border border-green-100 bg-white p-5 shadow-xl">
          <div className="mb-5 text-center">
            <p className="mb-2 text-sm font-medium text-gray-500">
              {currentNote?.questionPrompt}
            </p>
            <div className="rounded-[28px] border-2 border-green-100 bg-green-50 px-4 py-10 shadow-inner">
              <p className="text-7xl font-extrabold text-gray-900">
                {currentNote?.questionText}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {choices.map((choice) => {
              const isSelected = selected === choice;
              const isAnswer = currentNote?.correctAnswer === choice;

              let buttonClass =
                "w-full rounded-2xl border px-4 py-4 text-left text-lg font-bold shadow-sm transition-all duration-300 active:scale-[0.98] ";

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

          <div className="mt-5 min-h-[88px] rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
            {!showAnswer && (
              <p className="text-sm leading-6 text-gray-500">
                아래 보기 중 정답을 선택해 주세요.
              </p>
            )}

            {showAnswer && isCorrect && (
              <div>
                <p className="text-lg font-bold text-green-600">정답입니다</p>
                <p className="mt-1 text-sm text-gray-600">
                  이 문제는 오답노트에서 제거됩니다.
                </p>
              </div>
            )}

            {showAnswer && isCorrect === false && (
              <div>
                <p className="text-lg font-bold text-red-500">오답입니다</p>
                <p className="mt-1 text-sm text-gray-600">
                  정답은{" "}
                  <span className="font-semibold text-green-600">
                    {currentNote?.correctAnswer}
                  </span>
                  입니다.
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="sticky bottom-0 mt-4 pb-4">
          <button
            onClick={handleNext}
            disabled={!showAnswer}
            className={`w-full rounded-2xl px-5 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] ${
              showAnswer
                ? "bg-green-500 shadow-green-200"
                : "bg-gray-300 shadow-none"
            }`}
          >
            {isCorrect ? "다음 오답으로 이동" : "다음 문제"}
          </button>
        </footer>
      </div>
    </main>
  );
}