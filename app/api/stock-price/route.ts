import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
  "Referer": "https://finance.yahoo.com/",
  "Origin": "https://finance.yahoo.com",
};

async function fetchOne(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPreviousClose ?? meta.regularMarketPrice;
    const price = meta.regularMarketPrice;
    const change = price - prev;
    const changePercent = prev ? (change / prev) * 100 : 0;

    return {
      ticker,
      name: (meta.shortName ?? meta.longName ?? ticker) as string,
      price: price as number,
      change,
      changePercent,
      prevClose: prev as number,
      currency: (meta.currency ?? "USD") as string,
      marketState: (meta.marketState ?? "REGULAR") as string,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("tickers") ?? searchParams.get("ticker") ?? "";
  if (!raw) return NextResponse.json({ ok: false, error: "tickers required" }, { status: 400 });

  const tickers = raw.split(",").map(t => t.trim()).filter(Boolean);

  const results = await Promise.all(tickers.map(fetchOne));
  const items = results.filter(Boolean);

  return NextResponse.json({ ok: true, items });
}
