"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "form" | "verify";

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

const INPUT_STYLE =
  "w-full rounded-2xl px-4 py-3 text-white/85 placeholder:text-white/20 outline-none text-[13px] focus:ring-1 focus:ring-white/20 transition-all bg-transparent";
const INPUT_WRAPPER = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1rem",
} as React.CSSProperties;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<Step>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) { setError("이메일과 비밀번호를 입력해 주세요."); return; }
    if (mode === "signup" && !nickname.trim()) { setError("닉네임을 입력해 주세요."); return; }

    setLoading(true);
    try {
      const res = await fetch(mode === "login" ? "/api/login" : "/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { email, password, nickname }),
      });
      const data = await res.json();
      if (data.needVerify) { setPendingEmail(data.email || email); setStep("verify"); return; }
      if (!res.ok || !data.ok) { setError(data.message || "요청 처리 중 오류가 발생했습니다."); return; }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!code.trim()) { setError("인증 코드를 입력해 주세요."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.message || "인증 처리 중 오류가 발생했습니다."); return; }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.message || "재발송 중 오류가 발생했습니다."); }
      else { alert("인증 코드를 재발송했습니다."); }
    } finally {
      setLoading(false);
    }
  };

  const verifyScreen = (
    <motion.div
      key="verify"
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="relative overflow-hidden rounded-3xl p-7 space-y-5" style={GLASS}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="text-center space-y-2">
          <div className="text-4xl">📬</div>
          <h1 className="text-[22px] font-black tracking-[-0.04em] text-white">이메일 인증</h1>
          <p className="text-[12px] text-white/35 leading-relaxed">
            <span className="text-white/65 font-semibold">{pendingEmail}</span>으로<br />
            발송된 6자리 코드를 입력해 주세요.
          </p>
        </div>

        <div style={INPUT_WRAPPER} className="overflow-hidden">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            className={INPUT_STYLE + " text-center text-3xl font-black tracking-[0.3em]"}
          />
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[12px] font-semibold text-red-400">
            {error}
          </motion.p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full rounded-2xl bg-white py-3.5 text-[13px] font-bold text-black transition-all hover:bg-white/90 disabled:opacity-40"
          style={{ boxShadow: "0 0 28px rgba(255,255,255,0.15)" }}
        >
          {loading ? "확인 중..." : "인증 완료"}
        </button>

        <div className="flex items-center justify-between">
          <button onClick={handleResend} disabled={loading} className="text-[11px] text-white/28 hover:text-white/55 transition-colors">
            코드 재발송
          </button>
          <button onClick={() => { setStep("form"); setCode(""); setError(""); }} className="text-[11px] text-white/28 hover:text-white/55 transition-colors">
            이메일 변경
          </button>
        </div>
      </div>
    </motion.div>
  );

  const formScreen = (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm mx-auto space-y-4"
    >
      <div className="flex items-center justify-between">
        <Link
          href="/hub"
          className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors"
        >
          ← 홈
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl p-7 space-y-5" style={GLASS}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="text-center space-y-2">
          <div className="text-4xl">🔐</div>
          <h1 className="text-[22px] font-black tracking-[-0.04em] text-white">
            {mode === "login" ? "로그인" : "회원가입"}
          </h1>
          <p className="text-[12px] text-white/30">
            {mode === "login" ? "계정에 로그인하세요" : "새 계정을 만들어 시작하세요"}
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="grid grid-cols-2 gap-1 rounded-2xl p-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="rounded-xl py-2.5 text-[12px] font-bold transition-all duration-200"
              style={mode === m ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.12)" } : { color: "rgba(255,255,255,0.3)" }}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-2.5">
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                key="nickname"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28 }}
                style={INPUT_WRAPPER}
                className="overflow-hidden"
              >
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임"
                  className={INPUT_STYLE}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div style={INPUT_WRAPPER}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" type="email" className={INPUT_STYLE} />
          </div>
          <div style={INPUT_WRAPPER}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className={INPUT_STYLE}
            />
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[12px] font-semibold text-red-400">
            {error}
          </motion.p>
        )}

        {mode === "signup" && (
          <p className="text-[11px] text-white/22 text-center">가입 후 이메일로 인증 코드가 발송됩니다.</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-white py-3.5 text-[13px] font-bold text-black transition-all hover:bg-white/90 disabled:opacity-40"
          style={{ boxShadow: "0 0 28px rgba(255,255,255,0.15)" }}
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
        </button>

        {mode === "login" && (
          <Link href="/forgot-password" className="block text-center text-[11px] text-white/25 hover:text-white/45 transition-colors">
            비밀번호를 잊으셨나요?
          </Link>
        )}
      </div>
    </motion.div>
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-white">
      <AnimatePresence mode="wait">
        {step === "verify" ? verifyScreen : formScreen}
      </AnimatePresence>
    </main>
  );
}
