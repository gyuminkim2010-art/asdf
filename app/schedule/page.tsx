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
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
  for (let day = 1; day <= lastDate; day++) cells.push({ day });
  while (cells.length % 7 !== 0) cells.push({ day: null });
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

const GLASS_SUBTLE = {
  background: "rgba(255,255,255,0.025)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.06)",
} as React.CSSProperties;

export default function SchedulePage() {
  const now = new Date();
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());

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

  const loadSchedule = async (school: string, targetYear = year, targetMonth = month) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("schoolName", school);
      params.set("year", String(targetYear));
      params.set("month", String(targetMonth));
      const res = await fetch(`/api/schedule?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) { setItems(data.schedules); setSchoolName(data.school || school); }
      else setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchedule("대아고등학교", year, month); }, []);

  const scheduleMap = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const item of items) {
      if (!map.has(item.date)) map.set(item.date, []);
      map.get(item.date)!.push(item);
    }
    return map;
  }, [items]);

  const selectedItems = useMemo(() => (!selectedDate ? [] : scheduleMap.get(selectedDate) || []), [selectedDate, scheduleMap]);
  const weeks = useMemo(() => getCalendarMatrix(year, month), [year, month]);

  const handlePrevMonth = async () => {
    const nextMonth = month === 1 ? 12 : month - 1;
    const nextYear = month === 1 ? year - 1 : year;
    setCalendarDirection(-1); setYear(nextYear); setMonth(nextMonth);
    await loadSchedule(schoolName, nextYear, nextMonth);
  };

  const handleNextMonth = async () => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    setCalendarDirection(1); setYear(nextYear); setMonth(nextMonth);
    await loadSchedule(schoolName, nextYear, nextMonth);
  };

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
    await loadSchedule(name, year, month);
  };

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 py-24 md:px-6 space-y-5">

        {/* Header */}
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
              <h1 className="text-[clamp(28px,5vw,44px)] font-black tracking-[-0.04em] text-white">학사일정</h1>
              <p className="text-[12px] text-white/35 mt-1">{schoolName}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchOpen((p) => !p)}
                className="rounded-full px-4 py-2.5 text-[12px] font-semibold text-white/45 hover:text-white/75 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                타학교 검색
              </button>
              <Link
                href="/"
                className="rounded-full px-4 py-2.5 text-[12px] font-semibold text-white/45 hover:text-white/75 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                메인화면
              </Link>
            </div>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectSchool(school.schoolName)}
                      className="block w-full rounded-xl px-4 py-3.5 text-left hover:-translate-y-0.5 transition-all"
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

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-6"
          style={GLASS}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

          <div className="flex items-center justify-between mb-5 gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevMonth}
              className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white/45 hover:text-white/75 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              ← 이전달
            </motion.button>
            <AnimatePresence mode="wait">
              <motion.h2
                key={`${year}-${month}`}
                initial={{ opacity: 0, y: calendarDirection > 0 ? 14 : -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: calendarDirection > 0 ? -14 : 14 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="text-[clamp(16px,3vw,22px)] font-black tracking-[-0.04em] text-white"
              >
                {getMonthLabel(year, month)}
              </motion.h2>
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextMonth}
              className="rounded-full px-4 py-2.5 text-[12px] font-bold text-white/45 hover:text-white/75 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              다음달 →
            </motion.button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((n) => (
                <motion.div
                  key={n}
                  animate={{ opacity: [0.25, 0.5, 0.25] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: n * 0.12 }}
                  className="grid grid-cols-7 rounded-2xl overflow-hidden"
                  style={GLASS_SUBTLE}
                >
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="min-h-[72px] md:min-h-[90px] p-2">
                      <div className="h-3 w-5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl" style={GLASS_SUBTLE}>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                  <div key={day} className="px-1 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: i === 0 ? "rgba(239,68,68,0.6)" : i === 6 ? "rgba(96,165,250,0.6)" : "rgba(255,255,255,0.22)" }}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${year}-${month}`}
                    initial={{ opacity: 0, x: calendarDirection > 0 ? 60 : -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: calendarDirection > 0 ? -60 : 60 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        {week.map((cell, cellIndex) => {
                          if (!cell.day) {
                            return <div key={cellIndex} className="min-h-[72px] md:min-h-[110px]" style={{ background: "rgba(0,0,0,0.08)" }} />;
                          }
                          const key = formatDateKey(year, month, cell.day);
                          const dayItems = scheduleMap.get(key) || [];
                          const isToday = key === todayKey;
                          const isSun = cellIndex === 0;
                          const isSat = cellIndex === 6;

                          return (
                            <motion.button
                              key={cellIndex}
                              initial={{ opacity: 0, scale: 0.92 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={dayItems.length > 0 ? { scale: 1.03, zIndex: 2 } : { backgroundColor: "rgba(255,255,255,0.025)" }}
                              whileTap={{ scale: 0.97 }}
                              transition={{ delay: weekIndex * 0.025 + cellIndex * 0.012, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                              onClick={() => dayItems.length > 0 && setSelectedDate(key)}
                              className="min-h-[72px] md:min-h-[110px] border-r last:border-r-0 p-2 md:p-2.5 text-left relative overflow-hidden"
                              style={{
                                borderColor: "rgba(255,255,255,0.04)",
                                background: isToday ? "rgba(139,92,246,0.12)" : dayItems.length > 0 ? "rgba(255,255,255,0.025)" : "transparent",
                                outline: isToday ? "1px solid rgba(139,92,246,0.3)" : undefined,
                                outlineOffset: "-1px",
                                cursor: dayItems.length > 0 ? "pointer" : "default",
                              }}
                            >
                              <p className="text-[11px] font-bold md:text-[13px]"
                                style={{ color: isToday ? "rgba(167,139,250,0.95)" : isSun ? "rgba(239,68,68,0.55)" : isSat ? "rgba(96,165,250,0.55)" : "rgba(255,255,255,0.55)" }}>
                                {cell.day}
                              </p>
                              {dayItems.length > 0 && (
                                <div className="mt-1.5 space-y-0.5">
                                  {dayItems.slice(0, 2).map((item, idx) => (
                                    <div key={idx}
                                      className="truncate rounded-full px-1.5 py-0.5 text-[8px] font-semibold md:rounded-lg md:px-2 md:py-0.5 md:text-[9px]"
                                      style={{ background: "rgba(139,92,246,0.2)", color: "rgba(167,139,250,0.85)" }}>
                                      {item.eventName}
                                    </div>
                                  ))}
                                  {dayItems.length > 2 && (
                                    <p className="text-[8px] text-white/25">+{dayItems.length - 2}개</p>
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
        </motion.div>
      </div>

      {/* Schedule detail modal */}
      <AnimatePresence>
        {selectedDate && selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl overflow-hidden rounded-3xl p-6"
              style={GLASS}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 mb-1">학사일정 상세</p>
                  <h3 className="text-[20px] font-black tracking-[-0.04em] text-white">
                    {selectedDate.slice(0, 4)}.{selectedDate.slice(4, 6)}.{selectedDate.slice(6, 8)}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="rounded-full px-4 py-2 text-[12px] font-semibold text-white/45 hover:text-white/75 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                >
                  닫기
                </button>
              </div>
              <div className="space-y-3">
                {selectedItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-2xl p-4"
                    style={GLASS_SUBTLE}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(139,92,246,0.8)" }} />
                      <p className="font-black text-white text-[15px] tracking-[-0.02em]">{item.eventName}</p>
                    </div>
                    {item.content ? (
                      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-[12px] leading-6 text-white/45 pl-3.5">{item.content}</pre>
                    ) : (
                      <p className="mt-2 text-[12px] text-white/28 pl-3.5">상세 내용이 등록되지 않았습니다.</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
