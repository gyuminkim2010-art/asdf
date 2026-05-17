import { NextRequest, NextResponse } from "next/server";

const BASE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Origin": "https://finance.yahoo.com",
  "Referer": "https://finance.yahoo.com/",
};

/* ── 서버 인스턴스 단위 crumb 캐시 ── */
let _crumb   = "";
let _cookie  = "";
let _expiry  = 0;

async function refreshCrumb(): Promise<boolean> {
  try {
    // 1) Yahoo Finance 초기 쿠키 획득
    const r1 = await fetch("https://fc.yahoo.com", {
      headers: BASE_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    // set-cookie 헤더에서 첫 번째 쿠키만 추출
    const rawCookie = r1.headers.get("set-cookie") ?? "";
    _cookie = rawCookie.split(",").map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");

    // 2) crumb 획득
    const r2 = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { ...BASE_HEADERS, Cookie: _cookie },
      signal: AbortSignal.timeout(5000),
    });
    if (!r2.ok) return false;

    _crumb  = (await r2.text()).trim();
    _expiry = Date.now() + 50 * 60 * 1000; // 50분 캐시
    return _crumb.length > 0;
  } catch {
    return false;
  }
}

async function searchYahoo(q: string): Promise<object[] | null> {
  // crumb 만료 시 갱신
  if (!_crumb || Date.now() > _expiry) {
    const ok = await refreshCrumb();
    if (!ok) return null;
  }

  const url =
    `https://query2.finance.yahoo.com/v1/finance/search` +
    `?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0` +
    `&enableFuzzyQuery=false&enableCb=false&enableNavLinks=false` +
    `&crumb=${encodeURIComponent(_crumb)}`;

  const res = await fetch(url, {
    headers: { ...BASE_HEADERS, Cookie: _cookie },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });

  // 401/400 → crumb 재발급 후 1회 재시도
  if (res.status === 401 || res.status === 400) {
    const ok = await refreshCrumb();
    if (!ok) return null;

    const url2 =
      `https://query2.finance.yahoo.com/v1/finance/search` +
      `?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0` +
      `&crumb=${encodeURIComponent(_crumb)}`;
    const res2 = await fetch(url2, {
      headers: { ...BASE_HEADERS, Cookie: _cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res2.ok) return null;
    const d2 = await res2.json();
    return d2?.quotes ?? [];
  }

  if (!res.ok) return null;
  const data = await res.json();
  return data?.quotes ?? [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ ok: false, items: [] });

  try {
    const quotes = await searchYahoo(q);
    if (!quotes) return NextResponse.json({ ok: false, items: [] });

    const items = quotes
      .filter((q: unknown) => {
        const item = q as Record<string, unknown>;
        return item.quoteType === "EQUITY" || item.quoteType === "ETF";
      })
      .map((q: unknown) => {
        const item     = q as Record<string, unknown>;
        const exchange = (item.exchange as string) ?? "";
        const symbol   = String(item.symbol ?? "");
        const isKR     = exchange === "KSC" || exchange === "KOE"
                      || symbol.endsWith(".KS") || symbol.endsWith(".KQ");
        const isETF    = item.quoteType === "ETF";
        return {
          ticker: symbol,
          name:   (item.shortname ?? item.longname ?? symbol) as string,
          exchange,
          market: isKR ? "KR" : isETF ? "ETF" : "US",
        };
      });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    // 비치명적 오류 — 로컬 검색 결과로 충분히 커버됨
    console.warn("stock-search:", e instanceof Error ? e.message : String(e));
    return NextResponse.json({ ok: false, items: [] });
  }
}
