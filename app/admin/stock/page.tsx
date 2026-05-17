"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StockHanja = { id: number; character: string; meaning: string; reading: string };
type StockNewsQuestion = {
  id: number; newsTitle: string; newsExcerpt: string;
  question: string; answer: string;
  wrongAnswer1: string; wrongAnswer2: string; wrongAnswer3: string;
  source: string;
};

const TAB_LABELS = { hanja: "📈 주식 한자", news: "📰 뉴스 문제" } as const;
type Tab = keyof typeof TAB_LABELS;

export default function AdminStockPage() {
  const [tab, setTab] = useState<Tab>("hanja");

  // 한자
  const [hanjaList, setHanjaList] = useState<StockHanja[]>([]);
  const [character, setCharacter] = useState("");
  const [meaning, setMeaning] = useState("");
  const [reading, setReading] = useState("");
  const [bulkText, setBulkText] = useState("");

  // 뉴스 문제
  const [questions, setQuestions] = useState<StockNewsQuestion[]>([]);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsExcerpt, setNewsExcerpt] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [wrong1, setWrong1] = useState("");
  const [wrong2, setWrong2] = useState("");
  const [wrong3, setWrong3] = useState("");
  const [source, setSource] = useState("");

  const [saving, setSaving] = useState(false);

  const loadHanja = async () => {
    const res = await fetch("/api/stock-hanja", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setHanjaList(data.items);
  };

  const loadQuestions = async () => {
    const res = await fetch("/api/stock-news", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setQuestions(data.items);
  };

  useEffect(() => {
    loadHanja();
    loadQuestions();
  }, []);

  /* ── 한자 추가 ── */
  const handleAddHanja = async () => {
    if (!character.trim() || !meaning.trim() || !reading.trim()) {
      alert("한자, 뜻, 음을 모두 입력해 주세요."); return;
    }
    setSaving(true);
    const res = await fetch("/api/stock-hanja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character, meaning, reading }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) { alert(data.message); return; }
    setCharacter(""); setMeaning(""); setReading("");
    await loadHanja();
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) { alert("내용을 입력해 주세요."); return; }
    setSaving(true);
    let success = 0;
    for (const line of lines) {
      const parts = line.split(";;");
      if (parts.length < 3) continue;
      const [c, m, r] = parts.map(p => p.trim());
      const res = await fetch("/api/stock-hanja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: c, meaning: m, reading: r }),
      });
      if ((await res.json()).ok) success++;
    }
    setBulkText("");
    await loadHanja();
    setSaving(false);
    alert(`${success}개 한자가 추가되었습니다.`);
  };

  const handleDeleteHanja = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/stock-hanja/${id}`, { method: "DELETE" });
    await loadHanja();
  };

  /* ── 뉴스 문제 추가 ── */
  const handleAddQuestion = async () => {
    if (!newsTitle.trim() || !newsExcerpt.trim() || !question.trim() || !answer.trim() || !wrong1.trim() || !wrong2.trim() || !wrong3.trim()) {
      alert("모든 항목을 입력해 주세요."); return;
    }
    setSaving(true);
    const res = await fetch("/api/stock-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsTitle, newsExcerpt, question, answer, wrongAnswer1: wrong1, wrongAnswer2: wrong2, wrongAnswer3: wrong3, source }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) { alert(data.message); return; }
    setNewsTitle(""); setNewsExcerpt(""); setQuestion("");
    setAnswer(""); setWrong1(""); setWrong2(""); setWrong3(""); setSource("");
    await loadQuestions();
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await fetch(`/api/stock-news/${id}`, { method: "DELETE" });
    await loadQuestions();
  };

  const inputCls = "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#171717] placeholder:text-[#bbb] outline-none focus:border-[#171717] focus:ring-2 focus:ring-black/5 text-sm";

  return (
    <main className="min-h-screen bg-[#ecebe6] p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#d9e2db] blur-3xl opacity-60" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#dfdde8] blur-3xl opacity-60" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-5">
        {/* 헤더 */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">주식 퀴즈 관리</h1>
          <div className="flex gap-2">
            <Link href="/stock-quiz" className="rounded-2xl border border-black/8 bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#4d4d4d] backdrop-blur hover:bg-white/80 transition-colors">
              퀴즈 보기
            </Link>
            <Link href="/admin" className="rounded-2xl border border-black/8 bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#4d4d4d] backdrop-blur hover:bg-white/80 transition-colors">
              ← 관리자 홈
            </Link>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2">
          {(Object.entries(TAB_LABELS) as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition-colors ${
                tab === key
                  ? "bg-[#171717] text-white"
                  : "border border-black/8 bg-white/60 text-[#4d4d4d] hover:bg-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 주식 한자 탭 ── */}
        {tab === "hanja" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* 입력 */}
            <div className="space-y-4">
              <div className="rounded-[28px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur">
                <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] p-5 space-y-3">
                  <h2 className="font-extrabold text-[#171717]">한자 추가</h2>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#888] px-1">한자</p>
                    <input value={character} onChange={e => setCharacter(e.target.value)} placeholder="예: 株 (한 글자 또는 복합)" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#888] px-1">뜻</p>
                    <input value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="예: 그루 주, 주식" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#888] px-1">음</p>
                    <input value={reading} onChange={e => setReading(e.target.value)} placeholder="예: 주" className={inputCls} />
                  </div>
                  <button onClick={handleAddHanja} disabled={saving} className="w-full rounded-2xl bg-[#171717] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#333] transition-colors disabled:opacity-40">
                    한자 추가
                  </button>
                </div>
              </div>

              {/* 일괄 추가 */}
              <div className="rounded-[28px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur">
                <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] p-5 space-y-3">
                  <h2 className="font-extrabold text-[#171717]">여러 한자 한번에 추가</h2>
                  <p className="text-xs text-[#888] font-mono bg-white/60 rounded-xl px-3 py-2 leading-6">
                    형식: 한자;;뜻;;음<br />
                    株;;그루 주, 주식;;주<br />
                    債;;빚 채, 채권;;채
                  </p>
                  <textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={"株;;그루 주, 주식;;주\n債;;빚 채, 채권;;채"}
                    rows={6}
                    className={`${inputCls} font-mono`}
                  />
                  <button onClick={handleBulkAdd} disabled={saving} className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3.5 text-sm font-bold text-[#171717] hover:bg-[#f0f0f0] transition-colors disabled:opacity-40">
                    {saving ? "추가 중..." : "여러 한자 추가"}
                  </button>
                </div>
              </div>
            </div>

            {/* 목록 */}
            <div className="rounded-[28px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur">
              <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold text-[#171717]">등록된 한자</h2>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-[#666]">{hanjaList.length}개</span>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {hanjaList.length === 0 ? (
                    <p className="text-center text-sm text-[#aaa] py-8">아직 등록된 한자가 없습니다</p>
                  ) : hanjaList.map(item => (
                    <div key={item.id} className="rounded-2xl border border-black/5 bg-white/80 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl font-bold text-[#171717] shrink-0">{item.character}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#333] truncate">{item.meaning}</p>
                          <p className="text-xs text-[#888]">{item.reading}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteHanja(item.id)} className="shrink-0 rounded-xl bg-red-50 border border-red-100 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors">
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 뉴스 문제 탭 ── */}
        {tab === "news" && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* 입력 */}
            <div className="rounded-[28px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur">
              <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] p-5 space-y-3">
                <h2 className="font-extrabold text-[#171717]">뉴스 문제 추가</h2>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#888] px-1">뉴스 제목</p>
                  <input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="예: 코스피, 외국인 매수세에 2,600선 회복" className={inputCls} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#888] px-1">뉴스 발췌 (문제 지문)</p>
                  <textarea value={newsExcerpt} onChange={e => setNewsExcerpt(e.target.value)} placeholder="뉴스 본문 중 문제와 관련된 부분을 입력하세요." rows={4} className={inputCls} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#888] px-1">문제</p>
                  <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="예: 위 기사에서 '서킷브레이커'가 발동되는 조건은?" className={inputCls} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#888] px-1">✅ 정답</p>
                  <input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="정답" className={`${inputCls} border-emerald-200 focus:border-emerald-500`} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#888] px-1">❌ 오답 3개</p>
                  <input value={wrong1} onChange={e => setWrong1(e.target.value)} placeholder="오답 1" className={inputCls} />
                  <input value={wrong2} onChange={e => setWrong2(e.target.value)} placeholder="오답 2" className={inputCls} />
                  <input value={wrong3} onChange={e => setWrong3(e.target.value)} placeholder="오답 3" className={inputCls} />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[#888] px-1">출처 (선택)</p>
                  <input value={source} onChange={e => setSource(e.target.value)} placeholder="예: 한국경제, 2024.01.15" className={inputCls} />
                </div>

                <button onClick={handleAddQuestion} disabled={saving} className="w-full rounded-2xl bg-[#171717] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#333] transition-colors disabled:opacity-40">
                  {saving ? "추가 중..." : "문제 추가"}
                </button>
              </div>
            </div>

            {/* 목록 */}
            <div className="rounded-[28px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur">
              <div className="rounded-[22px] border border-black/5 bg-[#f6f5f1] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-extrabold text-[#171717]">등록된 문제</h2>
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-[#666]">{questions.length}개</span>
                </div>
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {questions.length === 0 ? (
                    <p className="text-center text-sm text-[#aaa] py-8">아직 등록된 문제가 없습니다</p>
                  ) : questions.map(q => (
                    <div key={q.id} className="rounded-2xl border border-black/5 bg-white/80 px-4 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[#171717] text-sm leading-snug">{q.newsTitle}</p>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="shrink-0 rounded-xl bg-red-50 border border-red-100 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors">
                          삭제
                        </button>
                      </div>
                      <p className="text-xs text-[#888] line-clamp-2 leading-relaxed">{q.newsExcerpt}</p>
                      <div className="rounded-xl bg-black/3 px-3 py-2">
                        <p className="text-xs font-semibold text-[#666]">Q. {q.question}</p>
                        <p className="text-xs text-emerald-600 font-semibold mt-1">정답: {q.answer}</p>
                      </div>
                      {q.source && <p className="text-[10px] text-[#bbb]">출처: {q.source}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
