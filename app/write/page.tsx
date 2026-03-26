"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";

export default function WritePage() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [grade, setGrade] = useState("1학년");
  const [subject, setSubject] = useState("공통 국어"); 
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 💡 학년별 과목 데이터
  const subjectsByGrade: { [key: string]: string[] } = {
    "1학년": ["공통 국어", "공통 수학", "공통 영어", "한국사", "통합사회", "통합과학"],
    "2학년": ["문학", "독서", "수학Ⅰ", "수학Ⅱ", "영어Ⅰ", "영어Ⅱ", "물리Ⅰ", "화학Ⅰ", "생명과학Ⅰ", "지구과학Ⅰ", "세계사", "윤리와 사상"],
    "3학년": ["화법과 작문", "언어와 매체", "미적분", "확률과 통계", "기하", "영어 독해와 작문", "물리Ⅱ", "화학Ⅱ", "사회·문화", "경제"]
  };

  // 💡 학년이 바뀔 때마다 과목 리스트를 업데이트하고 첫 번째 과목을 기본값으로 설정
  useEffect(() => {
    setSubject(subjectsByGrade[grade][0]);
  }, [grade]);

  useEffect(() => {
    const savedUser = Cookies.get("user_session");
    if (!savedUser) {
      alert("로그인이 필요합니다.");
      window.location.href = "/login2";
      return;
    }
    setUser(JSON.parse(savedUser));
  }, []);

  const handleSubmit = async () => {
    if (!title || !content || !subject) return alert("모든 항목을 입력해주세요.");

    if (file && file.size > 50 * 1024 * 1024) {
      return alert("파일이 너무 큽니다. (최대 50MB)");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("grade", grade);
    formData.append("subject", subject);
    formData.append("authorId", user.userId);
    formData.append("authorName", user.userName);
    if (file) formData.append("file", file);

    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("등록 완료!");
      window.location.href = "/board";
    } else {
      alert("등록 실패");
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#ecebe6] py-12 px-6 text-black font-bold">
      <div className="max-w-3xl mx-auto bg-white rounded-[40px] p-10 shadow-lg border border-black/10">
        <h1 className="text-3xl font-black mb-8 text-black">자료 등록</h1>
        
        <div className="space-y-6">
          <input 
            placeholder="제목을 입력하세요"
            value={title} onChange={e => setTitle(e.target.value)}
            className="w-full text-2xl p-5 rounded-2xl bg-[#fcfcfc] border-2 border-black/30 text-black outline-none focus:border-black placeholder:text-gray-400"
          />

          <div className="grid grid-cols-2 gap-4">
            {/* 학년 선택 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm ml-2 text-gray-500">학년</label>
              <select 
                value={grade} 
                onChange={e => setGrade(e.target.value)} 
                className="p-4 rounded-xl border-2 border-black/30 bg-white text-black text-lg outline-none focus:border-black"
              >
                <option value="1학년">1학년</option>
                <option value="2학년">2학년</option>
                <option value="3학년">3학년</option>
              </select>
            </div>

            {/* 💡 학년에 따라 바뀌는 과목 선택 창 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm ml-2 text-gray-500">과목</label>
              <select 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                className="p-4 rounded-xl border-2 border-black/30 bg-white text-black text-lg outline-none focus:border-black"
              >
                {subjectsByGrade[grade].map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <textarea 
            placeholder="상세 내용을 입력하세요"
            rows={8} value={content} onChange={e => setContent(e.target.value)}
            className="w-full p-5 rounded-2xl bg-[#fcfcfc] border-2 border-black/30 text-black text-lg outline-none focus:border-black resize-none"
          />

          <div className="p-8 border-2 border-dashed border-black/20 rounded-3xl bg-[#fcfcfc] flex flex-col items-center">
            <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-black text-white px-8 py-3 rounded-2xl font-black mb-3 active:scale-95 transition-all">
              파일 선택
            </button>
            <p className="text-sm text-gray-600">
              {file ? `선택됨: ${file.name}` : "학습 자료를 올려주세요"}
            </p>
          </div>

          <button onClick={handleSubmit} className="w-full bg-black text-white p-6 rounded-3xl text-xl font-black shadow-xl">
            자료 업로드 하기
          </button>
        </div>
      </div>
    </main>
  );
}