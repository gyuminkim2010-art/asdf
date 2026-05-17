"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MeUser = {
  id: number;
  email: string;
  nickname: string;
  role: string;
};

type HanjaItem = {
  id: number;
  character: string;
  meaning: string;
  reading: string;
};

type AdminUser = {
  id: number;
  email: string;
  nickname: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  loginCount: number;
  totalStudySeconds: number;
  totalAnswers: number;
  correctAnswers: number;
};

export default function AdminPage() {
  const [items, setItems] = useState<HanjaItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [character, setCharacter] = useState("");
  const [meaning, setMeaning] = useState("");
  const [reading, setReading] = useState("");
  const [bulkText, setBulkText] = useState("");

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingNickname, setEditingNickname] = useState("");

  const totalUsers = users.length;
  const totalHanja = items.length;

  const averageAccuracy = useMemo(() => {
    if (users.length === 0) return 0;

    const values = users
      .filter((user) => user.totalAnswers > 0)
      .map((user) => (user.correctAnswers / user.totalAnswers) * 100);

    if (values.length === 0) return 0;

    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [users]);

  const formatDateTime = (value: string | null) => {
    if (!value) return "기록 없음";
    return new Date(value).toLocaleString("ko-KR");
  };

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}시간 ${m}분 ${s}초`;
    if (m > 0) return `${m}분 ${s}초`;
    return `${s}초`;
  };

  const getAccuracy = (user: AdminUser) => {
    if (user.totalAnswers === 0) return "0.0%";
    return `${((user.correctAnswers / user.totalAnswers) * 100).toFixed(1)}%`;
  };

  const loadItems = async () => {
    const res = await fetch("/api/hanja", { cache: "no-store" });
    const data = await res.json();

    if (res.ok && data.ok) {
      setItems(data.items);
    }
  };

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();

    if (res.ok && data.ok) {
      setUsers(data.users);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/me", { cache: "no-store" });
        const meData = await meRes.json();

        if (meRes.ok && meData.ok) {
          setCurrentUser(meData.user);
        } else {
          setCurrentUser(null);
        }

        await loadItems();
        await loadUsers();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAdd = async () => {
    if (!character.trim() || !meaning.trim() || !reading.trim()) {
      alert("한자, 뜻, 음을 모두 입력해 주세요.");
      return;
    }

    const res = await fetch("/api/hanja", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        character,
        meaning,
        reading,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "한자 추가 중 오류가 발생했습니다.");
      return;
    }

    setCharacter("");
    setMeaning("");
    setReading("");

    await loadItems();
    alert("한자가 추가되었습니다.");
  };

  const handleBulkAdd = async () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert("추가할 한자 목록을 입력해 주세요.");
      return;
    }

    let success = 0;

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) continue;

      const [characterValue, meaningValue, readingValue] = parts;

      const res = await fetch("/api/hanja", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character: characterValue,
          meaning: meaningValue,
          reading: readingValue,
        }),
      });

      if (res.ok) success++;
    }

    setBulkText("");
    await loadItems();
    alert(`${success}개의 한자가 추가되었습니다.`);
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/hanja/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "한자 삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadItems();
    alert("한자가 삭제되었습니다.");
  };

  const handleReset = async () => {
    const res = await fetch("/api/hanja/reset", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "초기화 중 오류가 발생했습니다.");
      return;
    }

    await loadItems();
    alert("기본 한자 목록으로 초기화되었습니다.");
  };

  const startEditNickname = (user: AdminUser) => {
    setEditingUserId(user.id);
    setEditingNickname(user.nickname);
  };

  const handleSaveNickname = async (id: number) => {
    if (!editingNickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nickname: editingNickname,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "닉네임 변경 중 오류가 발생했습니다.");
      return;
    }

    setEditingUserId(null);
    setEditingNickname("");
    await loadUsers();
    alert("닉네임이 변경되었습니다.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4 flex items-center justify-center">
        <p className="text-gray-600">관리자 정보를 확인하는 중입니다...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-red-100 bg-white p-6 shadow-xl text-center">
            <div className="mb-3 text-5xl">🔒</div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              로그인이 필요합니다
            </h1>
            <p className="mt-2 text-gray-600">
              관리자 페이지는 로그인 후 이용하실 수 있습니다.
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
        </div>
      </main>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-red-100 bg-white p-6 shadow-xl text-center">
            <div className="mb-3 text-5xl">⛔</div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              접근 권한이 없습니다
            </h1>
            <p className="mt-2 text-gray-600">
              이 페이지는 관리자 계정으로만 이용하실 수 있습니다.
            </p>

            <div className="mt-5">
              <Link
                href="/hub"
                className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-bold text-gray-800"
              >
                홈으로 이동
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 pt-2">
          <Link
            href="/hub"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm"
          >
            ← 홈
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/quiz"
              className="rounded-xl bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm"
            >
              퀴즈로 이동
            </Link>

            <Link
              href="/admin/users"
              className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 shadow-sm"
            >
              👥 사용자 관리
            </Link>

            <Link
              href="/admin/stock-sim"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
            >
              📈 모의주식 관리
            </Link>

            <Link
              href="/admin/phrases"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
            >
              논어 / 사자성어 관리
            </Link>

            <Link
              href="/admin/stock"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm"
            >
              주식 퀴즈 관리
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">가입 사용자</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalUsers}명</p>
          </div>
          <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">등록 한자</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{totalHanja}개</p>
          </div>
          <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">평균 정답률</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">
              {averageAccuracy.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">관리자 계정</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{currentUser.nickname}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-xl">
            <div className="mb-5">
              <h1 className="text-3xl font-extrabold text-gray-900">한자 관리</h1>
              <p className="mt-2 text-gray-600">
                한자를 개별 또는 여러 개씩 추가하실 수 있습니다.
              </p>
            </div>

            <div className="space-y-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <input
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="한자 입력 (예: 雨)"
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
              <input
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="뜻 입력 (예: 비)"
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
              <input
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="음 입력 (예: 우)"
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

              <button
                onClick={handleAdd}
                className="w-full rounded-2xl bg-green-500 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-200"
              >
                한자 추가
              </button>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`여러 한자를 한 번에 추가할 수 있습니다.
