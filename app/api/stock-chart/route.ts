import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": "https://finance.yahoo.com/",
};

const RANGE_CONFIG: Record<string, { interval: string }> = {
  "1d":  { interval: "5m"  },
  "5d":  { interval: "30m" },
  "1mo": { interval: "1d"  },
  "3mo": { interval: "1d"  },
  "1y":  { interval: "1wk" },
  "5y":  { interval: "1mo" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const range  = searchParams.get("range") ?? "1mo";
  if (!ticker) return NextResponse.json({ ok: false }, { status: 400 });

  const { interval } = RANGE_CONFIG[range] ?? { interval: "1d" };
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;

  try {
    const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("no result");

    const timestamps: number[]       = result.timestamp ?? [];
    const closes: (number | null)[]  = result.indicators?.quote?.[0]?.close ?? [];
    const highs:  (number | null)[]  = result.indicators?.quote?.[0]?.high  ?? [];
    const lows:   (number | null)[]  = result.indicators?.quote?.[0]?.low   ?? [];
    const volumes:(number | null)[]  = result.indicators?.quote?.[0]?.volume ?? [];

    const points = timestamps
      .map((t, i) => ({
        t: t * 1000,
        c: closes[i],
        h: highs[i],
        l: lows[i],
        v: volumes[i],
      }))
      .filter(p => p.c != null);

    const meta = result.meta ?? {};

    return NextResponse.json({
      ok: true,
      ticker,
      range,
      points,
      meta: {
        currency:              meta.currency,
        regularMarketPrice:    meta.regularMarketPrice,
        chartPreviousClose:    meta.chartPreviousClose ?? meta.previousClose,
        regularMarketDayHigh:  meta.regularMarketDayHigh,
        regularMarketDayLow:   meta.regularMarketDayLow,
        fiftyTwoWeekHigh:      meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow:       meta.fiftyTwoWeekLow,
        regularMarketVolume:   meta.regularMarketVolume,
        shortName:             meta.shortName ?? meta.longName,
        marketState:           meta.marketState,
      },
    });
  } catch (e) {
    console.error("stock-chart error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
