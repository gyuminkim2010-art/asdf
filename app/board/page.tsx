"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

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

export default function BoardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("전체 학년");
  const [selectedSubject, setSelectedSubject] = useState("전체 과목");

  const subjectsByGrade: { [key: string]: string[] } = {
    "전체 학년": ["전체 과목"],
    "1학년": ["전체 과목", "공통 국어", "공통 수학", "공통 영어", "한국사", "통합사회", "통합과학"],
    "2학년": ["전체 과목", "문학", "독서", "수학Ⅰ", "수학Ⅱ", "영어Ⅰ", "영어Ⅱ", "물리Ⅰ", "화학Ⅰ", "생명과학Ⅰ", "지구과학Ⅰ", "세계사", "윤리와 사상"],
    "3학년": ["전체 과목", "화법과 작문", "언어와 매체", "미적분", "확률과 통계", "기하", "영어 독해와 작문", "물리Ⅱ", "화학Ⅱ", "사회·문화", "경제"],
  };

  useEffect(() => {
    const savedUser = Cookies.get("user_session");
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchPosts();
  }, []);

  useEffect(() => { setSelectedSubject("전체 과목"); }, [selectedGrade]);

  useEffect(() => {
    let result = posts;
    if (selectedGrade !== "전체 학년") result = result.filter((p) => p.grade === selectedGrade);
    if (selectedSubject !== "전체 과목") result = result.filter((p) => p.subject === selectedSubject);
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(lower) || p.content.toLowerCase().includes(lower));
    }
    setFilteredPosts(result);
  }, [searchTerm, selectedGrade, selectedSubject, posts]);

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data);
    setFilteredPosts(data);
  };

  const handleLogout = () => {
    Cookies.remove("user_session", { path: "/" });
    window.location.reload();
  };

  const selectStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    color: "rgba(255,255,255,0.65)",
  } as React.CSSProperties;

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto max-w-5xl px-4 py-24 md:px-6 space-y-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/30 mb-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              학습자료 공유
            </div>
            <h1
              className="text-[clamp(32px,6vw,56px)] font-black tracking-[-0.05em] leading-none"
              style={{
                background: "linear-gradient(175deg, #ffffff 15%, rgba(255,255,255,0.6) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Study Archive
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                <div
                  className="hidden sm:flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {(user.userName || "U").charAt(0)}
                  </div>
                  <span className="text-white/65 font-semibold">{user.userName}님</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full px-4 py-2.5 text-[12px] font-semibold text-red-400/70 hover:text-red-300 transition-colors"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full px-5 py-2.5 text-[12px] font-bold text-white hover:bg-white/10 transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                로그인
              </Link>
            )}
            <Link
              href="/write"
              className="rounded-full bg-white px-5 py-2.5 text-[12px] font-bold text-black hover:bg-white/90 transition-colors"
              style={{ boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
            >
              글쓰기
            </Link>
            <Link
              href="/"
              className="rounded-full px-4 py-2.5 text-[12px] font-semibold text-white/40 hover:text-white/65 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              ← 홈
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl p-4 flex flex-col md:flex-row gap-3"
          style={GLASS_SUBTLE}
        >
          <div className="flex gap-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-[12px] font-semibold outline-none min-w-[110px]"
              style={selectStyle}
            >
              {Object.keys(subjectsByGrade).map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-[12px] font-semibold outline-none min-w-[130px]"
              style={selectStyle}
            >
              {subjectsByGrade[selectedGrade].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <input
            type="text"
            placeholder="찾고 싶은 키워드를 입력하세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-xl px-4 py-2.5 text-[12px] text-white/70 placeholder:text-white/20 outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          />
          <div className="flex items-center text-[11px] font-bold text-white/25 px-2 whitespace-nowrap">
            {filteredPosts.length}개
          </div>
        </motion.div>

        {/* Post grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/board/${post.id}`)}
                className="group relative overflow-hidden rounded-3xl p-6 cursor-pointer flex flex-col justify-between min-h-[240px]"
                style={GLASS}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.12), transparent 60%)" }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
                />

                <div className="relative z-10">
                  <div className="flex gap-2 mb-4">
                    <span
                      className="rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em]"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}
                    >
                      {post.grade}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em]"
                      style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", color: "rgba(96,165,250,0.85)" }}
                    >
                      {post.subject}
                    </span>
                  </div>
                  <h2 className="text-[18px] font-black tracking-[-0.03em] text-white mb-2 line-clamp-1">{post.title}</h2>
                  <p className="text-[12px] text-white/35 leading-relaxed line-clamp-2">{post.content}</p>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold text-white/22 border-t pt-3.5 mt-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <span>{post.authorName} · {post.date}</span>
                  {post.fileName && <span className="text-blue-400/60 font-bold">📁 첨부파일</span>}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center rounded-3xl" style={GLASS_SUBTLE}>
              <p className="text-white/35 font-bold">해당하는 자료가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
