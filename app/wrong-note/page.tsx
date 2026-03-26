"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function WrongNotePage() {
  const [notes, setNotes] = useState<WrongNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);

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

  const handleDeleteOne = async (id: number) => {
    const res = await fetch(`/api/wrong-note/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "오답 삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadNotes();
    alert("오답이 삭제되었습니다.");
  };

  const handleDeleteAll = async () => {
    const res = await fetch("/api/wrong-note", {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "오답노트 삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadNotes();
    alert("오답노트가 전체 삭제되었습니다.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">오답노트를 불러오는 중입니다...</p>
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
            오답노트는 로그인 후 이용하실 수 있습니다.
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">로그인 사용자 전용</p>
            <h1 className="text-3xl font-extrabold text-gray-900">오답노트</h1>
          </div>

          <Link
            href="/hub"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm"
          >
            홈으로 이동
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">저장된 오답</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">
              {notes.length}개
            </p>
          </div>

          <Link
            href="/wrong-note/play"
            className={`rounded-3xl p-5 shadow-sm text-center font-bold transition-all duration-300 ${
              notes.length === 0
                ? "pointer-events-none border border-gray-200 bg-gray-100 text-gray-400"
                : "border border-green-100 bg-green-500 text-white"
            }`}
          >
            오답 다시 풀기
          </Link>

          <button
            onClick={handleDeleteAll}
            disabled={notes.length === 0}
            className={`rounded-3xl p-5 shadow-sm text-center font-bold transition-all duration-300 ${
              notes.length === 0
                ? "pointer-events-none border border-gray-200 bg-gray-100 text-gray-400"
                : "border border-red-100 bg-red-500 text-white"
            }`}
          >
            오답 전체 삭제
          </button>
        </div>

        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-bold text-gray-900">
                저장된 오답이 없습니다
              </p>
              <p className="mt-2 text-sm text-gray-500">
                문제를 틀리면 자동으로 이곳에 저장되고, 다시 풀 수 있습니다.
              </p>
            </div>
          ) : (
            notes.map((note, index) => (
              <div
                key={note.id}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{index + 1}번째 오답</p>
                  <p className="text-sm text-gray-400">
                    {new Date(note.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-100 bg-green-50 p-5 text-center">
                  <p className="text-sm text-gray-500 mb-2">{note.questionPrompt}</p>
                  <p className="text-5xl font-extrabold text-gray-900">
                    {note.questionText}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm text-gray-500">선택한 답</p>
                    <p className="mt-1 text-lg font-bold text-red-600">
                      {note.selectedAnswer}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                    <p className="text-sm text-gray-500">정답</p>
                    <p className="mt-1 text-lg font-bold text-green-600">
                      {note.correctAnswer}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                    유형: {note.contentType}
                  </span>

                  <button
                    onClick={() => handleDeleteOne(note.id)}
                    className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600"
                  >
                    이 문제 삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}