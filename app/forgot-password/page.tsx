"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

type Step = "email" | "code";

const GLASS = {
  background: "rgba(255,255,255,0.038)",
  backdropFilter: "blur(48px) saturate(170%)",
  WebkitBackdropFilter: "blur(48px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.35)",
} as React.CSSProperties;

const INPUT_WRAPPER = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "1rem",
} as React.CSSProperties;

const INPUT_CLASS = "w-full px-4 py-3 text-white/80 placeholder:text-white/18 outline-none text-[13px] focus:ring-1 focus:ring-white/20 transition-all bg-transparent";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestCode = async () => {
    setError("");
    if (!email.trim()) { setError("이메일을 입력해 주세요."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.message || "오류가 발생했습니다."); return; }
      setStep("code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!code.trim()) { setError("인증 코드를 입력해 주세요."); return; }
    if (!newPassword.trim() || newPassword.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (newPassword !== confirmPassword) { setError("비밀번호가 일치하지 않습니다."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.message || "오류가 발생했습니다."); return; }
      alert("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <Link href="/login" className="text-[12px] font-semibold text-white/35 hover:text-white/65 transition-colors">
            ← 로그인으로
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-3xl p-7 space-y-5" style={GLASS}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

          <div className="text-center space-y-2">
            <div className="text-4xl">{step === "email" ? "🔑" : "🔒"}</div>
            <h1 className="text-[22px] font-black tracking-[-0.04em] text-white">
              {step === "email" ? "비밀번호 찾기" : "비밀번호 재설정"}
            </h1>
            <p className="text-[12px] text-white/30 leading-relaxed">
              {step === "email"
                ? "가입한 이메일로 인증 코드를 보내드려요"
                : <><span className="text-white/60 font-semibold">{email}</span>으로<br />발송된 코드를 입력해 주세요</>}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-0.5 rounded-full bg-white/40" />
            <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step === "code" ? "bg-white/40" : "bg-white/10"}`} />
          </div>

          {step === "email" && (
            <div className="space-y-3">
              <div style={INPUT_WRAPPER}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRequestCode()}
                  placeholder="가입한 이메일 주소"
                  type="email"
                  className={INPUT_CLASS}
                />
              </div>
              {error && <p className="text-center text-[12px] font-semibold text-red-400">{error}</p>}
              <button
                onClick={handleRequestCode}
                disabled={loading}
                className="w-full rounded-2xl bg-white py-3.5 text-[13px] font-bold text-black hover:bg-white/90 transition-colors disabled:opacity-40"
                style={{ boxShadow: "0 0 28px rgba(255,255,255,0.15)" }}
              >
                {loading ? "발송 중..." : "인증 코드 받기"}
              </button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-1.5 px-1">인증 코드</p>
                <div style={INPUT_WRAPPER}>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className={INPUT_CLASS + " text-center text-2xl font-black tracking-[0.3em]"}
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-1.5 px-1">새 비밀번호</p>
                <div style={INPUT_WRAPPER}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6자 이상"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28 mb-1.5 px-1">비밀번호 확인</p>
                <div style={{
                  ...INPUT_WRAPPER,
                  borderColor: confirmPassword && newPassword !== confirmPassword ? "rgba(239,68,68,0.4)"
                    : confirmPassword && newPassword === confirmPassword ? "rgba(16,185,129,0.4)"
                    : "rgba(255,255,255,0.09)",
                }}>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    placeholder="비밀번호 재입력"
                    className={INPUT_CLASS}
                  />
                </div>
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[11px] text-emerald-400/70 font-semibold px-1 mt-1">✓ 비밀번호가 일치합니다</p>
                )}
              </div>

              {error && <p className="text-center text-[12px] font-semibold text-red-400">{error}</p>}

              <button
                onClick={handleResetPassword}
                disabled={loading || code.length !== 6}
                className="w-full rounded-2xl bg-white py-3.5 text-[13px] font-bold text-black hover:bg-white/90 transition-colors disabled:opacity-40"
                style={{ boxShadow: "0 0 28px rgba(255,255,255,0.15)" }}
              >
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={async () => {
                    setError(""); setLoading(true);
                    try {
                      await fetch("/api/reset-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      });
                      alert("인증 코드를 재발송했습니다.");
                    } finally { setLoading(false); }
                  }}
                  disabled={loading}
                  className="text-[11px] text-white/28 hover:text-white/55 transition-colors"
                >
                  코드 재발송
                </button>
                <button
                  onClick={() => { setStep("email"); setCode(""); setError(""); }}
                  className="text-[11px] text-white/28 hover:text-white/55 transition-colors"
                >
                  이메일 변경
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}
