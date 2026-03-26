"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const savedUser = Cookies.get("user_session");
    if (savedUser) window.location.href = "/board";
  }, []);

  const handleAuth = async () => {
    if (!userId || !password || (!isLogin && !userName)) {
      return alert("모든 항목을 입력해주세요.");
    }

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: isLogin ? "login" : "register", userId, password, userName }),
    });

    const data = await res.json();

    if (res.ok) {
      if (isLogin) {
        // 💡 path: '/'를 넣어야 사이트 전체에서 로그인이 유지됩니다.
        Cookies.set("user_session", JSON.stringify(data.user), { expires: 7, path: '/' });
        alert(`${data.user.userName}님, 환영합니다!`);
        window.location.href = "/board";
      } else {
        alert("가입 완료! 로그인 해주세요.");
        setIsLogin(true);
      }
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#ecebe6] flex items-center justify-center p-6 text-black">
      <motion.div layout className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-black/5">
        <h1 className="text-3xl font-black text-center mb-8">{isLogin ? "로그인" : "회원가입"}</h1>
        <div className="flex flex-col gap-4">
          {!isLogin && (
            <input
              placeholder="이름"
              value={userName} onChange={(e) => setUserName(e.target.value)}
              className="w-full p-5 rounded-2xl bg-[#fcfcfc] border-2 border-black/20 text-black font-bold outline-none focus:border-black/50"
            />
          )}
          <input
            placeholder="아이디"
            value={userId} onChange={(e) => setUserId(e.target.value)}
            className="w-full p-5 rounded-2xl bg-[#fcfcfc] border-2 border-black/20 text-black font-bold outline-none focus:border-black/50"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full p-5 rounded-2xl bg-[#fcfcfc] border-2 border-black/20 text-black font-bold outline-none focus:border-black/50"
          />
          <button onClick={handleAuth} className="w-full bg-black text-white p-5 rounded-2xl font-black text-lg mt-4">
            {isLogin ? "접속하기" : "가입하기"}
          </button>
        </div>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-8 text-sm font-bold text-gray-500">
          {isLogin ? "계정이 없으신가요? 가입하기" : "이미 계정이 있나요? 로그인"}
        </button>
      </motion.div>
    </div>
  );
}