"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FadeInSection from "../components/fade-in-section";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    if (mode === "signup" && !nickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }

    const url = mode === "login" ? "/api/login" : "/api/signup";
    const body =
      mode === "login"
        ? { email, password }
        : { email, password, nickname };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "요청 처리 중 오류가 발생했습니다.");
      return;
    }

    alert(mode === "login" ? "로그인이 완료되었습니다." : "회원가입이 완료되었습니다.");
    router.push("/");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/hub"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm"
          >
            ← 홈
          </Link>
        </div>

        <div className="rounded-[28px] border border-green-100 bg-white p-6 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mb-3 text-5xl">🔐</div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {mode === "login" ? "로그인" : "회원가입"}
            </h1>
            <p className="mt-2 text-gray-600">
              계정에 로그인하여 기록과 권한을 이용하실 수 있습니다.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
            <button
              onClick={() => setMode("login")}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${
                mode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-xl px-4 py-3 text-sm font-bold ${
                mode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              회원가입
            </button>
          </div>

          <div className="space-y-3">
            {mode === "signup" && (
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임"
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            )}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />

            <button
              onClick={handleSubmit}
              className="w-full rounded-2xl bg-green-500 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-200"
            >
              {mode === "login" ? "로그인" : "회원가입"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}