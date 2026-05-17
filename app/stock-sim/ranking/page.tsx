"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ══════════════════════════════════════════
   타입
══════════════════════════════════════════ */
type Holding  = { id: number; ticker: string; name: string; market: string; quantity: number; avgPrice: number };
type Portfolio = { id: number; cash: number; holdings: Holding[] };
type Trade    = { id: number; ticker: string; name: string; market: string; type: "BUY"|"SELL"; quantity: number; price: number; total: number; createdAt: string };
type RankUser = { id: number; nickname: string; tradeCount: number; stockPortfolio: Portfolio | null; stockTrades: Trade[] };
type PriceInfo = { ticker: string; name: string; price: number; change: number; changePercent: number; currency: string };
type Me        = { id: number; nickname: string; role: string };
type DetailTab = "overview" | "holdings" | "trades";

/* ══════════════════════════════════════════
   유틸
══════════════════════════════════════════ */
const KRW_FB = 1380;
const INITIAL = 2_000_000;

function fmtKRW(n: number) {
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + "억원";
  if (Math.abs(n) >= 1e4) return Math.round(n / 1e4).toLocaleString("ko-KR") + "만원";
  return n.toLocaleString("ko-KR") + "원";
}
function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function toKRW(price: number, currency: string, rate: number) {
  return currency === "KRW" ? price : price * rate;
}
function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " " +
         d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

const MEDALS = ["🥇", "🥈", "🥉"];

/* ══════════════════════════════════════════
   배경 블롭
══════════════════════════════════════════ */
function BgBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#d9e2db] blur-3xl opacity-50" />
      <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-[#dfdde8] blur-3xl opacity-50" />
      <div className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full bg-[#ece4d8] blur-3xl opacity-40" />
    </div>
  );
}

