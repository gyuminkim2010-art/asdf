import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

type RankingWithUser = {
  id: number;
  score: number;
  totalCount: number;
  elapsedSeconds: number;
  userId: number;
  user: { nickname: string };
};

const MEDAL = ["🥇", "🥈", "🥉"];

const GLASS = `
  background: rgba(255,255,255,0.038);
  backdrop-filter: blur(48px) saturate(170%);
  -webkit-backdrop-filter: blur(48px) saturate(170%);
  border: 1px solid rgba(255,255,255,0.085);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 24px 64px rgba(0,0,0,0.35);
`;

export default async function RankingPage() {
  const data = await prisma.rankingRecord.findMany({
    orderBy: [{ elapsedSeconds: "asc" }, { createdAt: "asc" }],
    include: { user: { select: { nickname: true } } },
  });

  const allRankings = data as unknown as RankingWithUser[];
  const seenUsers = new Set<number>();
  const uniqueRankings = allRankings
    .filter((r) => {
      if (seenUsers.has(r.userId)) return false;
      seenUsers.add(r.userId);
      return true;
    })
    .slice(0, 50);

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto max-w-3xl px-4 py-28 md:px-6">
        {/* Header */}
        <div className="mb-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/30 mb-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            Project · no NAME
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25 mb-1">1인 1기록 · 최고 기록 기준</p>
              <h1
                className="text-[clamp(36px,6vw,64px)] font-black tracking-[-0.05em] leading-none"
                style={{
                  background: "linear-gradient(175deg, #ffffff 15%, rgba(255,255,255,0.6) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                명예의 전당
              </h1>
            </div>
            <Link
              href="/hub"
              className="shrink-0 rounded-full px-5 py-2.5 text-[12px] font-semibold text-white/45 hover:text-white/75 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              ← 홈
            </Link>
          </div>
        </div>

        {/* Ranking list */}
        {uniqueRankings.length === 0 ? (
          <div
            className="relative overflow-hidden rounded-3xl p-10 text-center"
            style={{ background: "rgba(255,255,255,0.038)", border: "1px solid rgba(255,255,255,0.085)" }}
          >
            <p className="text-3xl mb-3">🌱</p>
            <p className="font-bold text-white/60 text-[15px]">등록된 랭킹이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uniqueRankings.map((r, i) => (
              <div
                key={r.id}
                className="relative overflow-hidden rounded-2xl px-5 py-4 flex items-center gap-4 group hover:scale-[1.01] transition-transform duration-300"
                style={
                  i < 3
                    ? {
                        background: i === 0 ? "rgba(251,191,36,0.08)" : i === 1 ? "rgba(148,163,184,0.08)" : "rgba(251,146,60,0.08)",
                        border: i === 0 ? "1px solid rgba(251,191,36,0.22)" : i === 1 ? "1px solid rgba(148,163,184,0.2)" : "1px solid rgba(251,146,60,0.2)",
                        backdropFilter: "blur(32px)",
                      }
                    : {
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        backdropFilter: "blur(24px)",
                      }
                }
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Rank number */}
                <div className="w-10 text-center shrink-0">
                  {i < 3 ? (
                    <span className="text-xl">{MEDAL[i]}</span>
                  ) : (
                    <span className="text-[15px] font-black text-white/25">{i + 1}</span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-[16px] tracking-[-0.02em] truncate">{r.user.nickname}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/22 mt-0.5">Top Record</p>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <p className="font-black text-white text-[16px]">
                    {r.score}<span className="text-white/25 font-normal text-[13px]">/{r.totalCount}</span>
                  </p>
                  <p className="text-[12px] font-bold text-white/40 mt-0.5">{r.elapsedSeconds}초</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
