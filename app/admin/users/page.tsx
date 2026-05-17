"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ══════════════════════════════════════════
   타입
══════════════════════════════════════════ */
type User = {
  id: number; email: string; nickname: string; role: "user" | "admin";
  createdAt: string; lastSeenAt: string | null; loginCount: number;
  totalStudySeconds: number; totalAnswers: number; correctAnswers: number;
  emailVerified: boolean;
};
type Holding   = { id: number; ticker: string; name: string; market: string; quantity: number; avgPrice: number };
type Portfolio = { id: number; cash: number; holdings: Holding[] };
type Trade     = { id: number; ticker: string; name: string; market: string; type: string; quantity: number; price: number; total: number; createdAt: string };
type StockUser = { id: number; stockPortfolio: Portfolio | null; stockTrades: Trade[] };

type ModalState =
  | { type: "nickname";       user: User }
  | { type: "email";          user: User }
  | { type: "role";           user: User }
  | { type: "resetPassword";  user: User }
  | { type: "delete";         user: User }
  | { type: "createUser" }
  | null;

type SortKey    = "newest" | "oldest" | "lastSeen" | "loginCount" | "accuracy" | "name" | "asset";
type RoleFilter = "all" | "user" | "admin";
type StockTab   = "portfolio" | "trades";

/* ══════════════════════════════════════════
   유틸
══════════════════════════════════════════ */
const KRW_FB   = 1380;
const INITIAL  = 2_000_000;

function fmtKRW(n: number) {
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(1) + "억원";
  if (Math.abs(n) >= 1e4) return Math.round(n / 1e4).toLocaleString("ko-KR") + "만원";
  return n.toLocaleString("ko-KR") + "원";
}
function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function toKRW(p: number, cur: string, rate: number) { return cur === "KRW" ? p : p * rate; }
function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " " +
         d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