/* ══════════════════════════════════════════
   메인
══════════════════════════════════════════ */
export default function RankingPage() {
  const [me,          setMe]        = useState<Me | null | "loading">("loading");
  const [users,       setUsers]     = useState<RankUser[]>([]);
  const [prices,      setPrices]    = useState<Record<string, PriceInfo>>({});
  const [exRate,      setExRate]    = useState(KRW_FB);
  const [selected,    setSelected]  = useState<RankUser | null>(null);
  const [detailTab,   setDetailTab] = useState<DetailTab>("overview");
  const [loading,     setLoading]   = useState(true);
  const [priceLoad,   setPriceLoad] = useState(false);
  const [refreshing,  setRefreshing]= useState(false);

  /* 세션 */
  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => setMe(d.ok ? d.user : null));
  }, []);

  /* 환율 */
  useEffect(() => {
    fetch("/api/stock-price?tickers=KRW%3DX")
      .then(r => r.json())
      .then(d => { if (d.ok && d.items?.[0]) setExRate(d.items[0].price); });
  }, []);

  /* 가격 배치 fetch */
  const fetchPrices = useCallback(async (tickers: string[]) => {
    if (!tickers.length) return;
    const all: Record<string, PriceInfo> = {};
    for (let i = 0; i < tickers.length; i += 10) {
      const chunk = tickers.slice(i, i + 10);
      const res = await fetch(`/api/stock-price?tickers=${chunk.join(",")}`);
      const d = await res.json();
      if (d.ok) for (const it of d.items) all[it.ticker] = it;
    }
    setPrices(prev => ({ ...prev, ...all }));
  }, []);

  /* 랭킹 + 가격 로드 */
  const load = useCallback(async () => {
    const d = await fetch("/api/stock-sim/ranking").then(r => r.json());
    if (!d.ok) return;
    setUsers(d.users);
    const tickerSet = new Set<string>();
    for (const u of d.users as RankUser[])
      for (const h of u.stockPortfolio?.holdings ?? []) tickerSet.add(h.ticker);
    if (tickerSet.size) {
      setPriceLoad(true);
      await fetchPrices([...tickerSet]);
      setPriceLoad(false);
    }
  }, [fetchPrices]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  /* 총자산 계산 */
  const calcAsset = useCallback((user: RankUser): number => {
    if (!user.stockPortfolio) return 0;
    const holdKRW = user.stockPortfolio.holdings.reduce((s, h) => {
      const p = prices[h.ticker];
      const cur = p?.currency ?? (h.market === "KR" ? "KRW" : "USD");
      return s + toKRW(p?.price ?? h.avgPrice, cur, exRate) * h.quantity;
    }, 0);
    return user.stockPortfolio.cash + holdKRW;
  }, [prices, exRate]);

  /* 랭킹 정렬 */
  const ranked = useMemo(() =>
    [...users]
      .filter(u => u.stockPortfolio != null)
      .map(u => ({ ...u, total: calcAsset(u) }))
      .sort((a, b) => b.total - a.total),
    [users, calcAsset]
  );

  /* 선택 유저 분석 — 훅은 항상 early return 앞에 위치해야 함 */
  const selAnalysis = useMemo(() => {
    if (!selected?.stockPortfolio) return null;
    const holdings = selected.stockPortfolio.holdings;
    const trades   = selected.stockTrades ?? [];

    // 종목별 P&L
    const holdingStats = holdings.map(h => {
      const p   = prices[h.ticker];
      const cur = p?.currency ?? (h.market === "KR" ? "KRW" : "USD");
      const currKRW = toKRW(p?.price ?? h.avgPrice, cur, exRate);
      const avgKRW  = toKRW(h.avgPrice, cur, exRate);
      const evalKRW = Math.round(currKRW * h.quantity);
      const costKRW = Math.round(avgKRW  * h.quantity);
      return { ...h, cur, currKRW, avgKRW, evalKRW, costKRW, ret: evalKRW - costKRW, retPct: costKRW ? ((evalKRW - costKRW) / costKRW) * 100 : 0 };
    }).sort((a, b) => b.evalKRW - a.evalKRW);

    // 거래 통계
    const buyCount  = trades.filter(t => t.type === "BUY").length;
    const sellCount = trades.filter(t => t.type === "SELL").length;
    const buyAmt    = trades.filter(t => t.type === "BUY") .reduce((s, t) => s + toKRW(t.total, t.market === "KR" ? "KRW" : "USD", exRate), 0);
    const sellAmt   = trades.filter(t => t.type === "SELL").reduce((s, t) => s + toKRW(t.total, t.market === "KR" ? "KRW" : "USD", exRate), 0);

    // 실현 손익 (매도 내역 기반)
    const realizedPnL = trades.filter(t => t.type === "SELL").reduce((s, t) => {
      const h = holdings.find(hh => hh.ticker === t.ticker);
      if (!h) return s;
      const cur2 = t.market === "KR" ? "KRW" : "USD";
      return s + (toKRW(t.price, cur2, exRate) - toKRW(h.avgPrice, cur2, exRate)) * t.quantity;
    }, 0);

    // 가장 많이 거래한 종목
    const tradeMap: Record<string, { name: string; count: number }> = {};
    for (const t of trades) {
      if (!tradeMap[t.ticker]) tradeMap[t.ticker] = { name: t.name, count: 0 };
      tradeMap[t.ticker].count++;
    }
    const topStock = Object.entries(tradeMap).sort((a, b) => b[1].count - a[1].count)[0];

    return { holdingStats, buyCount, sellCount, buyAmt, sellAmt, realizedPnL, topStock };
  }, [selected, prices, exRate]);

  /* ── 로딩 ── */
  if (me === "loading" || loading) return (
    <main className="min-h-screen bg-[#ecebe6] flex items-center justify-center">
      <BgBlobs />
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-3xl border border-black/5 bg-white/62 backdrop-blur flex items-center justify-center text-3xl animate-pulse">🏆</div>
        <p className="text-[#888] text-sm">랭킹 불러오는 중...</p>
      </div>
    </main>
  );

  if (!me) return (
    <main className="min-h-screen bg-[#ecebe6] flex items-center justify-center p-4">
      <BgBlobs />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <p className="text-5xl">🏆</p>
        <p className="text-2xl font-black text-[#171717]">모의주식 랭킹</p>
        <p className="text-sm text-[#888]">로그인 후 확인할 수 있습니다</p>
        <Link href="/login" className="block rounded-2xl bg-[#171717] px-6 py-3 text-white font-bold hover:bg-[#333] transition-colors">로그인하기 →</Link>
        <Link href="/hub" className="block text-sm text-[#888]">← 홈으로</Link>
      </motion.div>
    </main>
  );

  /* 선택된 유저 계산 (me 확정된 이후에 사용) */
  const selIdx    = selected ? ranked.findIndex(u => u.id === selected.id) : -1;
  const selRank   = selIdx + 1;
  const selTotal  = selected ? calcAsset(selected) : 0;
  const selReturn = selTotal - INITIAL;
  const selRetPct = (selReturn / INITIAL) * 100;
  const selHoldKRW = selected ? selTotal - (selected.stockPortfolio?.cash ?? 0) : 0;

  /* 내 순위 */
  const myIdx   = ranked.findIndex(u => u.id === me.id);
  const myEntry = myIdx >= 0 ? ranked[myIdx] : null;

  return (
    <main className="min-h-screen bg-[#ecebe6]">
      <BgBlobs />

      {/* ─── 네비 ─── */}
      <nav className="relative sticky top-0 z-30 bg-[#ecebe6]/80 backdrop-blur border-b border-black/5 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/stock-sim" className="rounded-xl border border-black/8 bg-white/60 px-3 py-1.5 text-sm font-semibold text-[#4d4d4d] hover:bg-white/80 transition-colors">← 모의주식</Link>
            <span className="font-black text-[#171717] hidden sm:inline">🏆 자산 랭킹</span>
          </div>
          <div className="flex items-center gap-2">
            {priceLoad && <span className="text-[10px] text-[#bbb] hidden sm:inline">가격 갱신중...</span>}
            <button onClick={handleRefresh} disabled={refreshing}
              className="rounded-xl border border-black/8 bg-white/60 px-3 py-1.5 text-xs font-bold text-[#4d4d4d] hover:bg-white/80 transition-colors disabled:opacity-40">
              {refreshing ? "⟳ 갱신중..." : "⟳ 새로고침"}
            </button>
            {me.role === "admin" && (
              <Link href="/admin/stock-sim" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors">🔧 관리자</Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── 본문 ─── */}
      <div className="relative max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* 타이틀 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-1 pt-2 pb-2">
          <p className="text-5xl">🏆</p>
          <p className="text-2xl font-black text-[#171717]">자산 랭킹</p>
          <p className="text-sm text-[#999]">시작 자금 200만원 기준 · 실시간 주가 반영</p>
          <p className="text-xs text-[#bbb]">참가자 {ranked.length}명</p>
        </motion.div>

        {/* 내 순위 카드 */}
        {myEntry && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button onClick={() => { setSelected(myEntry); setDetailTab("overview"); }}
              className="w-full rounded-[24px] border border-black/5 bg-white/62 p-3 backdrop-blur shadow-md hover:shadow-lg transition-all text-left">
              <div className="rounded-[18px] bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-black text-sm shadow-sm">
                      {myIdx < 3 ? MEDALS[myIdx] : myIdx + 1}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">내 순위</p>
                      <p className="text-sm font-black text-[#171717]">{myEntry.nickname}</p>
                      <p className="text-[10px] text-[#aaa]">거래 {myEntry.tradeCount}회 · {myEntry.stockPortfolio?.holdings.length ?? 0}종목</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#171717]">{fmtKRW(Math.round(myEntry.total))}</p>
                    {(() => { const r = myEntry.total - INITIAL; const rp = (r / INITIAL) * 100;
                      return <p className={`text-xs font-black ${r >= 0 ? "text-red-500" : "text-blue-500"}`}>{r >= 0 ? "▲" : "▼"} {Math.abs(rp).toFixed(2)}%</p>;
                    })()}
                    <p className="text-[10px] text-violet-400 font-semibold mt-0.5">클릭해서 상세보기 →</p>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* TOP 3 포디엄 */}
        {ranked.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-2 items-end">
            {([ranked[1], ranked[0], ranked[2]] as typeof ranked).map((u, podiumIdx) => {
              const actualRank = [2, 1, 3][podiumIdx];
              const ret = u.total - INITIAL;
              const heights = ["pt-6", "pt-0", "pt-10"];
              const colors  = ["from-gray-100 to-gray-50 border-gray-200", "from-yellow-100 to-amber-50 border-yellow-200", "from-orange-100 to-orange-50 border-orange-200"];
              return (
                <button key={u.id} onClick={() => { setSelected(u); setDetailTab("overview"); }}
                  className={`${heights[podiumIdx]} flex flex-col items-center`}>
                  <div className={`w-full rounded-[20px] border bg-gradient-to-b ${colors[podiumIdx]} p-3 text-center hover:scale-[1.03] transition-transform shadow-sm`}>
                    <p className="text-2xl">{MEDALS[actualRank - 1]}</p>
                    <p className="text-xs font-black text-[#171717] mt-1 truncate">{u.nickname}</p>
                    <p className="text-[10px] font-bold text-[#555] mt-0.5">{fmtKRW(Math.round(u.total))}</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${ret >= 0 ? "text-red-500" : "text-blue-500"}`}>
                      {ret >= 0 ? "▲" : "▼"} {Math.abs((ret / INITIAL) * 100).toFixed(2)}%
                    </p>
                    {u.id === me.id && <span className="text-[9px] font-bold bg-violet-100 text-violet-500 px-1.5 py-0.5 rounded-full mt-1 inline-block">나</span>}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* 전체 랭킹 */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="rounded-[24px] border border-black/5 bg-white/62 p-3 backdrop-blur shadow-md">
            <div className="rounded-[18px] border border-black/5 bg-[#f6f5f1] p-3 space-y-2">
              <p className="text-xs font-bold text-[#aaa] px-1 pb-1">전체 순위</p>
              {ranked.length === 0 && <p className="text-center py-10 text-sm text-[#bbb]">아직 참가자가 없습니다</p>}
              {ranked.map((u, i) => {
                const ret  = u.total - INITIAL;
                const rp   = (ret / INITIAL) * 100;
                const isMe = u.id === me.id;
                const isUp = ret >= 0;
                return (
                  <motion.button key={u.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * Math.min(i, 12) }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelected(u); setDetailTab("overview"); }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all hover:shadow-sm ${isMe ? "border-violet-200 bg-violet-50/70 hover:bg-violet-50" : "border-black/5 bg-white/80 hover:bg-white"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        i === 0 ? "bg-yellow-100 text-yellow-600" : i === 1 ? "bg-gray-100 text-gray-500" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-black/5 text-[#888]"
                      }`}>
                        {i < 3 ? MEDALS[i] : <span className="text-[11px]">{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-[#171717] truncate">{u.nickname}</p>
                          {isMe && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-500 shrink-0">나</span>}
                        </div>
                        <p className="text-[10px] text-[#aaa] mt-0.5">거래 {u.tradeCount}회 · 보유 {u.stockPortfolio?.holdings.length ?? 0}종목</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-[#171717]">{fmtKRW(Math.round(u.total))}</p>
                        <p className={`text-xs font-bold ${isUp ? "text-red-500" : "text-blue-500"}`}>{isUp ? "▲" : "▼"} {Math.abs(rp).toFixed(2)}%</p>
                        <p className={`text-[10px] ${isUp ? "text-red-300" : "text-blue-300"}`}>{isUp ? "+" : ""}{fmtKRW(Math.round(ret))}</p>
                      </div>
                      <span className="text-[#ccc] shrink-0">›</span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-black/5 overflow-hidden">
                      <div className={`h-full rounded-full ${isUp ? "bg-red-400" : "bg-blue-400"}`} style={{ width: `${Math.min(100, Math.abs(rp) * 3)}%` }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-[#ccc] pb-4">* 보유 종목의 현재가 기준 계산. 실제 수익과 다를 수 있습니다.</p>
      </div>

      {/* ══════ 상세 모달 ══════ */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full sm:max-w-xl rounded-t-[32px] sm:rounded-[28px] bg-[#f0efe9] border border-black/5 shadow-2xl flex flex-col"
              style={{ maxHeight: "92dvh" }}>

              {/* 핸들 */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0"><div className="w-10 h-1 rounded-full bg-black/15" /></div>

              {/* 고정 헤더 */}
              <div className="px-5 pt-3 pb-0 shrink-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${selRank === 1 ? "bg-yellow-100" : selRank === 2 ? "bg-gray-100" : selRank === 3 ? "bg-orange-100" : "bg-black/5"}`}>
                      {selRank <= 3 ? MEDALS[selRank - 1] : selRank}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xl font-black text-[#171717]">{selected.nickname}</p>
                        {selected.id === me.id && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-500">나</span>}
                      </div>
                      <p className="text-xs text-[#aaa]">총 {selected.tradeCount}회 거래 · {selected.stockPortfolio?.holdings.length ?? 0}종목 보유</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center text-sm text-[#666] hover:bg-black/15">✕</button>
                </div>

                {/* 탭 */}
                <div className="flex gap-1 rounded-xl bg-black/5 p-1 mb-3">
                  {([
                    { v: "overview" as DetailTab, label: "📊 요약" },
                    { v: "holdings" as DetailTab, label: "💼 보유종목" },
                    { v: "trades"   as DetailTab, label: "📋 거래내역" },
                  ]).map(({ v, label }) => (
                    <button key={v} onClick={() => setDetailTab(v)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${detailTab === v ? "bg-white text-[#171717] shadow-sm" : "text-[#888]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 스크롤 영역 */}
              <div className="overflow-y-auto px-5 pb-6 space-y-3 flex-1">

                {/* ── 요약 탭 ── */}
                {detailTab === "overview" && (
                  <>
                    {/* 자산 카드 */}
                    <div className="rounded-[20px] border border-black/5 bg-white/70 px-4 py-4 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide">총 평가자산</p>
                        <p className="text-3xl font-black text-[#171717] mt-0.5">{fmtKRW(Math.round(selTotal))}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-sm font-black ${selReturn >= 0 ? "text-red-500" : "text-blue-500"}`}>{selReturn >= 0 ? "▲" : "▼"} {fmtKRW(Math.abs(Math.round(selReturn)))}</p>
                          <p className={`text-sm font-black ${selReturn >= 0 ? "text-red-400" : "text-blue-400"}`}>({selReturn >= 0 ? "+" : ""}{selRetPct.toFixed(2)}%)</p>
                        </div>
                        <p className="text-[10px] text-[#aaa] mt-1">초기 자금 200만원 기준</p>
                      </div>
                      <div className="h-2 rounded-full bg-black/5 overflow-hidden">
                        <div className={`h-full rounded-full ${selReturn >= 0 ? "bg-gradient-to-r from-red-400 to-red-300" : "bg-gradient-to-r from-blue-500 to-blue-400"}`}
                          style={{ width: `${Math.min(100, Math.abs(selRetPct) * 2)}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5">
                        <div className="rounded-xl bg-[#f6f5f1] px-3 py-2.5">
                          <p className="text-[10px] text-[#aaa]">💵 현금</p>
                          <p className="text-sm font-black text-[#171717]">{fmtKRW(Math.round(selected.stockPortfolio?.cash ?? 0))}</p>
                          <p className="text-[10px] text-[#bbb]">비중 {selTotal ? Math.round(((selected.stockPortfolio?.cash ?? 0) / selTotal) * 100) : 0}%</p>
                        </div>
                        <div className="rounded-xl bg-[#f6f5f1] px-3 py-2.5">
                          <p className="text-[10px] text-[#aaa]">📈 주식 평가금</p>
                          <p className="text-sm font-black text-[#171717]">{fmtKRW(Math.round(selHoldKRW))}</p>
                          <p className="text-[10px] text-[#bbb]">비중 {selTotal ? Math.round((selHoldKRW / selTotal) * 100) : 0}%</p>
                        </div>
                      </div>
                    </div>

                    {/* 거래 통계 */}
                    {selAnalysis && (
                      <div className="rounded-[20px] border border-black/5 bg-white/70 px-4 py-4 space-y-3">
                        <p className="text-xs font-bold text-[#888]">📊 거래 통계</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-[#f6f5f1] px-3 py-2.5">
                            <p className="text-[10px] text-[#aaa]">총 거래</p>
                            <p className="text-sm font-black text-[#171717]">{selected.tradeCount}회</p>
                          </div>
                          <div className="rounded-xl bg-[#f6f5f1] px-3 py-2.5">
                            <p className="text-[10px] text-[#aaa]">매수 / 매도</p>
                            <p className="text-sm font-black text-[#171717]">
                              <span className="text-red-500">{selAnalysis.buyCount}</span>
                              <span className="text-[#ccc] mx-1">/</span>
                              <span className="text-blue-500">{selAnalysis.sellCount}</span>
                            </p>
                          </div>
                          <div className="rounded-xl bg-[#f6f5f1] px-3 py-2.5">
                            <p className="text-[10px] text-[#aaa]">총 매수금액</p>
                            <p className="text-sm font-black text-[#171717]">{fmtKRW(Math.round(selAnalysis.buyAmt))}</p>
                          </div>
                          <div className="rounded-xl bg-[#f6f5f1] px-3 py-2.5">
                            <p className="text-[10px] text-[#aaa]">실현 손익</p>
                            <p className={`text-sm font-black ${selAnalysis.realizedPnL >= 0 ? "text-red-500" : "text-blue-500"}`}>
                              {selAnalysis.realizedPnL >= 0 ? "+" : ""}{fmtKRW(Math.round(selAnalysis.realizedPnL))}
                            </p>
                          </div>
                        </div>
                        {selAnalysis.topStock && (
                          <div className="rounded-xl bg-[#f6f5f1] px-3 py-2.5 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-[#aaa]">가장 많이 거래한 종목</p>
                              <p className="text-sm font-bold text-[#171717]">{selAnalysis.topStock[1].name}</p>
                            </div>
                            <span className="text-xs font-bold bg-black/5 px-2 py-1 rounded-lg text-[#555]">{selAnalysis.topStock[1].count}회</span>
                          </div>
                        )}
                      </div>
                    )}

                    {me.role === "admin" && (
                      <Link href="/admin/stock-sim" className="block w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors">
                        🔧 관리자 패널에서 포트폴리오 관리하기
                      </Link>
                    )}
                  </>
                )}

                {/* ── 보유종목 탭 ── */}
                {detailTab === "holdings" && (
                  <>
                    {(selAnalysis?.holdingStats.length ?? 0) === 0 ? (
                      <div className="rounded-[20px] border border-black/5 bg-white/60 px-4 py-8 text-center">
                        <p className="text-2xl mb-2">💵</p>
                        <p className="text-sm text-[#888] font-semibold">전액 현금 보유</p>
                      </div>
                    ) : selAnalysis?.holdingStats.map(h => {
                      const isUp = h.ret >= 0;
                      return (
                        <div key={h.id} className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-bold text-[#171717] truncate">{h.name}</p>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${h.market === "KR" ? "bg-blue-50 text-blue-400" : h.market === "ETF" ? "bg-purple-50 text-purple-400" : "bg-red-50 text-red-400"}`}>{h.market}</span>
                              </div>
                              <p className="text-[10px] text-[#bbb] font-mono">{h.ticker}</p>
                              <div className="flex flex-wrap gap-x-3 mt-1.5 text-[10px] text-[#999]">
                                <span className="font-semibold">{h.quantity.toLocaleString()}주</span>
                                <span>
                                  평균 매입
                                  <span className="font-bold text-[#555] ml-1">{h.cur === "KRW" ? Math.round(h.avgPrice).toLocaleString("ko-KR") + "원" : fmtUSD(h.avgPrice)}</span>
                                  {h.cur !== "KRW" && <span className="text-[#bbb] ml-1">≈{Math.round(h.avgKRW).toLocaleString("ko-KR")}원</span>}
                                </span>
                                {prices[h.ticker] && (
                                  <span>
                                    현재가
                                    <span className={`font-bold ml-1 ${isUp ? "text-red-500" : "text-blue-500"}`}>
                                      {h.cur === "KRW" ? Math.round(h.currKRW).toLocaleString("ko-KR") + "원" : fmtUSD(prices[h.ticker].price)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-[#171717]">{fmtKRW(h.evalKRW)}</p>
                              {prices[h.ticker] ? (
                                <>
                                  <p className={`text-xs font-semibold ${isUp ? "text-red-500" : "text-blue-500"}`}>{isUp ? "+" : ""}{fmtKRW(h.ret)}</p>
                                  <p className={`text-[10px] font-bold ${isUp ? "text-red-400" : "text-blue-400"}`}>{isUp ? "+" : ""}{h.retPct.toFixed(2)}%</p>
                                </>
                              ) : <p className="text-xs text-[#ccc]">로딩중...</p>}
                            </div>
                          </div>
                          {prices[h.ticker] && (
                            <div className="mt-2 h-1 rounded-full bg-black/5 overflow-hidden">
                              <div className={`h-full rounded-full ${isUp ? "bg-red-400" : "bg-blue-400"}`} style={{ width: `${Math.min(100, Math.abs(h.retPct) * 3)}%` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ── 거래내역 탭 ── */}
                {detailTab === "trades" && (
                  <>
                    {(selected.stockTrades?.length ?? 0) === 0 ? (
                      <div className="rounded-[20px] border border-black/5 bg-white/60 px-4 py-8 text-center">
                        <p className="text-2xl mb-2">📋</p>
                        <p className="text-sm text-[#888]">거래 내역이 없습니다</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-[#aaa] px-1">최근 {selected.stockTrades.length}건</p>
                        {selected.stockTrades.map(t => {
                          const cur   = t.market === "KR" ? "KRW" : "USD";
                          const total = toKRW(t.total, cur, exRate);
                          const price = toKRW(t.price, cur, exRate);
                          const isBuy = t.type === "BUY";
                          return (
                            <div key={t.id} className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${isBuy ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>{isBuy ? "매수" : "매도"}</span>
                                    <p className="text-sm font-bold text-[#171717] truncate">{t.name}</p>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${t.market === "KR" ? "bg-blue-50 text-blue-400" : t.market === "ETF" ? "bg-purple-50 text-purple-400" : "bg-red-50 text-red-400"}`}>{t.market}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 mt-1 text-[10px] text-[#999]">
                                    <span>{t.quantity}주</span>
                                    <span>단가 {cur === "KRW" ? Math.round(t.price).toLocaleString("ko-KR") + "원" : fmtUSD(t.price)}{cur !== "KRW" && <span className="text-[#bbb] ml-1">≈{Math.round(price).toLocaleString("ko-KR")}원</span>}</span>
                                  </div>
                                  <p className="text-[10px] text-[#bbb] mt-0.5">{fmtDate(t.createdAt)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={`text-sm font-black ${isBuy ? "text-red-500" : "text-blue-500"}`}>{isBuy ? "-" : "+"}{fmtKRW(Math.round(total))}</p>
                                  <p className="text-[10px] text-[#bbb] font-mono">{t.ticker}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
