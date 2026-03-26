"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type ScheduleItem = {
  date: string;
  eventName: string;
  content: string;
  schoolName: string;
};

type SchoolSearchItem = {
  schoolName: string;
  atptCode: string;
  schoolCode: string;
  schoolType: string;
  address: string;
};

function getMonthLabel(year: number, month: number) {
  return `${year}년 ${month}월`;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
}

function getCalendarMatrix(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: Array<{ day: number | null }> = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: null });
  }

  for (let day = 1; day <= lastDate; day++) {
    cells.push({ day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export default function SchedulePage() {
  const now = new Date();
  const todayKey = formatDateKey(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );

  const [schoolName, setSchoolName] = useState("대아고등학교");
  const [searchName, setSearchName] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SchoolSearchItem[]>([]);

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarDirection, setCalendarDirection] = useState<1 | -1>(1);

  const loadSchedule = async (
    school: string,
    targetYear = year,
    targetMonth = month
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("schoolName", school);
      params.set("year", String(targetYear));
      params.set("month", String(targetMonth));

      const res = await fetch(`/api/schedule?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setItems(data.schedules);
        setSchoolName(data.school || school);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule("대아고등학교", year, month);
  }, []);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();

    for (const item of items) {
      if (!map.has(item.date)) {
        map.set(item.date, []);
      }
      map.get(item.date)!.push(item);
    }

    return map;
  }, [items]);

  const selectedItems = useMemo(() => {
    if (!selectedDate) return [];
    return scheduleMap.get(selectedDate) || [];
  }, [selectedDate, scheduleMap]);

  const weeks = useMemo(() => getCalendarMatrix(year, month), [year, month]);

  const handlePrevMonth = async () => {
    const nextMonth = month === 1 ? 12 : month - 1;
    const nextYear = month === 1 ? year - 1 : year;

    setCalendarDirection(-1);
    setYear(nextYear);
    setMonth(nextMonth);
    await loadSchedule(schoolName, nextYear, nextMonth);
  };

  const handleNextMonth = async () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    setCalendarDirection(1);
    setYear(nextYear);
    setMonth(nextMonth);
    await loadSchedule(schoolName, nextYear, nextMonth);
  };

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
    await loadSchedule(name, year, month);
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 90, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 1.15,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="min-h-screen bg-[#ecebe6] text-[#171717]"
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 45, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1,
            delay: 0.14,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-6 rounded-[32px] border border-black/5 bg-white/60 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.05)] backdrop-blur"
        >
          <div className="rounded-[26px] border border-black/5 bg-[#f7f6f2] p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-[#7a7a7a]">School Life</p>
                <h1 className="text-3xl font-extrabold">학사일정</h1>
                <p className="mt-1 text-sm text-[#666]">{schoolName}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSearchOpen((prev) => !prev)}
                  className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold text-[#444] shadow-sm transition-all duration-500 hover:-translate-y-1"
                >
                  타학교 검색
                </button>

                <Link
                  href="/"
                  className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm font-semibold text-[#444] shadow-sm transition-all duration-500 hover:-translate-y-1"
                >
                  메인화면으로 이동
                </Link>
              </div>
            </div>

            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.55,
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
                    className="rounded-2xl bg-[#171717] px-5 py-3 text-sm font-bold text-white transition-all duration-500 hover:-translate-y-1"
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
                          delay: index * 0.05,
                          duration: 0.5,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        onClick={() => handleSelectSchool(school.schoolName)}
                        className="block w-full rounded-2xl border border-black/5 bg-[#fafafa] px-4 py-4 text-left transition-all duration-500 hover:-translate-y-1"
                      >
                        <p className="font-bold text-[#171717]">{school.schoolName}</p>
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

        <motion.section
          initial={{ opacity: 0, y: 55, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1.05,
            delay: 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="rounded-[32px] border border-black/5 bg-white/60 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
        >
          <div className="rounded-[26px] border border-black/5 bg-[#f7f6f2] p-5">
            <div className="mb-4 flex items-center justify-between gap-2 md:mb-5">
              <button
                onClick={handlePrevMonth}
                className="rounded-2xl border border-black/5 bg-white px-3 py-2 text-sm font-bold text-[#444] transition-all duration-500 hover:-translate-y-1 md:px-4 md:py-3"
              >
                ← 이전달
              </button>

              <h2 className="text-xl font-extrabold tracking-[-0.03em] sm:text-2xl">
                {getMonthLabel(year, month)}
              </h2>

              <button
                onClick={handleNextMonth}
                className="rounded-2xl border border-black/5 bg-white px-3 py-2 text-sm font-bold text-[#444] transition-all duration-500 hover:-translate-y-1 md:px-4 md:py-3"
              >
                다음달 →
              </button>
            </div>

            {loading ? (
              <div className="rounded-[24px] border border-black/5 bg-white p-6 text-center">
                <p className="text-[#666]">학사일정을 불러오는 중입니다...</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white">
                <div className="grid grid-cols-7 border-b border-black/5 bg-[#faf9f5]">
                  {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                    <div
                      key={day}
                      className="px-1 py-2 text-center text-xs font-bold text-[#666] md:px-3 md:py-3 md:text-sm"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${year}-${month}`}
                      initial={{
                        opacity: 0,
                        x: calendarDirection > 0 ? 70 : -70,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        x: calendarDirection > 0 ? -70 : 70,
                      }}
                      transition={{
                        duration: 0.45,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {weeks.map((week, weekIndex) => (
                        <div
                          key={weekIndex}
                          className="grid grid-cols-7 border-b last:border-b-0 border-black/5"
                        >
                          {week.map((cell, cellIndex) => {
                            if (!cell.day) {
                              return (
                                <div
                                  key={cellIndex}
                                  className="min-h-[80px] md:min-h-[120px] bg-[#fcfcfa]"
                                />
                              );
                            }

                            const key = formatDateKey(year, month, cell.day);
                            const dayItems = scheduleMap.get(key) || [];
                            const isToday = key === todayKey;

                            return (
                              <motion.button
                                key={cellIndex}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: weekIndex * 0.025 + cellIndex * 0.012,
                                  duration: 0.38,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                onClick={() => dayItems.length > 0 && setSelectedDate(key)}
                                className={`min-h-[72px] border-r last:border-r-0 border-black/5 p-2 text-left transition-all duration-500 hover:bg-[#faf9f5] md:min-h-[120px] md:p-3 ${
                                  isToday
                                    ? "bg-[#f3f0e8] ring-1 ring-inset ring-[#bfb7a7]"
                                    : "bg-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <p className="text-[11px] font-bold text-[#222] md:text-sm">
                                    {cell.day}
                                  </p>

                              </div>

                                {dayItems.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {dayItems.slice(0, 1).map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="truncate rounded-full bg-[#efede6] px-1.5 py-[2px] text-[9px] font-semibold text-[#666] md:rounded-xl md:px-2 md:py-1 md:text-xs"
                                      >
                                        {item.eventName}
                                      </div>
                                    ))}

                                    {dayItems.length > 2 && (
                                      <p className="text-xs text-[#777]">
                                        +{dayItems.length - 2}개 더보기
                                      </p>
                                    )}
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {selectedDate && selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-[30px] border border-black/5 bg-[#f7f6f2] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.14)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#777]">학사일정 상세</p>
                  <h3 className="text-2xl font-extrabold">
                    {selectedDate.slice(0, 4)}.{selectedDate.slice(4, 6)}.{selectedDate.slice(6, 8)}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedDate(null)}
                  className="rounded-2xl border border-black/5 bg-white px-4 py-2 text-sm font-bold text-[#444]"
                >
                  닫기
                </button>
              </div>

              <div className="space-y-4">
                {selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[22px] border border-black/5 bg-white p-4"
                  >
                    <p className="text-lg font-extrabold text-[#171717]">
                      {item.eventName}
                    </p>

                    {item.content ? (
                      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-[#555]">
                        {item.content}
                      </pre>
                    ) : (
                      <p className="mt-3 text-sm text-[#777]">
                        상세 내용이 등록되지 않았습니다.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}