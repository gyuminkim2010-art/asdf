"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PhraseItem = {
  id: number;
  category: string;
  title: string | null;
  hanjaText: string;
  koreanText: string;
  hanjaTokens: string;
  koreanTokens: string;
};

type MeUser = {
  id: number;
  email: string;
  nickname: string;
  role: string;
};

export default function AdminPhrasesPage() {
  const [currentUser, setCurrentUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PhraseItem[]>([]);

  const [category, setCategory] = useState("analects");
  const [title, setTitle] = useState("");
  const [hanjaText, setHanjaText] = useState("");
  const [koreanText, setKoreanText] = useState("");
  const [hanjaTokens, setHanjaTokens] = useState("");
  const [koreanTokens, setKoreanTokens] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadItems = async () => {
    const res = await fetch("/api/phrases", { cache: "no-store" });
    const data = await res.json();
    if (res.ok && data.ok) {
      setItems(data.items);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch("/api/me", { cache: "no-store" });
        const meData = await meRes.json();

        if (meRes.ok && meData.ok) {
          setCurrentUser(meData.user);
        }

        await loadItems();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAdd = async () => {
    const res = await fetch("/api/phrases", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category,
        title,
        hanjaText,
        koreanText,
        hanjaTokens,
        koreanTokens,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "문구 추가 중 오류가 발생했습니다.");
      return;
    }

    setTitle("");
    setHanjaText("");
    setKoreanText("");
    setHanjaTokens("");
    setKoreanTokens("");
    await loadItems();
    alert("문구가 추가되었습니다.");
  };

  const handleBulkAdd = async () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert("추가할 문구 목록을 입력해 주세요.");
      return;
    }

    setBulkLoading(true);
    let success = 0;
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(";;");
      if (parts.length < 6) {
        errors.push(`형식 오류 (필드 부족): ${line.slice(0, 40)}`);
        continue;
      }

      const [cat, ttl, hjText, krText, hjTokens, krTokens] = parts.map((p) => p.trim());

      if (!["analects", "idiom"].includes(cat)) {
        errors.push(`카테고리 오류 (analects 또는 idiom): ${line.slice(0, 40)}`);
        continue;
      }

      const res = await fetch("/api/phrases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: cat,
          title: ttl,
          hanjaText: hjText,
          koreanText: krText,
          hanjaTokens: hjTokens,
          koreanTokens: krTokens,
        }),
      });

      if (res.ok) {
        success++;
      } else {
        errors.push(`추가 실패: ${line.slice(0, 40)}`);
      }
    }

    setBulkText("");
    await loadItems();
    setBulkLoading(false);

    const msg = [`${success}개 문구가 추가되었습니다.`];
    if (errors.length > 0) msg.push(`\n오류 ${errors.length}건:\n${errors.join("\n")}`);
    alert(msg.join(""));
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/phrases/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.message || "문구 삭제 중 오류가 발생했습니다.");
      return;
    }

    await loadItems();
    alert("문구가 삭제되었습니다.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6 flex items-center justify-center">
        <p className="text-gray-600">관리자 정보를 확인하는 중입니다...</p>
      </main>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6 flex items-center justify-center">
        <div className="rounded-[28px] border border-red-100 bg-white p-6 text-center shadow-xl">
          <h1 className="text-2xl font-extrabold text-gray-900">
            접근 권한이 없습니다
          </h1>
          <p className="mt-2 text-gray-600">
            관리자 계정으로만 이용하실 수 있습니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-green-50 to-lime-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">
            논어 / 사자성어 관리
          </h1>

          <Link
            href="/admin"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm"
          >
            관리자 홈
          </Link>
        </div>

        <div className="rounded-[28px] border border-green-100 bg-white p-5 shadow-xl">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
            >
              <option value="analects">논어</option>
              <option value="idiom">사자성어</option>
            </select>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 (예: 학이시습지, 새옹지마)"
              className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />

            <input
              value={hanjaText}
              onChange={(e) => setHanjaText(e.target.value)}
              placeholder="한문 전체 문장"
              className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 md:col-span-2"
            />

            <input
              value={koreanText}
              onChange={(e) => setKoreanText(e.target.value)}
              placeholder="한국어 전체 문장"
              className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 md:col-span-2"
            />

            <textarea
              value={hanjaTokens}
              onChange={(e) => setHanjaTokens(e.target.value)}
              placeholder="한자 배열용 토큰을 | 로 구분해서 입력&#10;예: 學而|時習之|不亦|說乎"
              className="h-32 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />

            <textarea
              value={koreanTokens}
              onChange={(e) => setKoreanTokens(e.target.value)}
              placeholder="한국어 배열용 토큰을 | 로 구분해서 입력&#10;예: 배우고|때때로|익히면|또한|기쁘지|아니한가"
              className="h-32 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />
          </div>

          <button
            onClick={handleAdd}
            className="mt-4 w-full rounded-2xl bg-green-500 px-4 py-4 text-base font-bold text-white"
          >
            문구 추가
          </button>
        </div>

        <div className="mt-5 rounded-[28px] border border-blue-100 bg-white p-5 shadow-xl">
          <h2 className="mb-1 text-xl font-extrabold text-gray-900">여러 문구 한번에 추가</h2>
          <p className="mb-1 text-sm text-gray-500">
            한 줄에 하나씩, 필드를 <code className="rounded bg-gray-100 px-1 font-mono text-xs">;;</code>로 구분해서 입력하세요.
          </p>
          <p className="mb-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 font-mono text-xs text-gray-500 leading-6">
            형식: 카테고리;;제목;;한문전체;;한국어전체;;한자토큰(|구분);;한국어토큰(|구분)<br />
            analects;;학이시습지;;學而時習之;;배우고 때때로 익히면;;學而|時習之|不亦|說乎;;배우고|때때로|익히면|기쁘지 않은가<br />
            idiom;;새옹지마;;塞翁之馬;;변방 노인의 말;;塞翁|之|馬;;변방|노인의|말
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`analects;;학이시습지;;學而時習之;;배우고 때때로 익히면;;學而|時習之|不亦|說乎;;배우고|때때로|익히면|기쁘지 않은가\nidiom;;새옹지마;;塞翁之馬;;변방 노인의 말;;塞翁|之|馬;;변방|노인의|말`}
            className="h-40 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={handleBulkAdd}
            disabled={bulkLoading}
            className="mt-3 w-full rounded-2xl bg-blue-500 px-4 py-4 text-base font-bold text-white shadow-lg disabled:opacity-50"
          >
            {bulkLoading ? "추가 중..." : "여러 문구 추가"}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {item.category === "analects" ? "논어" : "사자성어"}
                  </p>
                  <p className="text-xl font-extrabold text-gray-900">
                    {item.title || "제목 없음"}
                  </p>
                  <p className="mt-2 font-semibold text-gray-800">{item.hanjaText}</p>
                  <p className="mt-1 text-gray-600">{item.koreanText}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    한자 토큰: {item.hanjaTokens}
                  </p>
                  <p className="text-sm text-gray-500">
                    한국어 토큰: {item.koreanTokens}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}