형식:
山 산 산
水 물 수
火 불 화`}
                className="h-40 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

              <button
                onClick={handleBulkAdd}
                className="w-full rounded-2xl bg-blue-500 px-4 py-4 text-base font-bold text-white shadow-lg"
              >
                여러 한자 추가
              </button>
            </div>

            <div className="mt-4">
              <button
                onClick={handleReset}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800"
              >
                기본 한자 목록으로 초기화
              </button>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">현재 한자 목록</h2>
                <span className="rounded-xl bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                  {items.length}개
                </span>
              </div>

              <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-3xl font-extrabold text-gray-900">
                          {item.character}
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          뜻: {item.meaning}
                        </p>
                        <p className="text-sm text-gray-700">음: {item.reading}</p>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-green-100 bg-white p-5 shadow-xl">
            <div className="mb-5">
              <h1 className="text-3xl font-extrabold text-gray-900">사용자 관리</h1>
              <p className="mt-2 text-gray-600">
                가입한 사용자 목록과 이용 통계를 확인하실 수 있습니다.
              </p>
            </div>

            <div className="max-h-[860px] space-y-4 overflow-y-auto pr-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xl font-extrabold text-gray-900">
                        {user.nickname}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">{user.email}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        권한: {user.role}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-gray-700 border border-gray-200">
                      정답률 {getAccuracy(user)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">마지막 접속</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDateTime(user.lastSeenAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">총 이용시간</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatSeconds(user.totalStudySeconds)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">총 응답 수</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {user.totalAnswers}회
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">정답 / 오답</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {user.correctAnswers} / {user.totalAnswers - user.correctAnswers}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">로그인 횟수</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {user.loginCount}회
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="text-sm text-gray-500">가입일</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-700">
                      닉네임 관리
                    </p>

                    {editingUserId === user.id ? (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                          value={editingNickname}
                          onChange={(e) => setEditingNickname(e.target.value)}
                          className="flex-1 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                          placeholder="새 닉네임을 입력해 주세요"
                        />
                        <button
                          onClick={() => handleSaveNickname(user.id)}
                          className="rounded-2xl bg-green-500 px-4 py-3 font-bold text-white"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => {
                            setEditingUserId(null);
                            setEditingNickname("");
                          }}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-800"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditNickname(user)}
                        className="rounded-2xl bg-blue-500 px-4 py-3 font-bold text-white"
                      >
                        닉네임 변경
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}