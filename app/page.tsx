"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const menuCards = [
  {
    title: "한자퀴즈",
    description: "반복학습으로 쉽게",
    href: "/hub",
  },
  {
    title: "학습자료공유",
    description: "학습자료를 배포하고 확인할 수 있습니다.",
    href: "/board",
  },
  {
    title: "급식정보",
    description: "급식을 확인합니다.",
    href: "/meal",
  },
  {
    title: "학사일정",
    description: "학교 일정을 확인하고, 날짜를 눌러 자세히 볼 수 있습니다.",
    href: "/schedule",
  },
  
];

export default function IntroPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#ecebe6] text-[#171717]">
      <div className="relative">
        <div className="absolute left-[-120px] top-[-60px] h-[260px] w-[260px] rounded-full bg-[#d9e2db] blur-3xl opacity-70" />
        <div className="absolute right-[-100px] top-[120px] h-[240px] w-[240px] rounded-full bg-[#dfdde8] blur-3xl opacity-70" />
        <div className="absolute bottom-[10%] left-[12%] h-[220px] w-[220px] rounded-full bg-[#ece4d8] blur-3xl opacity-70" />

        <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-full border border-black/5 bg-white/55 px-4 py-2 text-sm font-semibold tracking-[0.08em] text-[#666666] backdrop-blur"
          >
            Project. no Name
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.985 }}
            animate={{ opacity: 1, y: [34, 0, -14, -8], scale: [0.985, 1, 1, 1] }}
            transition={{
              duration: 1.55,
              delay: 0.25,
              times: [0, 0.52, 0.8, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-8"
          >
            <motion.h1
              animate={{ y: [0, -5, 0, 5, 0] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-6xl font-black tracking-[-0.06em] text-[#171717] md:text-8xl"
              style={{
                textShadow:
                  "0 0 10px rgba(255,255,255,0.28), 0 0 20px rgba(255,255,255,0.14)",
              }}
            >
              no NAME
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: [26, 0, -4, 0] }}
            transition={{
              duration: 1.1,
              delay: 1.25,
              times: [0, 0.66, 0.84, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-12 max-w-2xl text-sm leading-7 text-[#6f6f6f] md:text-base"
          >
            
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: [32, 0, -4, 0] }}
            transition={{
              duration: 1.15,
              delay: 1.45,
              times: [0, 0.66, 0.84, 1],
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-10 flex flex-col items-center"
          >
            <p className="text-sm font-medium text-[#8a8a8a]">
              아래로 내려서 더보기
            </p>

            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{
                duration: 1.9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mt-2 text-[#9b9b9b]"
            >
              ↓
            </motion.div>
          </motion.div>
        </section>

        <section className="relative mx-auto max-w-5xl px-6 pb-28">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {menuCards.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 70, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.28 }}
                transition={{
                  delay: index * 0.08,
                  type: "spring",
                  stiffness: 90,
                  damping: 14,
                  mass: 1,
                }}
              >
                <Link href={item.href} className="block">
                  <div className="aspect-[6/4] rounded-[32px] border border-black/5 bg-white/62 p-3 shadow-[0_10px_40px_rgba(0,0,0,0.05)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/78">
                    <div className="flex h-full flex-col justify-between rounded-[26px] border border-black/5 bg-[#f6f5f1] p-6">
                      <div>
                        <p className="text-2xl font-extrabold tracking-[-0.03em] text-[#171717]">
                          {item.title}
                        </p>
                        <p className="mt-4 text-sm leading-7 text-[#666666] md:text-base">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-4 text-sm font-bold text-[#4d4d4d]">
                        이동하기 →
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}