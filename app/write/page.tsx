"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

const FIELD_STYLE = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1rem",
  color: "rgba(255,255,255,0.8)",
} as React.CSSProperties;

export default function WritePage() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [grade, setGrade] = useState("1학년");
  const [subject, setSubject] = useState("공통 국어");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjectsByGrade: { [key: string]: string[] } = {
    "1학년": ["공통 국어", "공통 수학", "공통 영어", "한국사", "통합사회", "통합과학"],
    "2학년": ["문학", "독서", "수학Ⅰ", "수학Ⅱ", "영어Ⅰ", "영어Ⅱ", "물리Ⅰ", "화학Ⅰ", "생명과학Ⅰ", "지구과학Ⅰ", "세계사", "윤리와 사상"],
    "3학년": ["화법과 작문", "언어와 매체", "미적분", "확률과 통계", "기하", "영어 독해와 작문", "물리Ⅱ", "화학Ⅱ", "사회·문화", "경제"],
  };

  useEffect(() => { setSubject(subjectsByGrade[grade][0]); }, [grade]);

  useEffect(() => {
    const savedUser = Cookies.get("user_session");
    if (!savedUser) { alert("로그인이 필요합니다."); window.location.href = "/login2"; return; }
    setUser(JSON.parse(savedUser));
  }, []);

  const handleSubmit = async () => {
    if (!title || !content || !subject) return alert("모든 항목을 입력해주세요.");
    if (file && file.size > 50 * 1024 * 1024) return alert("파일이 너무 큽니다. (최대 50MB)");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("grade", grade);
    formData.append("subject", subject);
    formData.append("authorId", user.userId);
    formData.append("authorName", user.userName);
    if (file) formData.append("file", file);

    const res = await fetch("/api/posts", { method: "POST", body: formData });
    if (res.ok) { alert("등록 완료!"); window.location.href = "/board"; }
    else alert("등록 실패");
  };

  if (!user) return null;

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto max-w-3xl px-4 py-24 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-7 md:p-10 space-y-6"
          style={GLASS}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/28 mb-1">학습자료 공유</p>
            <h1 className="text-[clamp(24px,4vw,36px)] font-black tracking-[-0.04em] text-white">자료 등록</h1>
          </div>

          {/* Title */}
          <input
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-5 py-4 text-[18px] font-bold placeholder:text-white/18 outline-none focus:ring-1 focus:ring-white/20 transition-all"
            style={FIELD_STYLE}
          />

          {/* Grade + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28">학년</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 text-[13px] font-semibold outline-none"
                style={FIELD_STYLE}
              >
                <option value="1학년">1학년</option>
                <option value="2학년">2학년</option>
                <option value="3학년">3학년</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28">과목</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 text-[13px] font-semibold outline-none"
                style={FIELD_STYLE}
              >
                {subjectsByGrade[grade].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <textarea
            placeholder="상세 내용을 입력하세요"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-5 py-4 text-[13px] leading-relaxed placeholder:text-white/18 outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none"
            style={FIELD_STYLE}
          />

          {/* File upload */}
          <div
            className="rounded-2xl p-6 flex flex-col items-center border-2 border-dashed text-center"
            style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl bg-white px-6 py-3 text-[12px] font-bold text-black hover:bg-white/90 transition-colors mb-3"
              style={{ boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
            >
              파일 선택
            </button>
            <p className="text-[12px] text-white/30">
              {file ? `선택됨: ${file.name}` : "학습 자료를 올려주세요 (최대 50MB)"}
            </p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-white py-4 text-[14px] font-black text-black hover:bg-white/90 transition-colors"
            style={{ boxShadow: "0 0 32px rgba(255,255,255,0.15)" }}
          >
            자료 업로드 하기
          </button>
        </motion.div>
      </div>
    </main>
  );
}
