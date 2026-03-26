"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function BoardPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("전체 학년");
  const [selectedSubject, setSelectedSubject] = useState("전체 과목");

  // 학년별 과목 데이터 (필터용)
  const subjectsByGrade: { [key: string]: string[] } = {
    "전체 학년": ["전체 과목"],
    "1학년": ["전체 과목", "공통 국어", "공통 수학", "공통 영어", "한국사", "통합사회", "통합과학"],
    "2학년": ["전체 과목", "문학", "독서", "수학Ⅰ", "수학Ⅱ", "영어Ⅰ", "영어Ⅱ", "물리Ⅰ", "화학Ⅰ", "생명과학Ⅰ", "지구과학Ⅰ", "세계사", "윤리와 사상"],
    "3학년": ["전체 과목", "화법과 작문", "언어와 매체", "미적분", "확률과 통계", "기하", "영어 독해와 작문", "물리Ⅱ", "화학Ⅱ", "사회·문화", "경제"]
  };

  useEffect(() => {
    const savedUser = Cookies.get("user_session");
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchPosts();
  }, []);

  // 💡 학년이 바뀌면 선택된 과목을 '전체 과목'으로 초기화
  useEffect(() => {
    setSelectedSubject("전체 과목");
  }, [selectedGrade]);

  // 💡 통합 검색/필터 로직
  useEffect(() => {
    let result = posts;

    if (selectedGrade !== "전체 학년") {
      result = result.filter(p => p.grade === selectedGrade);
    }
    if (selectedSubject !== "전체 과목") {
      result = result.filter(p => p.subject === selectedSubject);
    }
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lowerTerm) ||
        p.content.toLowerCase().includes(lowerTerm)
      );
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
    Cookies.remove("user_session", { path: '/' });
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#ecebe6] py-12 px-6 text-black font-bold">
      <div className="max-w-5xl mx-auto">
        {/* 상단 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
          {/* 🏠 새로 추가된 홈 버튼 */}
          <Link 
            href="/" 
            className="bg-white border-2 border-black/10 p-3 rounded-2xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all group"
            title="메인으로 이동"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-black group-hover:scale-110 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>

          <h1 className="text-4xl font-black tracking-tighter">
            Study<br className="md:hidden" /> Archive
          </h1>
        </div>
  
  <div className="flex items-center gap-3 w-full md:w-auto">
    {user ? (
      <div className="flex flex-row items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-black/10 shadow-sm flex-1 md:flex-none justify-between md:justify-start">
        <span className="font-black text-black whitespace-nowrap">{user.userName}님</span>
        <div className="w-[1px] h-4 bg-black/10 mx-1"></div>
        <button onClick={handleLogout} className="text-red-500 text-sm font-bold whitespace-nowrap">로그아웃</button>
      </div>
    ) : (
      <Link href="/login" className="bg-black text-white px-6 py-3 rounded-2xl font-bold whitespace-nowrap">로그인</Link>
    )}
    
    <Link href="/write" className="bg-white border-2 border-black/20 px-6 py-3 rounded-2xl font-bold text-black whitespace-nowrap shadow-sm active:scale-95 transition-all">
      글쓰기
    </Link>
  </div>
</div>
        
        {/* 💡 업그레이드된 필터 & 검색바 */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            {/* 학년 필터 */}
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="p-3 rounded-xl border-2 border-black/10 bg-[#fcfcfc] text-sm focus:border-black outline-none min-w-[120px]"
            >
              {Object.keys(subjectsByGrade).map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            {/* 과목 필터 (학년에 연동됨) */}
            <select 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="p-3 rounded-xl border-2 border-black/10 bg-[#fcfcfc] text-sm focus:border-black outline-none min-w-[140px]"
            >
              {subjectsByGrade[selectedGrade].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* 제목/내용 검색창 */}
          <input 
            type="text"
            placeholder="찾고 싶은 키워드를 입력하세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-3 rounded-xl border-2 border-black/10 bg-[#fcfcfc] text-sm focus:border-black outline-none"
          />
          
          <div className="flex items-center text-sm text-gray-400 font-bold px-2 whitespace-nowrap">
            검색 결과 {filteredPosts.length}개
          </div>
        </div>

        {/* 게시글 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <motion.div 
                key={post.id} 
                layout
                onClick={() => router.push(`/board/${post.id}`)}
                className="bg-white p-8 rounded-[36px] shadow-sm border-2 border-black/5 cursor-pointer hover:border-black/20 transition-all h-[280px] flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-2 mb-4">
                    <span className="bg-black text-white px-3 py-1 rounded-lg text-xs font-bold">{post.grade}</span>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold">{post.subject}</span>
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-black truncate">{post.title}</h2>
                  <p className="text-gray-900 leading-relaxed font-medium line-clamp-2" 
                     style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </p>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-400 border-t border-black/5 pt-4">
                  <span>{post.authorName} · {post.date}</span>
                  {post.fileName && <span className="text-blue-500 font-black">📁 첨부파일</span>}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400 font-bold">
              해당하는 자료가 없습니다
            </div>
          )}
        </div>
      </div>
    </main>
  );
}