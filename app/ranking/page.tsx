import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

// 💡 DB 구조에 맞춰 타입을 정확하게 수정했습니다.
type RankingWithUser = {
  id: number;           // string에서 number로 변경
  score: number;
  totalCount: number;
  elapsedSeconds: number;
  userId: number;       // string에서 number로 변경
  user: {
    nickname: string;
  };
};

export default async function RankingPage() {
  // 1. 모든 기록을 가져옵니다.
  const data = await prisma.rankingRecord.findMany({
    orderBy: [
      { elapsedSeconds: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      user: {
        select: {
          nickname: true,
        },
      },
    },
  });

  // 💡 가져온 데이터를 수정한 타입으로 연결합니다.
  const allRankings = data as unknown as RankingWithUser[];

  // 2. 사용자별 최고 기록 필터링 (아이디당 1개)
  const seenUsers = new Set<number>(); // userId가 숫자이므로 number 타입 Set 사용
  const uniqueRankings = allRankings.filter((record) => {
    if (seenUsers.has(record.userId)) {
      return false;
    }
    seenUsers.add(record.userId);
    return true;
  }).slice(0, 50);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 font-bold">1인 1기록 (최고 기록 기준)</p>
            <h1 className="text-3xl font-extrabold text-gray-900 text-black">명예의 전당</h1>
          </div>

          <Link
            href="/hub"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm active:scale-95 transition-all"
          >
            ← 홈으로 이동
          </Link>
        </div>

        <div className="space-y-4">
          {uniqueRankings.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-bold text-gray-900">등록된 랭킹이 없습니다</p>
            </div>
          ) : (
            uniqueRankings.map((r, i) => (
              <div
                key={r.id}
                className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm border-l-4 border-l-green-400"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black ${
                      i === 0 ? 'text-yellow-500' : 
                      i === 1 ? 'text-gray-400' : 
                      i === 2 ? 'text-orange-400' : 'text-gray-300'
                    }`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xl font-black text-black">
                        {r.user.nickname}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Top Record</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-black">
                      {r.score}/{r.totalCount}
                    </p>
                    <p className="text-sm font-bold text-green-600">
                      {r.elapsedSeconds}초
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}