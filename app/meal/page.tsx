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

  const fetchMeals = async (
    school: string,
    fromDate: Date,
    toDate: Date,
    append = false
  ) => {
    const params = new URLSearchParams();
    params.set("schoolName", school);
    params.set("from", toInputDate(fromDate));
    params.set("to", toInputDate(toDate));

    const res = await fetch(`/api/meal?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      if (!append) {
        setItems([]);
      }
      return 0;
    }

    const fetchedItems: MealItem[] = Array.isArray(data.meals) ? data.meals : [];
    setSchoolName(data.school || school);

    setItems((prev) => {
      const merged = append ? [...prev, ...fetchedItems] : fetchedItems;

      const uniqueMap = new Map<string, MealItem>();
      for (const item of merged) {
        uniqueMap.set(`${item.date}-${item.mealType}-${item.dish}`, item);
      }

      return Array.from(uniqueMap.values()).sort((a, b) => {
        if (a.date === b.date) {
          return getMealOrder(a.mealType) - getMealOrder(b.mealType);
        }
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

      try {
        const count = await fetchMeals(schoolName, base, end, false);
        setHasMore(count > 0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const groupedMeals = useMemo(() => {
    const map = new Map<string, MealItem[]>();

    for (const item of items) {
      if (!map.has(item.date)) {
        map.set(item.date, []);
      }
      map.get(item.date)!.push(item);
    }

    return Array.from(map.entries());
  }, [items]);

  const baseDateKey = inputDateToKey(selectedDate);

  const todayGroup = useMemo(() => {
    return groupedMeals.find(([date]) => date === baseDateKey) ?? null;
  }, [groupedMeals, baseDateKey]);

  const futureGroups = useMemo(() => {
    return groupedMeals.filter(([date]) => date > baseDateKey);
  }, [groupedMeals, baseDateKey]);

  const handleSearchSchool = async () => {
    if (!searchName.trim()) return;

    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/school-search?schoolName=${encodeURIComponent(searchName)}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (res.ok && data.ok) {
        setSearchResults(data.schools);
      } else {
        setSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSchool = async (name: string) => {
    setSearchOpen(false);
    setSearchResults([]);
    setSearchName("");
    setSchoolName(name);

    const base = new Date(selectedDate);
    const end = addDays(base, 6);

    setRangeEnd(end);
    setHasMore(true);
    setLoading(true);

    try {
      const count = await fetchMeals(name, base, end, false);
      setHasMore(count > 0);
    } finally {
      setLoading(false);
    }
  };

  const handleDateApply = async () => {
    const base = new Date(selectedDate);
    const end = addDays(base, 6);

    setRangeEnd(end);
    setHasMore(true);
    setLoading(true);

    try {
      const count = await fetchMeals(schoolName, base, end, false);
      setHasMore(count > 0);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMeals = async () => {
    if (lockRef.current || !hasMore) return;

    lockRef.current = true;
    setLoadingMore(true);

    try {
      const nextStart = addDays(rangeEnd, 1);
      const nextEnd = addDays(nextStart, 6);

      const count = await fetchMeals(schoolName, nextStart, nextEnd, true);

      if (count === 0) {
        setHasMore(false);
      } else {
        setRangeEnd(nextEnd);
      }
    } finally {
      setLoadingMore(false);
      lockRef.current = false;
    }
  };

  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && !loadingMore && hasMore) {
          await loadMoreMeals();
        }
      },
      {
        root: null,
        rootMargin: "420px",
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, rangeEnd, schoolName]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 100, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 1.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="min-h-screen bg-[#ecebe6] text-[#171717]"
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1.1,
            delay: 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-6 rounded-[32px] border border-black/5 bg-white/60 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.05)] backdrop-blur"
        >
          <div className="rounded-[26px] border border-black/5 bg-[#f7f6f2] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-[#7a7a7a]">School Life</p>
                <h1 className="text-3xl font-extrabold">급식 정보</h1>
                <p className="mt-1 text-sm text-[#666]">{schoolName}</p>
              </div>

              <Link
                href="/"
                className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold text-[#444] shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-[#fbfbf9]"
              >
                메인화면으로 이동
              </Link>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto]">
              <button
                onClick={() => setSearchOpen((prev) => !prev)}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-left text-sm font-semibold text-[#444] transition-all duration-500 hover:-translate-y-1 hover:bg-[#fbfbf9]"
              >
                타학교 검색
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-[#171717] outline-none"
              />

              <button
                onClick={handleDateApply}
                className="rounded-2xl bg-[#171717] px-5 py-3 text-sm font-bold text-white transition-all duration-500 hover:-translate-y-1 hover:bg-[#222222]"
              >
                날짜 적용
              </button>
            </div>

            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-4 rounded-[22px] border border-black/5 bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="학교 이름 입력"
                    className="flex-1 rounded-2xl border border-black/5 bg-[#fafafa] px-4 py-3 outline-none"
                  />
                  <button
                    onClick={handleSearchSchool}
                    className="rounded-2xl bg-[#171717] px-5 py-3 text-sm font-bold text-white transition-all duration-500 hover:-translate-y-1 hover:bg-[#222222]"
                  >
                    검색
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {searchLoading ? (
                    <p className="text-sm text-[#666]">학교를 찾는 중입니다...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-[#777]">
                      학교 이름을 입력한 뒤 검색해 주세요.
                    </p>
                  ) : (
                    searchResults.map((school, index) => (
                      <motion.button
                        key={`${school.schoolCode}-${index}`}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.06,
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={() => handleSelectSchool(school.schoolName)}
                        className="block w-full rounded-2xl border border-black/5 bg-[#fafafa] px-4 py-4 text-left transition-all duration-500 hover:-translate-y-1"
                      >
                        <p className="font-bold text-[#171717]">
                          {school.schoolName}
                        </p>
                        <p className="mt-1 text-sm text-[#666]">
                          {school.schoolType}
                          {school.address ? ` · ${school.address}` : ""}
                        </p>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>

        <div className="space-y-6">
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="rounded-[28px] border border-black/5 bg-white/65 p-6 text-center shadow-sm"
            >
              <p className="text-[#666]">급식 정보를 불러오는 중입니다...</p>
            </motion.div>
          ) : (
            <>
              {todayGroup ? (
                <motion.section
                  initial={{ opacity: 0, y: 75, scale: 0.965 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 1.15,
                    delay: 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-[30px] border border-black/5 bg-white/65 p-4 shadow-[0_10px_34px_rgba(0,0,0,0.04)]"
                >
                  <div className="rounded-[24px] border border-black/5 bg-[#f7f6f2] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-2xl font-extrabold">
                        {formatDateLabel(todayGroup[0])}
                      </h2>
                      <span className="rounded-2xl bg-white px-3 py-2 text-sm font-bold text-[#555] border border-black/5">
                        오늘 급식
                      </span>
                    </div>

                    <div className="space-y-4">
                      {todayGroup[1].map((meal, mealIndex) => (
                        <motion.div
                          key={`${meal.date}-${meal.mealType}-${mealIndex}`}
                          initial={{ opacity: 0, y: 34, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: 0.28 + mealIndex * 0.08,
                            duration: 0.75,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="rounded-[22px] border border-black/5 bg-white p-4"
                        >
                          <p className="text-sm font-bold text-[#6a6a6a]">
                            {meal.mealType}
                          </p>

                          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#1f1f1f]">
                            {meal.dish}
                          </pre>

                          {meal.calorie && (
                            <p className="mt-4 text-sm text-[#666]">
                              칼로리: {meal.calorie}
                            </p>
                          )}

                          {meal.origin && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-[#555]">
                                원산지 보기
                              </summary>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#666]">
                                {meal.origin}
                              </pre>
                            </details>
                          )}

                          {meal.nutrition && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-[#555]">
                                영양 정보 보기
                              </summary>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#666]">
                                {meal.nutrition}
                              </pre>
                            </details>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-[28px] border border-black/5 bg-white/65 p-6 text-center shadow-sm"
                >
                  <p className="text-lg font-bold">오늘 급식 정보가 없습니다</p>
                  <p className="mt-2 text-sm text-[#777]">
                    선택한 날짜 기준 첫 화면에 표시할 급식이 없습니다.
                  </p>
                </motion.div>
              )}

              {futureGroups.length > 0 && (
                <div className="pt-2">
                  <p className="mb-4 text-sm font-semibold text-[#7a7a7a]">
                    아래로 스크롤 ↓
                  </p>
                </div>
              )}

              {futureGroups.map(([date, meals], index) => (
                <motion.section
                  key={date}
                  initial={{ opacity: 0, y: 95, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{
                    type: "spring",
                    stiffness: 60,
                    damping: 15,
                    mass: 1.05,
                    delay: index * 0.04,
                  }}
                  className="rounded-[30px] border border-black/5 bg-white/65 p-4 shadow-[0_10px_34px_rgba(0,0,0,0.04)]"
                >
                  <div className="rounded-[24px] border border-black/5 bg-[#f7f6f2] p-5">
                    <h2 className="text-2xl font-extrabold">
                      {formatDateLabel(date)}
                    </h2>

                    <div className="mt-4 space-y-4">
                      {meals.map((meal, mealIndex) => (
                        <motion.div
                          key={`${meal.date}-${meal.mealType}-${mealIndex}`}
                          initial={{ opacity: 0, y: 42, scale: 0.975 }}
                          whileInView={{ opacity: 1, y: 0, scale: 1 }}
                          viewport={{ once: true, amount: 0.22 }}
                          transition={{
                            type: "spring",
                            stiffness: 66,
                            damping: 15,
                            mass: 1.02,
                            delay: mealIndex * 0.06,
                          }}
                          className="rounded-[22px] border border-black/5 bg-white p-4"
                        >
                          <p className="text-sm font-bold text-[#6a6a6a]">
                            {meal.mealType}
                          </p>

                          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#1f1f1f]">
                            {meal.dish}
                          </pre>

                          {meal.calorie && (
                            <p className="mt-4 text-sm text-[#666]">
                              칼로리: {meal.calorie}
                            </p>
                          )}

                          {meal.origin && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-[#555]">
                                원산지 보기
                              </summary>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#666]">
                                {meal.origin}
                              </pre>
                            </details>
                          )}

                          {meal.nutrition && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm font-semibold text-[#555]">
                                영양 정보 보기
                              </summary>
                              <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#666]">
                                {meal.nutrition}
                              </pre>
                            </details>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              ))}

              {!todayGroup && futureGroups.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-[28px] border border-black/5 bg-white/65 p-6 text-center shadow-sm"
                >
                  <p className="text-lg font-bold">급식 정보가 없습니다</p>
                  <p className="mt-2 text-sm text-[#777]">
                    해당 기간에 등록된 급식이 없을 수 있습니다.
                  </p>
                </motion.div>
              )}
            </>
          )}

          <div ref={observerRef} className="h-12" />

          {loadingMore && hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pb-10 text-center text-sm text-[#777]"
            >
              다음 급식 정보를 불러오는 중입니다...
            </motion.div>
          )}

          {!loading && !loadingMore && !hasMore && items.length > 0 && (
            <div className="pb-12 text-center text-sm text-[#888]">
              마지막 페이지입니다.
            </div>
          )}
        </div>
      </div>
    </motion.main>
  );
}