function fmtRel(v: string | null) {
  if (!v) return "없음";
  const diff = Math.floor((Date.now() - new Date(v).getTime()) / 1000);
  if (diff < 60)    return "방금 전";
  if (diff < 3600)  return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + "일 전";
  return new Date(v).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
function fmtSec(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`; if (m > 0) return `${m}분`; return `${s}초`;
}
function accuracy(u: User) { return u.totalAnswers === 0 ? null : (u.correctAnswers / u.totalAnswers) * 100; }
function initials(name: string) { return name.slice(0, 1).toUpperCase(); }
const AV_COLORS = ["bg-red-400","bg-orange-400","bg-amber-400","bg-emerald-400","bg-teal-400","bg-cyan-400","bg-blue-400","bg-violet-400","bg-fuchsia-400","bg-pink-400"];
function avColor(id: number) { return AV_COLORS[id % AV_COLORS.length]; }

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
export default function AdminUsersPage() {
  const [me,         setMe]        = useState<User | null | "loading">("loading");
  const [users,      setUsers]     = useState<User[]>([]);
  const [stockMap,   setStockMap]  = useState<Record<number, StockUser>>({});
  const [exRate,     setExRate]    = useState(KRW_FB);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState("");
  const [sort,       setSort]      = useState<SortKey>("newest");
  const [roleFilter, setRoleFilter]= useState<RoleFilter>("all");
  const [modal,      setModal]     = useState<ModalState>(null);
  const [toast,      setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [busy,       setBusy]      = useState(false);
  const [expandedId, setExpandedId]= useState<number | null>(null);
  const [stockTab,   setStockTab]  = useState<StockTab>("portfolio");

  /* 폼 */
  const [formNickname, setFormNickname] = useState("");
  const [formEmail,    setFormEmail]    = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPwGen,    setShowPwGen]    = useState(false);

  /* 계정 생성 폼 */
  const [createForm, setCreateForm] = useState({ email: "", nickname: "", password: "", role: "user" as "user" | "admin" });
  const [createShowPw, setCreateShowPw] = useState(false);

  /* 잔액 수정 */
  const [editCash,    setEditCash]  = useState<{ userId: number; val: string } | null>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok: boolean) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  /* 데이터 로드 */
  const loadUsers = async () => {
    const r = await fetch("/api/admin/users", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setUsers(d.users);
  };
  const loadStock = async () => {
    const r = await fetch("/api/admin/stock-sim", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) {
      const m: Record<number, StockUser> = {};
      for (const u of d.users) m[u.id] = { id: u.id, stockPortfolio: u.stockPortfolio, stockTrades: u.stockTrades ?? [] };
      setStockMap(m);
    }
  };

  useEffect(() => {
    fetch("/api/stock-price?tickers=KRW%3DX").then(r => r.json()).then(d => { if (d.ok && d.items?.[0]) setExRate(d.items[0].price); });
  }, []);

  useEffect(() => {
    const init = async () => {
      const r = await fetch("/api/me", { cache: "no-store" });
      const d = await r.json();
      setMe(d.ok ? d.user : null);
      if (d.ok && d.user.role === "admin") await Promise.all([loadUsers(), loadStock()]);
      setLoading(false);
    };
    init();
  }, []);

  /* 총자산 계산 */
  const calcAsset = (su: StockUser | undefined) => {
    if (!su?.stockPortfolio) return 0;
    const holdKRW = su.stockPortfolio.holdings.reduce((s, h) => {
      const cur = h.market === "KR" ? "KRW" : "USD";
      return s + toKRW(h.avgPrice, cur, exRate) * h.quantity;
    }, 0);
    return su.stockPortfolio.cash + holdKRW;
  };

  /* 필터·정렬 */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = users.filter(u => {
      const mR = roleFilter === "all" || u.role === roleFilter;
      const mQ = !q || u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return mR && mQ;
    });
    list = [...list].sort((a, b) => {
      if (sort === "oldest")     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "lastSeen")   return (b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0) - (a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0);
      if (sort === "loginCount") return b.loginCount - a.loginCount;
      if (sort === "accuracy")   return (accuracy(b) ?? -1) - (accuracy(a) ?? -1);
      if (sort === "name")       return a.nickname.localeCompare(b.nickname, "ko");
      if (sort === "asset")      return calcAsset(stockMap[b.id]) - calcAsset(stockMap[a.id]);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, search, sort, roleFilter, stockMap, exRate]);

  /* API 호출 */
  const api = async (id: number, method: string, body?: object) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return await res.json();
    } finally { setBusy(false); }
  };
  const stockApi = async (method: string, body?: object, query?: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/stock-sim" + (query ? "?" + query : ""), {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      return await res.json();
    } finally { setBusy(false); }
  };

  /* 유저 관리 액션 */
  const doNickname = async () => {
    if (!modal || modal.type !== "nickname") return;
    const d = await api(modal.user.id, "PATCH", { action: "nickname", nickname: formNickname });
    if (d.ok) { showToast("닉네임 변경 완료 ✓", true); setModal(null); await loadUsers(); }
    else showToast(d.message ?? "오류", false);
  };
  const doEmail = async () => {
    if (!modal || modal.type !== "email") return;
    const d = await api(modal.user.id, "PATCH", { action: "email", email: formEmail });
    if (d.ok) { showToast("이메일 변경 완료 ✓", true); setModal(null); await loadUsers(); }
    else showToast(d.message ?? "오류", false);
  };
  const doRole = async (user: User, newRole: "user" | "admin") => {
    const d = await api(user.id, "PATCH", { action: "role", role: newRole });
    if (d.ok) { showToast(`권한 변경 → ${newRole} ✓`, true); await loadUsers(); }
    else showToast(d.message ?? "오류", false);
  };
  const doResetPassword = async () => {
    if (!modal || modal.type !== "resetPassword") return;
    if (formPassword.length < 4) { showToast("4자 이상 입력해주세요", false); return; }
    const d = await api(modal.user.id, "PATCH", { action: "resetPassword", password: formPassword });
    if (d.ok) { showToast("비밀번호 초기화 완료 ✓", true); setModal(null); setFormPassword(""); setShowPwGen(false); }
    else showToast(d.message ?? "오류", false);
  };
  const doDelete = async () => {
    if (!modal || modal.type !== "delete") return;
    const d = await api(modal.user.id, "DELETE");
    if (d.ok) { showToast("사용자 삭제 완료", true); setModal(null); await Promise.all([loadUsers(), loadStock()]); }
    else showToast(d.message ?? "오류", false);
  };
  const genPassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789!@#";
    let pw = ""; for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setFormPassword(pw); setShowPwGen(true);
  };
  const genCreatePassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789!@#";
    let pw = ""; for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setCreateForm(f => ({ ...f, password: pw })); setCreateShowPw(true);
  };
  const doCreateUser = async () => {
    const { email, nickname, password, role } = createForm;
    if (!email.includes("@"))  { showToast("올바른 이메일을 입력해주세요", false); return; }
    if (!nickname.trim())       { showToast("닉네임을 입력해주세요", false); return; }
    if (password.length < 4)   { showToast("비밀번호는 4자 이상이어야 합니다", false); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nickname, password, role }),
      });
      const d = await res.json();
      if (d.ok) {
        showToast(`계정 생성 완료 ✓ (${nickname})`, true);
        setModal(null);
        setCreateForm({ email: "", nickname: "", password: "", role: "user" });
        setCreateShowPw(false);
        await loadUsers();
      } else showToast(d.message ?? "오류", false);
    } finally { setBusy(false); }
  };

  /* 잔액 수정 */
  const saveCash = async (userId: number) => {
    if (!editCash) return;
    const cash = parseFloat(editCash.val.replace(/,/g, ""));
    if (isNaN(cash) || cash < 0) { showToast("올바른 금액을 입력해주세요", false); return; }
    const d = await stockApi("PATCH", { action: "cash", userId, cash });
    if (d.ok) { showToast("잔액 수정 완료 ✓", true); setEditCash(null); await loadStock(); }
    else showToast(d.error ?? "오류", false);
  };

  /* 보유종목 삭제 */
  const deleteHolding = async (holdingId: number, name: string) => {
    if (!confirm(`"${name}" 종목을 삭제하시겠습니까?`)) return;
    const d = await stockApi("DELETE", undefined, `target=holding&holdingId=${holdingId}`);
    if (d.ok) { showToast(`${name} 삭제 완료`, true); await loadStock(); }
    else showToast(d.error ?? "오류", false);
  };

  /* 포트폴리오 초기화 */
  const resetPortfolio = async (userId: number) => {
    if (!confirm("포트폴리오를 초기화하시겠습니까? 모든 보유 종목과 거래 내역이 삭제됩니다.")) return;
    const d = await stockApi("DELETE", undefined, `userId=${userId}`);
    if (d.ok) { showToast("포트폴리오 초기화 완료", true); await loadStock(); }
    else showToast(d.error ?? "오류", false);
  };

  /* 포트폴리오 생성 */
  const createPortfolio = async (userId: number) => {
    const d = await stockApi("PATCH", { action: "createPortfolio", userId });
    if (d.ok) { showToast("포트폴리오 생성 완료 ✓", true); await loadStock(); }
    else showToast(d.error ?? "오류", false);
  };

  /* 전체 현금 재계산 */
  const recalcAllCash = async () => {
    if (!confirm(`거래 내역 기반으로 모든 유저의 현금을 재계산합니다.\n환율 ${exRate.toLocaleString()}원 기준으로 적용됩니다.\n계속하시겠습니까?`)) return;
    const d = await stockApi("PATCH", { action: "recalcCash", exRate });
    if (d.ok) { showToast(`${d.updated}명 현금 재계산 완료 ✓`, true); await loadStock(); }
    else showToast(d.error ?? "오류", false);
  };

  /* ── 로딩 ── */
  if (loading || me === "loading") return (
    <main className="min-h-screen bg-[#ecebe6] flex items-center justify-center"><BgBlobs/>
      <div className="text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-3xl border border-black/5 bg-white/62 flex items-center justify-center text-2xl animate-pulse">👥</div>
        <p className="text-[#888] text-sm">불러오는 중...</p>
      </div>
    </main>
  );
  if (!me || (me as User).role !== "admin") return (
    <main className="min-h-screen bg-[#ecebe6] flex items-center justify-center p-4"><BgBlobs/>
      <div className="text-center space-y-4">
        <p className="text-5xl">⛔</p>
        <p className="text-xl font-black text-[#171717]">{!me ? "로그인이 필요합니다" : "관리자 권한이 필요합니다"}</p>
        <Link href="/hub" className="block rounded-2xl bg-[#171717] px-6 py-3 text-white font-bold">홈으로</Link>
      </div>
    </main>
  );

  /* 통계 */
  const adminCount  = users.filter(u => u.role === "admin").length;
  const activeToday = users.filter(u => u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < 86400000).length;
  const avgAcc      = (() => { const v = users.filter(u => u.totalAnswers > 0).map(u => (u.correctAnswers / u.totalAnswers) * 100); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; })();
  const stockUsers  = Object.values(stockMap).filter(s => s.stockPortfolio);
  const totalCash   = stockUsers.reduce((s, u) => s + (u.stockPortfolio?.cash ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#ecebe6]">
      <BgBlobs/>

      {/* ─── 토스트 ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl ${toast.ok ? "bg-emerald-500" : "bg-red-500"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 모달 ─── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[28px] border border-black/5 bg-[#f6f5f1] p-5 shadow-2xl space-y-4">
              <button onClick={() => setModal(null)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/8 flex items-center justify-center text-xs text-[#666] hover:bg-black/15">✕</button>

              {modal.type === "nickname" && (<>
                <div><p className="text-lg font-black text-[#171717]">닉네임 변경</p><p className="text-xs text-[#aaa] mt-0.5">{modal.user.nickname}</p></div>
                <input value={formNickname} onChange={e => setFormNickname(e.target.value)} placeholder="새 닉네임" autoFocus onKeyDown={e => e.key === "Enter" && doNickname()}
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none placeholder:text-[#ccc]"/>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#666]">취소</button>
                  <button onClick={doNickname} disabled={busy || !formNickname.trim()} className="flex-1 rounded-2xl bg-[#171717] py-3 text-sm font-bold text-white disabled:opacity-40">저장</button>
                </div>
              </>)}

              {modal.type === "email" && (<>
                <div><p className="text-lg font-black text-[#171717]">이메일 변경</p><p className="text-xs text-[#aaa] mt-0.5">{modal.user.email}</p></div>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="새 이메일" autoFocus onKeyDown={e => e.key === "Enter" && doEmail()}
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none placeholder:text-[#ccc]"/>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#666]">취소</button>
                  <button onClick={doEmail} disabled={busy || !formEmail.includes("@")} className="flex-1 rounded-2xl bg-[#171717] py-3 text-sm font-bold text-white disabled:opacity-40">저장</button>
                </div>
              </>)}

              {modal.type === "resetPassword" && (<>
                <div><p className="text-lg font-black text-[#171717]">비밀번호 초기화</p><p className="text-xs text-[#aaa] mt-0.5">{modal.user.nickname}</p></div>
                <div className="space-y-2">
                  <input type="text" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="새 비밀번호 (4자 이상)" autoFocus
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm font-mono outline-none placeholder:text-[#ccc]"/>
                  <button onClick={genPassword} className="w-full rounded-2xl border border-black/8 bg-white py-2.5 text-xs font-bold text-[#444]">🎲 랜덤 생성</button>
                  {showPwGen && formPassword && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs">
                      <p className="text-amber-700 font-bold mb-1">⚠️ 사용자에게 알려주세요:</p>
                      <p className="font-mono text-sm font-black text-amber-900 select-all">{formPassword}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setModal(null); setFormPassword(""); setShowPwGen(false); }} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#666]">취소</button>
                  <button onClick={doResetPassword} disabled={busy || formPassword.length < 4} className="flex-1 rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white disabled:opacity-40">초기화</button>
                </div>
              </>)}

              {modal.type === "delete" && (<>
                <div className="text-center space-y-2">
                  <p className="text-4xl">⚠️</p>
                  <p className="text-lg font-black text-[#171717]">정말 삭제하시겠습니까?</p>
                  <p className="text-sm text-[#888]"><span className="font-bold text-red-500">{modal.user.nickname}</span> ({modal.user.email})</p>
                  <p className="text-xs text-[#aaa]">모든 데이터가 영구 삭제됩니다.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#666]">취소</button>
                  <button onClick={doDelete} disabled={busy} className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white disabled:opacity-40">삭제</button>
                </div>
              </>)}

              {modal.type === "createUser" && (<>
                <div>
                  <p className="text-lg font-black text-[#171717]">➕ 계정 만들기</p>
                  <p className="text-xs text-[#aaa] mt-0.5">이메일 인증 없이 즉시 생성됩니다</p>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-[10px] font-bold text-[#aaa] mb-1 px-1">이메일</p>
                    <input type="email" value={createForm.email}
                      onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="example@email.com" autoFocus
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none placeholder:text-[#ccc]"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#aaa] mb-1 px-1">닉네임</p>
                    <input type="text" value={createForm.nickname}
                      onChange={e => setCreateForm(f => ({ ...f, nickname: e.target.value }))}
                      placeholder="닉네임"
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none placeholder:text-[#ccc]"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#aaa] mb-1 px-1">비밀번호</p>
                    <input type="text" value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="4자 이상"
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm font-mono outline-none placeholder:text-[#ccc]"/>
                    <button onClick={genCreatePassword} className="w-full mt-1.5 rounded-2xl border border-black/8 bg-white py-2.5 text-xs font-bold text-[#444]">🎲 랜덤 비밀번호 생성</button>
                    {createShowPw && createForm.password && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs mt-1.5">
                        <p className="text-amber-700 font-bold mb-1">📋 사용자에게 알려줄 비밀번호:</p>
                        <p className="font-mono text-sm font-black text-amber-900 select-all">{createForm.password}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#aaa] mb-1 px-1">권한</p>
                    <div className="flex gap-2">
                      {(["user", "admin"] as const).map(r => (
                        <button key={r} onClick={() => setCreateForm(f => ({ ...f, role: r }))}
                          className={`flex-1 rounded-2xl py-2.5 text-xs font-bold border transition-all ${createForm.role === r
                            ? r === "admin" ? "bg-amber-500 text-white border-amber-500" : "bg-[#171717] text-white border-[#171717]"
                            : "bg-white text-[#888] border-black/8"}`}>
                          {r === "admin" ? "🔑 관리자" : "👤 일반 사용자"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setModal(null)} className="flex-1 rounded-2xl border border-black/8 bg-white py-3 text-sm font-bold text-[#666]">취소</button>
                  <button onClick={doCreateUser} disabled={busy || !createForm.email.includes("@") || !createForm.nickname.trim() || createForm.password.length < 4}
                    className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-emerald-600 transition-colors">
                    {busy ? "생성중..." : "계정 생성"}
                  </button>
                </div>
              </>)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 본문 ─── */}
      <div className="relative max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="rounded-xl border border-black/8 bg-white/60 px-3 py-1.5 text-sm font-semibold text-[#4d4d4d] hover:bg-white/80 transition-colors">← 어드민</Link>
            <Link href="/stock-sim/ranking" className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors">🏆 랭킹</Link>
            <span className="font-black text-[#171717] hidden sm:inline">👥 사용자 관리</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setCreateForm({ email: "", nickname: "", password: "", role: "user" }); setCreateShowPw(false); setModal({ type: "createUser" }); }}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
              ➕ 계정 만들기
            </button>
            <button onClick={async () => { setBusy(true); await Promise.all([loadUsers(), loadStock()]); setBusy(false); }} disabled={busy}
              className="rounded-xl border border-black/8 bg-white/60 px-3 py-1.5 text-xs font-bold text-[#4d4d4d] hover:bg-white/80 transition-colors disabled:opacity-40">
              {busy ? "⟳ 갱신중..." : "⟳ 새로고침"}
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: "👥", label: "전체 사용자",   value: users.length + "명" },
            { emoji: "🟢", label: "오늘 접속",      value: activeToday + "명" },
            { emoji: "📈", label: "주식 참여자",    value: stockUsers.length + "명" },
            { emoji: "💰", label: "총 현금 잔고",   value: fmtKRW(Math.round(totalCash)) },
          ].map(s => (
            <div key={s.label} className="rounded-[24px] border border-black/5 bg-white/62 p-3 backdrop-blur shadow-sm">
              <div className="rounded-[18px] border border-black/5 bg-[#f6f5f1] px-3 py-3 text-center">
                <p className="text-xl">{s.emoji}</p>
                <p className="text-[10px] text-[#aaa] mt-1">{s.label}</p>
                <p className="text-sm font-black text-[#171717]">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 현금 재계산 배너 */}
        <div className="rounded-[24px] border border-orange-200 bg-orange-50/80 p-3 backdrop-blur">
          <div className="rounded-[18px] border border-orange-100 bg-white/70 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-black text-orange-700">⚠️ 현금 데이터 재계산</p>
              <p className="text-xs text-orange-500 mt-0.5">버그로 인해 잘못 저장된 현금을 거래 내역 기반으로 일괄 수정합니다 · 환율 {exRate.toLocaleString()}원 적용</p>
            </div>
            <button onClick={recalcAllCash} disabled={busy}
              className="shrink-0 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-600 transition-colors disabled:opacity-40">
              {busy ? "처리중..." : "🔧 전체 재계산"}
            </button>
          </div>
        </div>

        {/* 검색·필터·정렬 */}
        <div className="rounded-[24px] border border-black/5 bg-white/62 p-3 backdrop-blur shadow-md">
          <div className="rounded-[18px] border border-black/5 bg-[#f6f5f1] p-3 space-y-2.5">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm text-[#bbb]">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="닉네임 또는 이메일로 검색"
                className="w-full rounded-2xl border border-black/5 bg-white/80 pl-9 pr-9 py-2.5 text-sm outline-none placeholder:text-[#bbb]"/>
              {search && <button onClick={() => setSearch("")} className="absolute right-3.5 top-2.5 text-xs text-[#bbb] hover:text-[#888]">✕</button>}
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-1">
                {(["all","user","admin"] as RoleFilter[]).map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${roleFilter === r ? "bg-[#171717] text-white" : "bg-white/80 text-[#888] border border-black/5"}`}>
                    {r === "all" ? "전체" : r === "admin" ? "🔑 관리자" : "👤 일반"}
                  </button>
                ))}
              </div>
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                className="rounded-xl border border-black/5 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#555] outline-none">
                <option value="newest">최신 가입순</option>
                <option value="oldest">오래된 순</option>
                <option value="lastSeen">최근 접속순</option>
                <option value="loginCount">로그인 횟수순</option>
                <option value="accuracy">정답률순</option>
                <option value="asset">주식 자산순</option>
                <option value="name">이름순</option>
              </select>
            </div>
            <p className="text-[10px] text-[#aaa] px-1">{filtered.length}명 표시중</p>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="rounded-[24px] border border-black/5 bg-white/62 p-3 backdrop-blur shadow-md">
          <div className="rounded-[18px] border border-black/5 bg-[#f6f5f1] p-3 space-y-2">
            {filtered.length === 0 && <p className="text-center py-10 text-sm text-[#bbb]">해당하는 사용자가 없습니다</p>}

            {filtered.map((u, i) => {
              const acc      = accuracy(u);
              const isMe     = (me as User).id === u.id;
              const expanded = expandedId === u.id;
              const su       = stockMap[u.id];
              const asset    = calcAsset(su);
              const assetRet = asset - INITIAL;

              return (
                <motion.div key={u.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 15) * 0.03 }}
                  className={`rounded-2xl border bg-white/80 overflow-hidden ${u.role === "admin" ? "border-amber-200" : "border-black/5"}`}>

                  {/* 헤더 행 */}
                  <button onClick={() => setExpandedId(expanded ? null : u.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-black/[0.02] transition-colors text-left">
                    <div className={`w-9 h-9 rounded-xl ${avColor(u.id)} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                      {initials(u.nickname)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-[#171717] truncate">{u.nickname}</p>
                        {u.role === "admin" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 shrink-0">관리자</span>}
                        {isMe && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-500 shrink-0">나</span>}
                        {su?.stockPortfolio && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 shrink-0">주식참여</span>}
                      </div>
                      <p className="text-[10px] text-[#aaa] truncate">{u.email}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                      {su?.stockPortfolio && (
                        <p className={`text-[10px] font-bold ${assetRet >= 0 ? "text-red-500" : "text-blue-500"}`}>
                          {fmtKRW(Math.round(asset))} {assetRet >= 0 ? "▲" : "▼"}{Math.abs((assetRet / INITIAL) * 100).toFixed(1)}%
                        </p>
                      )}
                      <p className="text-[10px] text-[#aaa]">{fmtRel(u.lastSeenAt)}</p>
                    </div>
                    <span className={`text-[#ccc] text-sm transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`}>›</span>
                  </button>

                  {/* 확장 패널 */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-black/5">
                        <div className="px-4 py-4 space-y-4">

                          {/* ── 기본 통계 ── */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { label: "가입일",      val: fmtRel(u.createdAt) },
                              { label: "마지막 접속", val: fmtRel(u.lastSeenAt) },
                              { label: "로그인 횟수", val: u.loginCount + "회" },
                              { label: "총 학습시간", val: fmtSec(u.totalStudySeconds) },
                              { label: "총 응답",     val: u.totalAnswers + "회" },
                              { label: "정답률",      val: acc != null ? acc.toFixed(1) + "%" : "없음" },
                            ].map(s => (
                              <div key={s.label} className="rounded-xl bg-[#f6f5f1] px-3 py-2.5">
                                <p className="text-[10px] text-[#aaa]">{s.label}</p>
                                <p className="text-xs font-bold text-[#333] mt-0.5">{s.val}</p>
                              </div>
                            ))}
                          </div>

                          {/* ── 계정 관리 버튼 ── */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide">계정 관리</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => { setFormNickname(u.nickname); setModal({ type: "nickname", user: u }); }}
                                className="rounded-xl border border-black/8 bg-white px-3 py-2.5 text-xs font-bold text-[#444] hover:bg-[#f6f5f1] transition-colors text-left">
                                ✏️ 닉네임 변경<p className="text-[10px] text-[#bbb] font-normal mt-0.5">{u.nickname}</p>
                              </button>
                              <button onClick={() => { setFormEmail(u.email); setModal({ type: "email", user: u }); }}
                                className="rounded-xl border border-black/8 bg-white px-3 py-2.5 text-xs font-bold text-[#444] hover:bg-[#f6f5f1] transition-colors text-left">
                                📧 이메일 변경<p className="text-[10px] text-[#bbb] font-normal mt-0.5 truncate">{u.email}</p>
                              </button>
                              <button disabled={isMe || busy} onClick={() => doRole(u, u.role === "admin" ? "user" : "admin")}
                                className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors text-left disabled:opacity-40 ${u.role === "admin" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : "border-black/8 bg-white text-[#444] hover:bg-[#f6f5f1]"}`}>
                                {u.role === "admin" ? "🔑 관리자 → 일반" : "👤 일반 → 관리자"}
                                {isMe && <p className="text-[10px] text-[#bbb] font-normal mt-0.5">자신은 변경 불가</p>}
                              </button>
                              <button onClick={() => { setFormPassword(""); setShowPwGen(false); setModal({ type: "resetPassword", user: u }); }}
                                className="rounded-xl border border-black/8 bg-white px-3 py-2.5 text-xs font-bold text-[#444] hover:bg-[#f6f5f1] transition-colors text-left">
                                🔒 비밀번호 초기화<p className="text-[10px] text-[#bbb] font-normal mt-0.5">임시 비밀번호 설정</p>
                              </button>
                            </div>
                            {!isMe && (
                              <button onClick={() => setModal({ type: "delete", user: u })}
                                className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">
                                🗑️ 사용자 삭제 (복구 불가)
                              </button>
                            )}
                          </div>

                          {/* ── 모의주식 섹션 ── */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-[#aaa] uppercase tracking-wide">📈 모의주식</p>

                            {!su?.stockPortfolio ? (
                              <div className="rounded-xl border border-black/8 bg-white/60 px-4 py-3 flex items-center justify-between">
                                <p className="text-xs text-[#aaa]">포트폴리오 없음</p>
                                <button onClick={() => createPortfolio(u.id)} disabled={busy}
                                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors">
                                  + 포트폴리오 생성
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* 자산 요약 */}
                                <div className="rounded-xl border border-black/8 bg-white/80 px-4 py-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-[#333]">총 평가자산</p>
                                    <p className={`text-xs font-bold ${assetRet >= 0 ? "text-red-500" : "text-blue-500"}`}>
                                      {assetRet >= 0 ? "▲" : "▼"} {Math.abs((assetRet / INITIAL) * 100).toFixed(2)}%
                                    </p>
                                  </div>
                                  <p className="text-xl font-black text-[#171717]">{fmtKRW(Math.round(asset))}</p>
                                  <div className="flex gap-3 mt-2 text-[10px] text-[#999]">
                                    <span>현금 <span className="font-bold text-[#555]">{fmtKRW(Math.round(su.stockPortfolio.cash))}</span></span>
                                    <span>종목 <span className="font-bold text-[#555]">{su.stockPortfolio.holdings.length}개</span></span>
                                    <span>거래 <span className="font-bold text-[#555]">{su.stockTrades.length}건</span></span>
                                  </div>
                                </div>

                                {/* 잔액 수정 */}
                                <div className="rounded-xl border border-black/8 bg-white/80 px-4 py-3 space-y-2">
                                  <p className="text-xs font-bold text-[#555]">💵 현금 잔액 수정</p>
                                  {editCash?.userId === u.id ? (
                                    <div className="flex gap-2">
                                      <input ref={cashInputRef} type="number" value={editCash.val}
                                        onChange={e => setEditCash({ userId: u.id, val: e.target.value })}
                                        placeholder="금액 입력 (원)"
                                        className="flex-1 rounded-xl border border-black/8 bg-white px-3 py-2 text-sm outline-none"
                                        onKeyDown={e => { if (e.key === "Enter") saveCash(u.id); if (e.key === "Escape") setEditCash(null); }}/>
                                      <button onClick={() => saveCash(u.id)} disabled={busy}
                                        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40">저장</button>
                                      <button onClick={() => setEditCash(null)}
                                        className="rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-bold text-[#666]">취소</button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-black text-[#171717]">{fmtKRW(Math.round(su.stockPortfolio.cash))}</p>
                                      <button onClick={() => { setEditCash({ userId: u.id, val: String(Math.round(su.stockPortfolio!.cash)) }); setTimeout(() => cashInputRef.current?.select(), 50); }}
                                        className="rounded-lg border border-black/8 bg-white px-3 py-1.5 text-xs font-bold text-[#444] hover:bg-[#f6f5f1] transition-colors">
                                        수정
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex gap-1.5 flex-wrap">
                                    {[500000, 1000000, 2000000, 5000000, 10000000].map(v => (
                                      <button key={v} onClick={() => setEditCash({ userId: u.id, val: String(v) })}
                                        className="rounded-lg bg-[#f6f5f1] px-2.5 py-1 text-[10px] font-bold text-[#555] hover:bg-black/8 transition-colors">
                                        {fmtKRW(v)}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* 탭: 보유종목 / 거래내역 */}
                                <div className="flex gap-1 rounded-xl bg-black/5 p-1">
                                  {([["portfolio","💼 보유종목"],["trades","📋 거래내역"]] as [StockTab, string][]).map(([v, label]) => (
                                    <button key={v} onClick={() => setStockTab(v)}
                                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${stockTab === v ? "bg-white text-[#171717] shadow-sm" : "text-[#888]"}`}>
                                      {label}
                                    </button>
                                  ))}
                                </div>

                                {/* 보유종목 */}
                                {stockTab === "portfolio" && (
                                  su.stockPortfolio.holdings.length === 0 ? (
                                    <p className="text-center text-xs text-[#bbb] py-3">보유 종목 없음</p>
                                  ) : su.stockPortfolio.holdings.map(h => {
                                    const cur = h.market === "KR" ? "KRW" : "USD";
                                    return (
                                      <div key={h.id} className="rounded-xl border border-black/5 bg-white/80 px-3 py-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <p className="text-xs font-bold text-[#171717] truncate">{h.name}</p>
                                              <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full shrink-0 ${h.market === "KR" ? "bg-blue-50 text-blue-400" : h.market === "ETF" ? "bg-purple-50 text-purple-400" : "bg-red-50 text-red-400"}`}>{h.market}</span>
                                            </div>
                                            <p className="text-[10px] text-[#aaa]">{h.quantity}주 · 평균 {cur === "KRW" ? Math.round(h.avgPrice).toLocaleString("ko-KR") + "원" : fmtUSD(h.avgPrice)}</p>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <p className="text-xs font-black text-[#171717]">{fmtKRW(Math.round(toKRW(h.avgPrice, cur, exRate) * h.quantity))}</p>
                                            <button onClick={() => deleteHolding(h.id, h.name)} disabled={busy}
                                              className="w-6 h-6 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40 text-[10px]">
                                              🗑
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}

                                {/* 거래내역 */}
                                {stockTab === "trades" && (
                                  su.stockTrades.length === 0 ? (
                                    <p className="text-center text-xs text-[#bbb] py-3">거래 내역 없음</p>
                                  ) : su.stockTrades.slice(0, 20).map(t => {
                                    const cur = t.market === "KR" ? "KRW" : "USD";
                                    const isBuy = t.type === "BUY";
                                    return (
                                      <div key={t.id} className="rounded-xl border border-black/5 bg-white/80 px-3 py-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${isBuy ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>{isBuy ? "매수" : "매도"}</span>
                                              <p className="text-xs font-bold text-[#171717] truncate">{t.name}</p>
                                            </div>
                                            <p className="text-[10px] text-[#aaa] mt-0.5">{t.quantity}주 · {cur === "KRW" ? Math.round(t.price).toLocaleString("ko-KR") + "원" : fmtUSD(t.price)} · {fmtDate(t.createdAt)}</p>
                                          </div>
                                          <p className={`text-xs font-black shrink-0 ${isBuy ? "text-red-500" : "text-blue-500"}`}>{isBuy ? "-" : "+"}{fmtKRW(Math.round(toKRW(t.total, cur, exRate)))}</p>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}

                                {/* 포트폴리오 초기화 */}
                                <button onClick={() => resetPortfolio(u.id)} disabled={busy}
                                  className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40">
                                  🔄 포트폴리오 전체 초기화
                                </button>
                              </>
                            )}
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[10px] text-[#ccc] pb-4">* 모든 변경사항은 즉시 적용됩니다</p>
      </div>
    </main>
  );
}
