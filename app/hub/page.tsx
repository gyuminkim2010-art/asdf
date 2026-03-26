"use client";

import Link from "next/link";
import { useEffect, useState } from "react";


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
  user: {
    nickname: string;
  };
};

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [topRankings, setTopRankings] = useState<RankingItem[]>([]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [meRes, rankingRes] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/ranking?limit=100", { cache: "no-store" }), // 💡 필터링을 위해 limit을 넉넉히 가져옵니다
        ]);

        const meData = await meRes.json();
        const rankingData = await rankingRes.json();

        if (meRes.ok && meData.ok) {
          setCurrentUser(meData.user);
        } else {
          setCurrentUser(null);
        }

        if (rankingRes.ok && rankingData.ok) {
          // 💡 중복 제거 로직 추가
          const rawRankings: RankingItem[] = rankingData.rankings;
          const seenUsers = new Set<string | number>();
          
          const uniqueRankings = rawRankings.filter((item: any) => {
            // userId가 API에서 넘어오는지 확인 (없으면 user.id 등 고유값 활용)
            const identifier = item.userId || item.user?.nickname; 
            if (seenUsers.has(identifier)) return false;
            seenUsers.add(identifier);
            return true;
          }).slice(0, 10); // 중복 제거 후 최종 상위 10개만 선택

          setTopRankings(uniqueRankings);
        } else {
          setTopRankings([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setCurrentUser(null);
    alert("로그아웃되었습니다.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-lime-100 via-green-50 to-white flex items-center justify-center p-6">
      <section className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm border border-green-100">
              <span className="text-2xl">🌱</span>
              <span className="text-sm font-semibold text-green-700">
                반복학습으로 쉽게 배우는
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900">
              대아고등학교
              <br />
              <span className="text-green-600">한자 퀴즈</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              퀴즈, 랭킹, 사용자 통계, 관리자 기능까지 한 곳에서 이용하실 수 있습니다.
            </p>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              {loading ? (
                <p className="text-sm text-gray-500">
                  로그인 상태를 확인하는 중입니다...
                </p>
              ) : currentUser ? (
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">
                    로그인 중: {currentUser.nickname}
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentUser.email} / 권한: {currentUser.role}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">
                    현재 로그인되어 있지 않습니다
                  </p>
                  <p className="text-sm text-gray-500">
                    로그인 후 랭킹 모드와 기록 저장 기능을 이용하실 수 있습니다.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/quiz"
                className="rounded-2xl bg-green-500 px-6 py-4 text-center text-lg font-bold text-white shadow-lg shadow-green-200 transition-colors duration-300"
              >
                퀴즈 시작
              </Link>

              <Link
                href="/phrase-quiz"
                className="rounded-2xl bg-white px-6 py-4 text-center text-lg font-bold text-gray-800 border border-gray-200 shadow-sm"
              >
                논어 / 사자성어 퀴즈
              </Link>

              <Link
                href="/ranking"
                className="rounded-2xl bg-white px-6 py-4 text-center text-lg font-bold text-gray-800 border border-gray-200 shadow-sm transition-colors duration-300"
              >
                랭킹 보기
              </Link>

              <Link
                href="/wrong-note"
                className="rounded-2xl bg-white px-6 py-4 text-center text-lg font-bold text-gray-800 border border-gray-200 shadow-sm"
              >
                오답노트
              </Link>

              {currentUser?.role === "admin" && (
                <Link
                  href="/admin/phrases"
                  className="rounded-2xl bg-white px-6 py-4 text-center text-lg font-bold text-gray-800 border border-gray-200 shadow-sm"
                >
                  논어 / 사자성어 관리
                </Link>
              )}

              {!currentUser && (
                <Link
                  href="/login"
                  className="rounded-2xl bg-white px-6 py-4 text-center text-lg font-bold text-gray-800 border border-gray-200 shadow-sm transition-colors duration-300"
                >
                  로그인 / 회원가입
                </Link>
              )}

              {currentUser?.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-2xl bg-white px-6 py-4 text-center text-lg font-bold text-gray-800 border border-gray-200 shadow-sm transition-colors duration-300"
                >
                  관리자
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">퀴즈 모드</p>
                <p className="font-bold text-gray-800">쉬움 / 보통 / 어려움</p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">랭킹 기능</p>
                <p className="font-bold text-gray-800">로그인 후 기록 저장</p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500">관리 기능</p>
                <p className="font-bold text-gray-800">한자 / 사용자 관리</p>
              </div>
            </div>
          </div>


          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-200 rounded-full blur-2xl opacity-60" />
            <div className="absolute -bottom-6 -right-4 w-32 h-32 bg-green-200 rounded-full blur-3xl opacity-60" />

            <div className="relative rounded-[2rem] bg-white p-6 md:p-8 shadow-2xl border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">실시간 홈 미리보기</p>
                  <h2 className="text-2xl font-bold text-gray-900">랭킹 TOP 10</h2>
                </div>
                <div className="rounded-2xl bg-yellow-100 px-3 py-2 text-yellow-700 font-bold">
                  TOP
                </div>
              </div>

              <div className="space-y-3">
                {topRankings.length === 0 ? (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
                    <p className="font-semibold text-gray-800">
                      아직 등록된 랭킹이 없습니다
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      로그인 후 랭킹 모드를 완료하면 기록이 표시됩니다.
                    </p>
                  </div>
                ) : (
                  topRankings.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-500">{index + 1}위</p>
                          <p className="text-lg font-bold text-gray-900">
                            {item.user.nickname}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {item.score}/{item.totalCount}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.elapsedSeconds}초
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/ranking"
                className="mt-5 flex items-center justify-center rounded-2xl bg-green-500 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                자세히 보기
              </Link>
            </div>
          </div>
      </section>
    </main>
  );
}