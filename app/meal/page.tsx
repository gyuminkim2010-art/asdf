"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type MealItem = {
  date: string;
  mealType: string;
  dish: string;
  calorie: string;
  nutrition: string;
  origin: string;
};

type SchoolSearchItem = {
  schoolName: string;
  atptCode: string;
  schoolCode: string;
  schoolType: string;
  address: string;
};

function toInputDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function inputDateToKey(value: string) {
  return value.replace(/-/g, "");
}

function formatDateLabel(value: string) {
  if (value.length !== 8) return value;
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getMealOrder(mealType: string) {
  if (mealType.includes("조식")) return 0;
  if (mealType.includes("중식")) return 1;
  if (mealType.includes("석식")) return 2;
  return 99;
}

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

const GLASS_SUBTLE = {
  background: "rgba(255,255,255,0.025)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.06)",
} as React.CSSProperties;

const INPUT_STYLE = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "rgba(255,255,255,0.75)",
} as React.CSSProperties;

export default function MealPage() {
  const [schoolName, setSchoolName] = useState("대아고등학교");
  const [searchName, setSearchName] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SchoolSearchItem[]>([]);

  const [selectedDate, setSelectedDate] = useState(toInputDate(new Date()));
  const [items, setItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [rangeEnd, setRangeEnd] = useState(addDays(new Date(), 6));

  const observerRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef(false);

  const fetchMeals = async (school: string, fromDate: Date, toDate: Date, append = false) => {
    const params = new URLSearchParams();
    params.set("schoolName", school);
    params.set("from", toInputDate(fromDate));
    params.set("to", toInputDate(toDate));
    const res = await fetch(`/api/meal?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || !data.ok) { if (!append) setItems([]); return 0; }
    const fetchedItems: MealItem[] = Array.isArray(data.meals) ? data.meals : [];
    setSchoolName(data.school || school);
    setItems((prev) => {
      const merged = append ? [...prev, ...fetchedItems] : fetchedItems;
      const uniqueMap = new Map<string, MealItem>();
      for (const item of merged) uniqueMap.set(`${item.date}-${item.mealType}-${item.dish}`, item);
      return Array.from(uniqueMap.values()).sort((a, b) => {
        if (a.date === b.date) return getMealOrder(a.mealType) - getMealOrder(b.mealType);
        return a.date.localeCompare(b.date);
      });
    });
    return fetchedItems.length;
  };

  useEffect(() => {
    const load = async () => {
      const base = new Date(selectedDate);
      const end = addDays(base, 6);
      setRangeEnd(end);
      setHasMore(true);
      setLoading(true);
      try { const count = await fetchMeals(schoolName, base, end, false); setHasMore(count > 0); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const groupedMeals = useMemo(() => {
    const map = new Map<string, MealItem[]>();
    for (const item of items) {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const baseDateKey = inputDateToKey(selectedDate);
  const todayGroup = useMemo(() => groupedMeals.find(([date]) => date === baseDateKey) ?? null, [groupedMeals, baseDateKey]);
  const futureGroups = useMemo(() => groupedMeals.filter(([date]) => date > baseDateKey), [groupedMeals, baseDateKey]);

  const handleSearchSchool = async () => {
    if (!searchName.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/school-search?schoolName=${encodeURIComponent(searchName)}`, { cache: "no-store" });
      const data = await res.json();
      setSearchResults(res.ok && data.ok ? data.schools : []);
    } finally { setSearchLoading(false); }
  };

  const handleSelectSchool = async (name: string) => {
    setSearchOpen(false); setSearchResults([]); setSearchName(""); setSchoolName(name);
    const base = new Date(selectedDate);
    const end = addDays(base, 6);
    setRangeEnd(end); setHasMore(true); setLoading(true);
    try { const count = await fetchMeals(name, base, end, false); setHasMore(count > 0); }
    finally { setLoading(false); }
  };

  const handleDateApply = async () => {
    const base = new Date(selectedDate);
    const end = addDays(base, 6);
    setRangeEnd(end); setHasMore(true); setLoading(true);
    try { const count = await fetchMeals(schoolName, base, end, false); setHasMore(count > 0); }
    finally { setLoading(false); }
  };

  const loadMoreMeals = async () => {
    if (lockRef.current || !hasMore) return;
    lockRef.current = true; setLoadingMore(true);
    try {
      const nextStart = addDays(rangeEnd, 1);
      const nextEnd = addDays(nextStart, 6);
      const count = await fetchMeals(schoolName, nextStart, nextEnd, true);
      if (count === 0) setHasMore(false); else setRangeEnd(nextEnd);
    } finally { setLoadingMore(false); lockRef.current = false; }
  };

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) await loadMoreMeals();
      },
      { root: null, rootMargin: "420px", threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, rangeEnd, schoolName]);

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-4 py-24 md:px-6 space-y-5">

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={GLASS}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/28 mb-1">School Life</p>
              <h1 className="text-[clamp(28px,5vw,44px)] font-black tracking-[-0.04em] text-white">급식 정보</h1>
              <p className="text-[12px] text-white/35 mt-1">{schoolName}</p>
            </div>
            <Link
              href="/"
              className="shrink-0 rounded-full px-5 py-2.5 text-[12px] font-semibold text-white/45 hover:text-white/75 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              메인화면 →
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto]">
            <button
              onClick={() => setSearchOpen((p) => !p)}
              className="rounded-2xl px-4 py-3 text-left text-[13px] font-semibold text-white/55 hover:text-white/80 transition-colors"
              style={INPUT_STYLE}
            >
              타학교 검색
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-2xl px-4 py-3 text-[13px] outline-none"
              style={INPUT_STYLE}
            />
            <button
              onClick={handleDateApply}
              className="rounded-2xl bg-white px-5 py-3 text-[12px] font-bold text-black hover:bg-white/90 transition-colors"
              style={{ boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
            >
              날짜 적용
            </button>
          </div>

          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 rounded-2xl p-4"
              style={GLASS_SUBTLE}
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="학교 이름 입력"
                  className="flex-1 rounded-xl px-4 py-3 text-[13px] text-white/75 placeholder:text-white/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
                <button
                  onClick={handleSearchSchool}
                  className="rounded-xl bg-white px-5 py-3 text-[12px] font-bold text-black hover:bg-white/90 transition-colors"
                >
                  검색
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {searchLoading ? (
                  <p className="text-[12px] text-white/35">학교를 찾는 중입니다...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-[12px] text-white/28">학교 이름을 입력한 뒤 검색해 주세요.</p>
                ) : (
                  searchResults.map((school, index) => (
                    <motion.button
                      key={`${school.schoolCode}-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => handleSelectSchool(school.schoolName)}
                      className="block w-full rounded-xl px-4 py-3.5 text-left hover:-translate-y-0.5 transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <p className="font-bold text-white text-[13px]">{school.schoolName}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{school.schoolType}{school.address ? ` · ${school.address}` : ""}</p>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Meal content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: [0.3, 0.55, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: n * 0.15 }}
                className="relative overflow-hidden rounded-3xl p-6"
                style={GLASS_SUBTLE}
              >
                <div className="h-4 w-28 rounded-full mb-5" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="space-y-2.5">
                  {[80, 65, 90, 55].map((w, i) => (
                    <div key={i} className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.05)", width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            {todayGroup ? (
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl p-6"
                style={GLASS}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <motion.div
                  className="absolute -inset-px rounded-3xl pointer-events-none"
                  animate={{ opacity: [0, 0.35, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(59,130,246,0.18), transparent 55%)" }}
                />
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <h2 className="text-[22px] font-black tracking-[-0.04em] text-white">
                    {formatDateLabel(todayGroup[0])}
                  </h2>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 18 }}
                    className="rounded-full px-3 py-1.5 text-[10px] font-bold text-emerald-400/85"
                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    ✦ 오늘 급식
                  </motion.span>
                </div>
                <div className="space-y-3 relative z-10">
                  {todayGroup[1].map((meal, i) => (
                    <motion.div
                      key={`${meal.date}-${meal.mealType}-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-2xl p-4 cursor-default"
                      style={{ ...GLASS_SUBTLE, transition: "box-shadow 0.3s" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">{meal.mealType}</p>
                        {meal.calorie && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 260, damping: 18 }}
                            className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                            style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.22)", color: "rgba(251,191,36,0.85)" }}
                          >
                            🔥 {meal.calorie}
                          </motion.span>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-7 text-white/70">{meal.dish}</pre>
                      {meal.origin && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-[11px] font-semibold text-white/30 hover:text-white/55 transition-colors">원산지 보기</summary>
                          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-6 text-white/28">{meal.origin}</pre>
                        </details>
                      )}
                      {meal.nutrition && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[11px] font-semibold text-white/30 hover:text-white/55 transition-colors">영양 정보 보기</summary>
                          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-6 text-white/28">{meal.nutrition}</pre>
                        </details>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="rounded-3xl p-8 text-center" style={GLASS_SUBTLE}>
                <p className="font-bold text-white/55">오늘 급식 정보가 없습니다</p>
                <p className="text-[12px] text-white/25 mt-1">선택한 날짜 기준 첫 화면에 표시할 급식이 없습니다.</p>
              </div>
            )}

            {futureGroups.map(([date, meals], index) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.65, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl p-6 group"
                style={GLASS_SUBTLE}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 20% 20%, rgba(139,92,246,0.05), transparent 65%)" }}
                />
                <h2 className="text-[18px] font-black tracking-[-0.03em] text-white mb-4 relative z-10">{formatDateLabel(date)}</h2>
                <div className="space-y-3 relative z-10">
                  {meals.map((meal, i) => (
                    <motion.div
                      key={`${meal.date}-${meal.mealType}-${i}`}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={{ x: 4 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-2xl p-4"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/25">{meal.mealType}</p>
                        {meal.calorie && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                            style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)", color: "rgba(251,191,36,0.6)" }}
                          >
                            🔥 {meal.calorie}
                          </span>
                        )}
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-7 text-white/60">{meal.dish}</pre>
                      {meal.origin && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[11px] font-semibold text-white/25 hover:text-white/50 transition-colors">원산지 보기</summary>
                          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-6 text-white/22">{meal.origin}</pre>
                        </details>
                      )}
                      {meal.nutrition && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[11px] font-semibold text-white/25 hover:text-white/50 transition-colors">영양 정보 보기</summary>
                          <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[11px] leading-6 text-white/22">{meal.nutrition}</pre>
                        </details>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}

            {!todayGroup && futureGroups.length === 0 && (
              <div className="rounded-3xl p-8 text-center" style={GLASS_SUBTLE}>
                <p className="font-bold text-white/55">급식 정보가 없습니다</p>
                <p className="text-[12px] text-white/25 mt-1">해당 기간에 등록된 급식이 없을 수 있습니다.</p>
              </div>
            )}
          </>
        )}

        <div ref={observerRef} className="h-12" />
        {loadingMore && hasMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 text-center text-[12px] text-white/28">
            다음 급식 정보를 불러오는 중입니다...
          </motion.div>
        )}
        {!loading && !loadingMore && !hasMore && items.length > 0 && (
          <div className="pb-12 text-center text-[12px] text-white/22">마지막 페이지입니다.</div>
        )}
      </div>
    </main>
  );
}
