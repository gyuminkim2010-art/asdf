"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = Cookies.get("user_session");
    if (savedUser) setUser(JSON.parse(savedUser));

    fetch("/api/posts")
      .then(res => res.json())
      .then(data => {
        const found = data.find((p: any) => p.id === Number(id));
        if (found) setPost(found);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts?id=${post.id}&userId=${user.userId}`, { method: "DELETE" });
    if (res.ok) {
      alert("삭제되었습니다.");
      router.push("/board");
    }
  };

  if (!post) return <div className="p-10 text-center font-bold">로딩 중...</div>;

  return (
    <main className="min-h-screen bg-[#ecebe6] py-12 px-6 text-black">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 font-bold text-gray-500">← 뒤로가기</button>
        
        <div className="bg-white p-10 rounded-[40px] shadow-lg border border-black/10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-2">
              <span className="bg-black text-white px-3 py-1 rounded-lg text-xs font-bold">{post.grade}</span>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold">{post.subject}</span>
            </div>
            {user?.userId === post.authorId && (
              <button onClick={handleDelete} className="text-red-500 font-bold">삭제</button>
            )}
          </div>

          <h1 className="text-3xl font-black mb-6">{post.title}</h1>
          <p className="text-gray-900 text-lg leading-relaxed mb-10 whitespace-pre-wrap">{post.content}</p>

          {post.fileName && (
            <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center">
              <p className="mb-4 font-bold">첨부된 학습 자료가 있습니다.</p>
              <a 
                href={`/uploads/${post.fileName}`} 
                download 
                className="bg-black text-white px-8 py-3 rounded-xl font-black shadow-md active:scale-95 transition-all"
              >
                📁 {post.fileName.split('_')[1]} 다운로드
              </a>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-black/5 text-gray-400 font-bold">
            작성자: {post.authorName} | 작성일: {post.date}
          </div>
        </div>
      </div>
    </main>
  );
}