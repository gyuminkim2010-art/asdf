"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Cookies from "js-cookie";

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = Cookies.get("user_session");
    if (savedUser) setUser(JSON.parse(savedUser));
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => p.id === Number(id));
        if (found) setPost(found);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/posts?id=${post.id}&userId=${user.userId}`, { method: "DELETE" });
    if (res.ok) { alert("삭제되었습니다."); router.push("/board"); }
  };

  if (!post) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-white/35">로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white overflow-x-hidden">
      <div className="mx-auto max-w-3xl px-4 py-24 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <button
            onClick={() => router.back()}
            className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors"
          >
            ← 뒤로가기
          </button>

          <div className="relative overflow-hidden rounded-3xl p-7 md:p-10" style={GLASS}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

            {/* Tags + delete */}
            <div className="flex items-start justify-between mb-6 gap-3">
              <div className="flex gap-2 flex-wrap">
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
              {user?.userId === post.authorId && (
                <button
                  onClick={handleDelete}
                  className="shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold text-red-400/70 hover:text-red-300 transition-colors"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
                >
                  삭제
                </button>
              )}
            </div>

            <h1 className="text-[clamp(22px,4vw,36px)] font-black tracking-[-0.04em] text-white mb-5">{post.title}</h1>
            <p className="text-[14px] text-white/60 leading-relaxed whitespace-pre-wrap mb-8">{post.content}</p>

            {post.fileName && (
              <div
                className="rounded-2xl p-6 flex flex-col items-center border-2 border-dashed text-center mb-8"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
              >
                <p className="text-[13px] text-white/35 mb-4">첨부된 학습 자료가 있습니다.</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${post.fileName}`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-white px-8 py-3 text-[13px] font-black text-black hover:bg-white/90 transition-colors"
                  style={{ boxShadow: "0 0 24px rgba(255,255,255,0.12)" }}
                >
                  📁 {post.fileName.split("_").slice(1).join("_")} 다운로드
                </a>
              </div>
            )}

            <div
              className="flex items-center gap-3 pt-5 border-t text-[11px] text-white/22 font-semibold"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <span>작성자: {post.authorName}</span>
              <span className="text-white/12">·</span>
              <span>작성일: {post.date}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
