"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Holding = { id: number; ticker: string; name: string; market: string; quantity: number; avgPrice: number };
type Portfolio = { id: number; cash: number; holdings: Holding[] };
type Trade = { id: number; ticker: string; name: string; market: string; type: string; quantity: number; price: number; total: number; createdAt: string };
type UserRow = {
  id: number; email: string; nickname: string; createdAt: string;
  stockPortfolio: Portfolio | null;
  stockTrades: Trade[];
};

type ModalState =
  | { type: "resetPortfolio"; userId: number; nickname: string }
  | { type: "deleteHolding"; holdingId: number; name: string }
  | { type: "deleteTrade"; tradeId: number; name: string }
  | { type: "editHolding"; holding: Holding }
  | { type: "addHolding"; userId: number; nickname: string }
  | null;

function fmtKRW(n: number) {
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(1) + "억원";
  if (Math.abs(n) >= 1e4) return Math.round(n / 1e4) + "만원";
  return n.toLocaleString("ko-KR") + "원";
}
function fmt(n: number, market: string) {
  return market === "KR"
    ? n.toLocaleString("ko-KR") + "원"
    : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminStockSimPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Record<number, "holdings" | "trades">>({});
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  // 현금 수정
  const [editCashId, setEditCashId] = useState<number | null>(null);
  const [editCashVal, setEditCashVal] = useState("");

  // 보유종목 편집 폼
  const [editQty, setEditQty]   = useState("");
  const [editAvg, setEditAvg]   = useState("");

  // 보유종목 추가 폼
  const [addTicker, setAddTicker] = useState("");
  const [addName,   setAddName]   = useState("");
  const [addMarket, setAddMarket] = useState<"KR"|"US"|"ETF">("US");
  const [addQty,    setAddQty]    = useState("");
  const [addAvg,    setAddAvg]    = useState("");

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    fetch("/api/admin/stock-sim").then(r => r.json()).then(d => {
      if (d.ok) setUsers(d.users);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const api = async (method: string, body?: object, query?: string) => {
    setBusy(true);
    try {
      const url = "/api/admin/stock-sim" + (query ? "?" + query : "");
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      return data;
    } finally {
      setBusy(false);
    }
  };

  /* ── 액션 핸들러 ── */
  const saveCash = async (userId: number) => {
    const cash = parseFloat(editCashVal.replace(/,/g, ""));
    if (isNaN(cash) || cash < 0) { showToast("올바른 금액 입력", false); return; }
    const d = await api("PATCH", { action: "cash", userId, cash });
    if (d.ok) { showToast("현금 수정 완료 ✓", true); setEditCashId(null); load(); }
    else showToast(d.error ?? "오류", false);
  };

  const createPortfolio = async (userId: number) => {
    const d = await api("PATCH", { action: "createPortfolio", userId });
    if (d.ok) { showToast("포트폴리오 생성 완료 ✓", true); load(); }
    else showToast(d.error ?? "오류", false);
  };

  const resetPortfolio = async (userId: number) => {
    const d = await api("DELETE", undefined, `userId=${userId}`);
    if (d.ok) { showToast("포트폴리오 초기화 완료", true); setModal(null); load(); }
    else showToast(d.error ?? "오류", false);
  };

  const deleteHolding = async (holdingId: number) => {
    const d = await api("DELETE", undefined, `target=holding&holdingId=${holdingId}`);
    if (d.ok) { showToast("보유종목 삭제 완료", true); setModal(null); load(); }
    else showToast(d.error ?? "오류", false);
  };

  const deleteTrade = async (tradeId: number) => {
    const d = await api("DELETE", undefined, `target=trade&tradeId=${tradeId}`);
    if (d.ok) { showToast("거래내역 삭제 완료", true); setModal(null); load(); }
    else showToast(d.error ?? "오류", false);
  };

  const editHolding = async (holdingId: number) => {
    const qty = parseInt(editQty);
    const avg = parseFloat(editAvg.replace(/,/g, ""));
    if (!qty || qty <= 0 || !avg || avg <= 0) { showToast("올바른 값 입력", false); return; }
    const d = await api("PATCH", { action: "editHolding", holdingId, quantity: qty, avgPrice: avg });
    if (d.ok) { showToast("수정 완료 ✓", true); setModal(null); load(); }
    else showToast(d.error ?? "오류", false);
  };

  const addHolding = async (userId: number) => {
    const qty = parseInt(addQty);
    const avg = parseFloat(addAvg.replace(/,/g, ""));
    if (!addTicker.trim() || !addName.trim() || !qty || qty <= 0 || !avg || avg <= 0) {
      showToast("모든 항목을 입력해주세요", false); return;
    }
    const d = await api("PATCH", {
      action: "addHolding", userId,
      ticker: addTicker.trim().toUpperCase(), name: addName.trim(), market: addMarket,
      quantity: qty, avgPrice: avg,
    });
    if (d.ok) {
      showToast("보유종목 추가 완료 ✓", true);
      setModal(null);
      setAddTicker(""); setAddName(""); setAddQty(""); setAddAvg("");
      load();
    } else showToast(d.error ?? "오류", false);
  };

  const BgBlobs = () => (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#d9e2db] blur-3xl opacity-60" />
      <div className="absolute top-40 -right-20 w-72 h-72 rounded-full bg-[#dfdde8] blur-3xl opacity-60" />
    </div>
  );

  if (loading) return (
    <main className="min-h-screen bg-[#ecebe6] flex items-center justify-center">
      <BgBlobs />
      <p className="text-[#888] text-sm">불러오는 중...</p>
    </main>
  );

  const withPortfolio = users.filter(u => u.stockPortfolio);
  const totalCash = withPortfolio.reduce((s, u) => s + (u.stockPortfolio?.cash ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#ecebe6] p-4">
      <BgBlobs />
      <div className="relative mx-auto max-w-2xl space-y-4">

        {/* 헤더 */}
        <header className="pt-2 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/admin" className="rounded-2xl border border-black/8 bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#4d4d4d] backdrop-blur hover:bg-white/80 transition-colors">
              ← 어드민
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/stock-sim/ranking" className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 backdrop-blur hover:bg-violet-100 transition-colors">
                🏆 랭킹 보기
              </Link>
              <button onClick={load} className="rounded-2xl border border-black/8 bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#4d4d4d] backdrop-blur hover:bg-white/80 transition-colors">
                새로고침
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur">
            <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] px-5 py-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl border border-black/5 bg-white flex items-center justify-center text-2xl shrink-0">📈</div>
              <div className="flex-1">
                <p className="font-extrabold text-[#171717]">모의주식 관리</p>
                <p className="text-xs text-[#888] mt-0.5">참여자 {withPortfolio.length}명 · 총 보유 현금 {fmtKRW(Math.round(totalCash))}</p>
              </div>
            </div>
          </div>
        </header>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "전체 유저", value: users.length + "명", emoji: "👥" },
            { label: "참여중", value: withPortfolio.length + "명", emoji: "📊" },
            { label: "총 현금", value: fmtKRW(Math.round(totalCash / 10000)) + "(만)", emoji: "💰" },
          ].map(stat => (
            <div key={stat.label} className="rounded-[24px] border border-black/5 bg-white/62 p-2.5 backdrop-blur">
              <div className="rounded-[18px] border border-black/5 bg-[#f6f5f1] p-3 text-center">
                <p className="text-xl mb-1">{stat.emoji}</p>
                <p className="text-xs text-[#888]">{stat.label}</p>
                <p className="font-extrabold text-[#171717] text-sm mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 유저 목록 */}
        <div className="rounded-[28px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] p-3 space-y-2">
            <p className="text-xs font-bold text-[#888] px-1 pt-1">유저 포트폴리오</p>

            {users.map(u => {
              const p = u.stockPortfolio;
              const isExpanded = expandedId === u.id;
              const tab = activeTab[u.id] ?? "holdings";

              return (
                <div key={u.id} className="rounded-2xl border border-black/5 bg-white/80 overflow-hidden">
                  {/* 요약 헤더 */}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#171717]">{u.nickname}</p>
                        <p className="text-xs text-[#aaa]">{u.email}</p>
                      </div>
                      <div className="text-right">
                        {p ? (
                          <>
                            <p className="text-sm font-black text-[#171717]">{fmtKRW(Math.round(p.cash))}</p>
                            <p className="text-[10px] text-[#aaa]">{p.holdings.length}종목</p>
                          </>
                        ) : (
                          <p className="text-xs text-[#ccc]">미참여</p>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-1.5 mt-2.5 flex-wrap">
                      <button onClick={() => setExpandedId(isExpanded ? null : u.id)}
                        className="flex-1 rounded-xl border border-black/5 bg-[#f6f5f1] py-1.5 text-xs font-semibold text-[#666] hover:bg-black/5 transition-colors">
                        {isExpanded ? "접기 ▲" : "상세 ▼"}
                      </button>

                      {/* 현금 수정 버튼 / 인풋 */}
                      {editCashId === u.id ? (
                        <div className="flex gap-1 flex-1">
                          <input type="number" value={editCashVal} onChange={e => setEditCashVal(e.target.value)}
                            className="flex-1 min-w-0 rounded-xl border border-black/5 bg-[#f6f5f1] px-2 py-1.5 text-xs outline-none" placeholder="금액(원)" />
                          <button onClick={() => saveCash(u.id)} disabled={busy}
                            className="rounded-xl bg-[#171717] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">저장</button>
                          <button onClick={() => setEditCashId(null)}
                            className="rounded-xl border border-black/5 bg-white px-2 py-1.5 text-xs text-[#888]">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditCashId(u.id); setEditCashVal(p ? String(Math.round(p.cash)) : "2000000"); }}
                          className="flex-1 rounded-xl border border-black/5 bg-[#f6f5f1] py-1.5 text-xs font-semibold text-[#666] hover:bg-black/5 transition-colors">
                          💰 현금
                        </button>
                      )}

                      {!p && (
                        <button onClick={() => createPortfolio(u.id)} disabled={busy}
                          className="flex-1 rounded-xl border border-emerald-100 bg-emerald-50 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                          포트폴리오 생성
                        </button>
                      )}
                      {p && (
                        <button onClick={() => setModal({ type: "addHolding", userId: u.id, nickname: u.nickname })}
                          className="flex-1 rounded-xl border border-blue-100 bg-blue-50 py-1.5 text-xs font-semibold text-blue-500 hover:bg-blue-100 transition-colors">
                          📥 종목 추가
                        </button>
                      )}
                      <button onClick={() => setModal({ type: "resetPortfolio", userId: u.id, nickname: u.nickname })}
                        className="flex-1 rounded-xl border border-red-100 bg-red-50 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-100 transition-colors">
                        초기화
                      </button>
                    </div>
                  </div>

                  {/* 상세 패널 */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                        className="overflow-hidden border-t border-black/5">
                        {!p ? (
                          <p className="px-4 py-3 text-xs text-[#bbb]">아직 포트폴리오가 없습니다.</p>
                        ) : (
                          <div className="px-4 py-3 space-y-3">
                            {/* 탭 */}
                            <div className="flex gap-1 rounded-xl bg-[#f0efe9] border border-black/5 p-1">
                              {(["holdings", "trades"] as const).map(t => (
                                <button key={t}
                                  onClick={() => setActiveTab(prev => ({ ...prev, [u.id]: t }))}
                                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${tab === t ? "bg-[#171717] text-white" : "text-[#888]"}`}>
                                  {t === "holdings" ? `💼 보유종목 (${p.holdings.length})` : `📋 거래내역 (${u.stockTrades.length})`}
                                </button>
                              ))}
                            </div>

                            {/* 보유종목 탭 */}
                            {tab === "holdings" && (
                              <div className="space-y-1.5">
                                {p.holdings.length === 0
                                  ? <p className="text-xs text-[#bbb] text-center py-4">보유 종목 없음</p>
                                  : p.holdings.map(h => (
                                    <div key={h.id} className="rounded-xl border border-black/5 bg-[#f6f5f1] px-3 py-2.5">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-[#171717] truncate">{h.name}</span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                              h.market==="KR"?"bg-blue-50 text-blue-400":h.market==="ETF"?"bg-purple-50 text-purple-400":"bg-red-50 text-red-400"
                                            }`}>{h.market}</span>
                                          </div>
                                          <p className="text-[10px] text-[#aaa] font-mono">{h.ticker}</p>
                                          <p className="text-[10px] text-[#666] mt-0.5">
                                            {h.quantity}주 · 평균 {fmt(h.avgPrice, h.market)}
                                          </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                          <button onClick={() => {
                                            setModal({ type: "editHolding", holding: h });
                                            setEditQty(String(h.quantity));
                                            setEditAvg(h.market==="KR"?String(Math.round(h.avgPrice)):h.avgPrice.toFixed(2));
                                          }} className="rounded-lg border border-black/8 bg-white px-2.5 py-1 text-[10px] font-bold text-[#555] hover:bg-[#f0efe9]">
                                            수정
                                          </button>
                                          <button onClick={() => setModal({ type: "deleteHolding", holdingId: h.id, name: h.name })}
                                            className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-100">
                                            삭제
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}

                            {/* 거래내역 탭 */}
                            {tab === "trades" && (
                              <div className="space-y-1.5">
                                {u.stockTrades.length === 0
                                  ? <p className="text-xs text-[#bbb] text-center py-4">거래 내역 없음</p>
                                  : u.stockTrades.map(t => (
                                    <div key={t.id} className="rounded-xl border border-black/5 bg-[#f6f5f1] px-3 py-2.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${t.type==="BUY"?"bg-red-50 text-red-500":"bg-blue-50 text-blue-500"}`}>
                                              {t.type==="BUY"?"매수":"매도"}
                                            </span>
                                            <span className="text-xs font-bold text-[#333] truncate">{t.name}</span>
                                          </div>
                                          <p className="text-[10px] text-[#999] mt-0.5">
                                            {t.quantity}주 · {fmt(t.price, t.market)} · 합계 {fmt(Math.round(t.total), t.market)}
                                          </p>
                                          <p className="text-[9px] text-[#bbb]">
                                            {new Date(t.createdAt).toLocaleString("ko-KR", { month:"short",day:"numeric",hour:"2-digit",minute:"2-digit" })}
                                          </p>
                                        </div>
                                        <button onClick={() => setModal({ type: "deleteTrade", tradeId: t.id, name: t.name })}
                                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-100 shrink-0">
                                          삭제
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 모달 ── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[28px] border border-black/5 bg-white/95 p-3 shadow-2xl">
              <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] px-5 py-5 space-y-4">

                {/* 포트폴리오 초기화 */}
                {modal.type === "resetPortfolio" && (
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-2xl">⚠️</p>
                      <p className="font-bold text-[#171717]">{modal.nickname} 포트폴리오 초기화</p>
                      <p className="text-xs text-[#888]">보유 종목과 거래내역이 모두 삭제됩니다.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#444]">취소</button>
                      <button onClick={() => resetPortfolio(modal.userId)} disabled={busy}
                        className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">초기화</button>
                    </div>
                  </>
                )}

                {/* 보유종목 삭제 */}
                {modal.type === "deleteHolding" && (
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-2xl">🗑️</p>
                      <p className="font-bold text-[#171717]">{modal.name} 삭제</p>
                      <p className="text-xs text-[#888]">이 보유종목을 제거합니다.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#444]">취소</button>
                      <button onClick={() => deleteHolding(modal.holdingId)} disabled={busy}
                        className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">삭제</button>
                    </div>
                  </>
                )}

                {/* 거래내역 삭제 */}
                {modal.type === "deleteTrade" && (
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-2xl">🗑️</p>
                      <p className="font-bold text-[#171717]">{modal.name} 거래내역 삭제</p>
                      <p className="text-xs text-[#888]">이 거래내역을 제거합니다. 보유종목엔 영향 없음.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#444]">취소</button>
                      <button onClick={() => deleteTrade(modal.tradeId)} disabled={busy}
                        className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">삭제</button>
                    </div>
                  </>
                )}

                {/* 보유종목 수정 */}
                {modal.type === "editHolding" && (
                  <>
                    <div>
                      <p className="font-bold text-[#171717] mb-0.5">보유종목 수정</p>
                      <p className="text-xs text-[#888]">{modal.holding.name} · {modal.holding.ticker}</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-bold text-[#aaa] mb-1">수량 (주)</p>
                        <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)}
                          className="w-full rounded-xl border border-black/8 bg-white px-3 py-2.5 text-sm font-bold outline-none" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#aaa] mb-1">
                          평균 매입가 ({modal.holding.market === "KR" ? "원" : "USD"})
                        </p>
                        <input type="number" value={editAvg} onChange={e => setEditAvg(e.target.value)}
                          step={modal.holding.market === "KR" ? "100" : "0.01"}
                          className="w-full rounded-xl border border-black/8 bg-white px-3 py-2.5 text-sm font-bold outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#444]">취소</button>
                      <button onClick={() => editHolding(modal.holding.id)} disabled={busy}
                        className="flex-1 rounded-2xl bg-[#171717] py-3 text-sm font-bold text-white disabled:opacity-50">저장</button>
                    </div>
                  </>
                )}

                {/* 보유종목 추가 */}
                {modal.type === "addHolding" && (
                  <>
                    <div>
                      <p className="font-bold text-[#171717] mb-0.5">보유종목 추가</p>
                      <p className="text-xs text-[#888]">{modal.nickname}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-[#aaa] mb-1">티커</p>
                          <input value={addTicker} onChange={e => setAddTicker(e.target.value)}
                            placeholder="AAPL, 005930.KS"
                            className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-bold outline-none placeholder:font-normal placeholder:text-[#ccc]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#aaa] mb-1">시장</p>
                          <select value={addMarket} onChange={e => setAddMarket(e.target.value as "KR"|"US"|"ETF")}
                            className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-bold outline-none">
                            <option value="US">🇺🇸 US</option>
                            <option value="KR">🇰🇷 KR</option>
                            <option value="ETF">📦 ETF</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#aaa] mb-1">종목명</p>
                        <input value={addName} onChange={e => setAddName(e.target.value)}
                          placeholder="Apple"
                          className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-bold outline-none placeholder:font-normal placeholder:text-[#ccc]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-[#aaa] mb-1">수량 (주)</p>
                          <input type="number" value={addQty} onChange={e => setAddQty(e.target.value)}
                            className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#aaa] mb-1">
                            평균단가 ({addMarket === "KR" ? "원" : "USD"})
                          </p>
                          <input type="number" value={addAvg} onChange={e => setAddAvg(e.target.value)}
                            step={addMarket === "KR" ? "100" : "0.01"}
                            className="w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-bold outline-none" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#444]">취소</button>
                      <button onClick={() => addHolding(modal.userId)} disabled={busy}
                        className="flex-1 rounded-2xl bg-[#171717] py-3 text-sm font-bold text-white disabled:opacity-50">추가</button>
                    </div>
                  </>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg ${toast.ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
