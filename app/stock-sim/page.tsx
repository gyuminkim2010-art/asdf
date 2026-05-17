"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ══════════════════════════════════════════
   종목 데이터
══════════════════════════════════════════ */
type Market = "KR" | "US" | "ETF";
type StockMeta = { ticker: string; name: string; market: Market | string };

const POPULAR: StockMeta[] = [
  // ── KOSPI ──
  { ticker:"005930.KS", name:"삼성전자",          market:"KR" },
  { ticker:"000660.KS", name:"SK하이닉스",        market:"KR" },
  { ticker:"207940.KS", name:"삼성바이오로직스",   market:"KR" },
  { ticker:"373220.KS", name:"LG에너지솔루션",    market:"KR" },
  { ticker:"005380.KS", name:"현대차",             market:"KR" },
  { ticker:"000270.KS", name:"기아",               market:"KR" },
  { ticker:"068270.KS", name:"셀트리온",           market:"KR" },
  { ticker:"035420.KS", name:"NAVER",              market:"KR" },
  { ticker:"051910.KS", name:"LG화학",             market:"KR" },
  { ticker:"035720.KS", name:"카카오",             market:"KR" },
  { ticker:"006400.KS", name:"삼성SDI",            market:"KR" },
  { ticker:"034730.KS", name:"SK",                 market:"KR" },
  { ticker:"003550.KS", name:"LG",                 market:"KR" },
  { ticker:"105560.KS", name:"KB금융",             market:"KR" },
  { ticker:"055550.KS", name:"신한지주",           market:"KR" },
  { ticker:"086790.KS", name:"하나금융지주",       market:"KR" },
  { ticker:"316140.KS", name:"우리금융지주",       market:"KR" },
  { ticker:"024110.KS", name:"기업은행",           market:"KR" },
  { ticker:"017670.KS", name:"SK텔레콤",           market:"KR" },
  { ticker:"030200.KS", name:"KT",                 market:"KR" },
  { ticker:"066570.KS", name:"LG전자",             market:"KR" },
  { ticker:"018260.KS", name:"삼성SDS",            market:"KR" },
  { ticker:"028260.KS", name:"삼성물산",           market:"KR" },
  { ticker:"096770.KS", name:"SK이노베이션",       market:"KR" },
  { ticker:"009150.KS", name:"삼성전기",           market:"KR" },
  { ticker:"011070.KS", name:"LG이노텍",           market:"KR" },
  { ticker:"000810.KS", name:"삼성화재",           market:"KR" },
  { ticker:"032830.KS", name:"삼성생명",           market:"KR" },
  { ticker:"005830.KS", name:"DB손해보험",         market:"KR" },
  { ticker:"071050.KS", name:"한국금융지주",       market:"KR" },
  { ticker:"010950.KS", name:"S-Oil",              market:"KR" },
  { ticker:"015760.KS", name:"한국전력",           market:"KR" },
  { ticker:"009540.KS", name:"HD한국조선해양",     market:"KR" },
  { ticker:"042660.KS", name:"한화오션",           market:"KR" },
  { ticker:"010140.KS", name:"삼성중공업",         market:"KR" },
  { ticker:"012330.KS", name:"현대모비스",         market:"KR" },
  { ticker:"047050.KS", name:"포스코인터내셔널",   market:"KR" },
  { ticker:"003490.KS", name:"대한항공",           market:"KR" },
  { ticker:"036570.KS", name:"엔씨소프트",         market:"KR" },
  { ticker:"259960.KS", name:"크래프톤",           market:"KR" },
  { ticker:"139480.KS", name:"이마트",             market:"KR" },
  { ticker:"004020.KS", name:"현대제철",           market:"KR" },
  { ticker:"097950.KS", name:"CJ제일제당",         market:"KR" },
  { ticker:"271560.KS", name:"오리온",             market:"KR" },
  { ticker:"090430.KS", name:"아모레퍼시픽",       market:"KR" },
  { ticker:"000720.KS", name:"현대건설",           market:"KR" },
  { ticker:"028050.KS", name:"삼성엔지니어링",     market:"KR" },
  { ticker:"042700.KS", name:"한미반도체",         market:"KR" },
  { ticker:"011200.KS", name:"HMM",                market:"KR" },
  { ticker:"021240.KS", name:"코웨이",             market:"KR" },
  { ticker:"033780.KS", name:"KT&G",               market:"KR" },
  { ticker:"010130.KS", name:"고려아연",           market:"KR" },
  // ── KOSDAQ ──
  { ticker:"247540.KQ", name:"에코프로비엠",       market:"KR" },
  { ticker:"086520.KQ", name:"에코프로",           market:"KR" },
  { ticker:"196170.KQ", name:"알테오젠",           market:"KR" },
  { ticker:"263750.KQ", name:"펄어비스",           market:"KR" },
  { ticker:"293490.KQ", name:"카카오게임즈",       market:"KR" },
  { ticker:"035900.KQ", name:"JYP Ent.",           market:"KR" },
  { ticker:"041510.KQ", name:"SM엔터테인먼트",     market:"KR" },
  { ticker:"352820.KQ", name:"하이브",             market:"KR" },
  { ticker:"112040.KQ", name:"위메이드",           market:"KR" },
  { ticker:"145020.KQ", name:"휴젤",               market:"KR" },
  { ticker:"091990.KQ", name:"셀트리온헬스케어",   market:"KR" },
  { ticker:"357780.KQ", name:"솔브레인",           market:"KR" },
  { ticker:"039030.KQ", name:"이오테크닉스",       market:"KR" },
  // ── 미국 빅테크 ──
  { ticker:"AAPL",  name:"Apple",                  market:"US" },
  { ticker:"MSFT",  name:"Microsoft",              market:"US" },
  { ticker:"NVDA",  name:"NVIDIA",                 market:"US" },
  { ticker:"GOOGL", name:"Alphabet A",             market:"US" },
  { ticker:"GOOG",  name:"Alphabet C",             market:"US" },
  { ticker:"AMZN",  name:"Amazon",                 market:"US" },
  { ticker:"META",  name:"Meta",                   market:"US" },
  { ticker:"TSLA",  name:"Tesla",                  market:"US" },
  { ticker:"TSM",   name:"TSMC",                   market:"US" },
  { ticker:"AVGO",  name:"Broadcom",               market:"US" },
  { ticker:"ORCL",  name:"Oracle",                 market:"US" },
  { ticker:"ADBE",  name:"Adobe",                  market:"US" },
  { ticker:"CRM",   name:"Salesforce",             market:"US" },
  { ticker:"AMD",   name:"AMD",                    market:"US" },
  { ticker:"QCOM",  name:"Qualcomm",               market:"US" },
  { ticker:"INTC",  name:"Intel",                  market:"US" },
  { ticker:"MU",    name:"Micron",                 market:"US" },
  { ticker:"AMAT",  name:"Applied Materials",      market:"US" },
  { ticker:"LRCX",  name:"Lam Research",           market:"US" },
  { ticker:"KLAC",  name:"KLA Corp",               market:"US" },
  { ticker:"ASML",  name:"ASML",                   market:"US" },
  { ticker:"NOW",   name:"ServiceNow",             market:"US" },
  { ticker:"INTU",  name:"Intuit",                 market:"US" },
  { ticker:"PANW",  name:"Palo Alto Networks",     market:"US" },
  { ticker:"CRWD",  name:"CrowdStrike",            market:"US" },
  { ticker:"ZS",    name:"Zscaler",                market:"US" },
  { ticker:"NET",   name:"Cloudflare",             market:"US" },
  { ticker:"DDOG",  name:"Datadog",                market:"US" },
  { ticker:"SNOW",  name:"Snowflake",              market:"US" },
  { ticker:"PLTR",  name:"Palantir",               market:"US" },
  { ticker:"COIN",  name:"Coinbase",               market:"US" },
  { ticker:"SHOP",  name:"Shopify",                market:"US" },
  { ticker:"MELI",  name:"MercadoLibre",           market:"US" },
  { ticker:"UBER",  name:"Uber",                   market:"US" },
  { ticker:"LYFT",  name:"Lyft",                   market:"US" },
  { ticker:"ABNB",  name:"Airbnb",                 market:"US" },
  { ticker:"RBLX",  name:"Roblox",                 market:"US" },
  { ticker:"HOOD",  name:"Robinhood",              market:"US" },
  // ── 금융 ──
  { ticker:"BRK-B", name:"Berkshire Hathaway",     market:"US" },
  { ticker:"JPM",   name:"JPMorgan Chase",         market:"US" },
  { ticker:"BAC",   name:"Bank of America",        market:"US" },
  { ticker:"WFC",   name:"Wells Fargo",            market:"US" },
  { ticker:"GS",    name:"Goldman Sachs",          market:"US" },
  { ticker:"MS",    name:"Morgan Stanley",         market:"US" },
  { ticker:"BLK",   name:"BlackRock",              market:"US" },
  { ticker:"V",     name:"Visa",                   market:"US" },
  { ticker:"MA",    name:"Mastercard",             market:"US" },
  { ticker:"PYPL",  name:"PayPal",                 market:"US" },
  { ticker:"AXP",   name:"American Express",       market:"US" },
  { ticker:"COF",   name:"Capital One",            market:"US" },
  { ticker:"SCHW",  name:"Charles Schwab",         market:"US" },
  { ticker:"SPGI",  name:"S&P Global",             market:"US" },
  // ── 헬스케어 ──
  { ticker:"UNH",   name:"UnitedHealth",           market:"US" },
  { ticker:"LLY",   name:"Eli Lilly",              market:"US" },
  { ticker:"JNJ",   name:"Johnson & Johnson",      market:"US" },
  { ticker:"ABBV",  name:"AbbVie",                 market:"US" },
  { ticker:"MRK",   name:"Merck",                  market:"US" },
  { ticker:"PFE",   name:"Pfizer",                 market:"US" },
  { ticker:"AMGN",  name:"Amgen",                  market:"US" },
  { ticker:"GILD",  name:"Gilead Sciences",        market:"US" },
  { ticker:"VRTX",  name:"Vertex Pharma",          market:"US" },
  { ticker:"REGN",  name:"Regeneron",              market:"US" },
  { ticker:"MRNA",  name:"Moderna",                market:"US" },
  { ticker:"ISRG",  name:"Intuitive Surgical",     market:"US" },
  { ticker:"MDT",   name:"Medtronic",              market:"US" },
  { ticker:"SYK",   name:"Stryker",                market:"US" },
  { ticker:"DHR",   name:"Danaher",                market:"US" },
  { ticker:"TMO",   name:"Thermo Fisher",          market:"US" },
  // ── 소비재 ──
  { ticker:"WMT",   name:"Walmart",                market:"US" },
  { ticker:"COST",  name:"Costco",                 market:"US" },
  { ticker:"TGT",   name:"Target",                 market:"US" },
  { ticker:"HD",    name:"Home Depot",             market:"US" },
  { ticker:"LOW",   name:"Lowe's",                 market:"US" },
  { ticker:"MCD",   name:"McDonald's",             market:"US" },
  { ticker:"SBUX",  name:"Starbucks",              market:"US" },
  { ticker:"NKE",   name:"Nike",                   market:"US" },
  { ticker:"LULU",  name:"Lululemon",              market:"US" },
  { ticker:"KO",    name:"Coca-Cola",              market:"US" },
  { ticker:"PEP",   name:"PepsiCo",                market:"US" },
  { ticker:"PG",    name:"Procter & Gamble",       market:"US" },
  { ticker:"PM",    name:"Philip Morris",          market:"US" },
  // ── 에너지 ──
  { ticker:"XOM",   name:"ExxonMobil",             market:"US" },
  { ticker:"CVX",   name:"Chevron",                market:"US" },
  { ticker:"COP",   name:"ConocoPhillips",         market:"US" },
  { ticker:"SLB",   name:"SLB",                    market:"US" },
  { ticker:"OXY",   name:"Occidental Petroleum",   market:"US" },
  // ── 산업·항공·미디어 ──
  { ticker:"BA",    name:"Boeing",                 market:"US" },
  { ticker:"CAT",   name:"Caterpillar",            market:"US" },
  { ticker:"GE",    name:"GE Aerospace",           market:"US" },
  { ticker:"HON",   name:"Honeywell",              market:"US" },
  { ticker:"RTX",   name:"RTX Corp",               market:"US" },
  { ticker:"LMT",   name:"Lockheed Martin",        market:"US" },
  { ticker:"NOC",   name:"Northrop Grumman",       market:"US" },
  { ticker:"UPS",   name:"UPS",                    market:"US" },
  { ticker:"FDX",   name:"FedEx",                  market:"US" },
  { ticker:"DAL",   name:"Delta Air Lines",        market:"US" },
  { ticker:"NFLX",  name:"Netflix",                market:"US" },
  { ticker:"DIS",   name:"Disney",                 market:"US" },
  { ticker:"CMCSA", name:"Comcast",                market:"US" },
  { ticker:"T",     name:"AT&T",                   market:"US" },
  { ticker:"VZ",    name:"Verizon",                market:"US" },
  { ticker:"SPOT",  name:"Spotify",                market:"US" },
  { ticker:"NEE",   name:"NextEra Energy",         market:"US" },
  { ticker:"AMT",   name:"American Tower",         market:"US" },
  // ── ETF ──
  { ticker:"SPY",   name:"S&P 500 ETF",            market:"ETF" },
  { ticker:"QQQ",   name:"NASDAQ 100 ETF",         market:"ETF" },
  { ticker:"VOO",   name:"Vanguard S&P 500",       market:"ETF" },
  { ticker:"VTI",   name:"Total Market ETF",       market:"ETF" },
  { ticker:"IWM",   name:"Russell 2000 ETF",       market:"ETF" },
  { ticker:"VEA",   name:"선진국 ETF",              market:"ETF" },
  { ticker:"VWO",   name:"신흥국 ETF",              market:"ETF" },
  { ticker:"EEM",   name:"신흥시장 ETF",            market:"ETF" },
  { ticker:"GLD",   name:"Gold ETF",               market:"ETF" },
  { ticker:"SLV",   name:"Silver ETF",             market:"ETF" },
  { ticker:"TLT",   name:"장기국채 ETF",            market:"ETF" },
  { ticker:"HYG",   name:"하이일드채권 ETF",        market:"ETF" },
  { ticker:"USO",   name:"Oil ETF",                market:"ETF" },
  { ticker:"XLK",   name:"기술주 ETF",              market:"ETF" },
  { ticker:"XLF",   name:"금융주 ETF",              market:"ETF" },
  { ticker:"XLE",   name:"에너지 ETF",              market:"ETF" },
  { ticker:"XLV",   name:"헬스케어 ETF",            market:"ETF" },
  { ticker:"XLI",   name:"산업주 ETF",              market:"ETF" },
  { ticker:"ARKK",  name:"ARK Innovation ETF",     market:"ETF" },
  { ticker:"ARKG",  name:"ARK Genomics ETF",       market:"ETF" },
  { ticker:"SOXL",  name:"반도체 3× ETF",           market:"ETF" },
  { ticker:"SOXS",  name:"반도체 인버스 3× ETF",    market:"ETF" },
  { ticker:"TQQQ",  name:"NASDAQ 3× ETF",          market:"ETF" },
  { ticker:"SPXL",  name:"S&P 3× ETF",             market:"ETF" },
  { ticker:"UVXY",  name:"VIX ETF",                market:"ETF" },
];

const INDICES = [
  { ticker:"^KS11",  name:"KOSPI"    },
  { ticker:"^KQ11",  name:"KOSDAQ"   },
  { ticker:"^GSPC",  name:"S&P 500"  },
  { ticker:"^IXIC",  name:"NASDAQ"   },
  { ticker:"^DJI",   name:"다우존스" },
];

/* ══════════════════════════════════════════
   타입
══════════════════════════════════════════ */
type PriceInfo = { ticker:string; name:string; price:number; change:number; changePercent:number; currency:string; marketState:string };
type Holding   = { id:number; ticker:string; name:string; market:string; quantity:number; avgPrice:number };
type Portfolio = { id:number; cash:number; holdings:Holding[] };
type Trade     = { id:number; ticker:string; name:string; market:string; type:"BUY"|"SELL"; quantity:number; price:number; total:number; createdAt:string };
type ChartPt      = { t:number; c:number };
type ChartRange   = "1d"|"5d"|"1mo"|"3mo"|"1y"|"5y";
type SortKey      = "default"|"change"|"price";
type OrderType    = "MARKET"|"LIMIT"|"RESERVE";
type MarketState  = "open"|"pre"|"after"|"closed";
type PendingOrder = { id:string; ticker:string; name:string; market:string; type:"BUY"|"SELL"; orderType:OrderType; quantity:number; limitPrice:number; createdAt:string };

/* ══════════════════════════════════════════
   유틸
══════════════════════════════════════════ */
const KRW_FB = 1380;
function fmtKRW(n:number){ if(Math.abs(n)>=1e8) return (n/1e8).toFixed(1)+"억원"; if(Math.abs(n)>=1e4) return Math.round(n/1e4)+"만원"; return n.toLocaleString("ko-KR")+"원"; }
function fmtUSD(n:number){ return "$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function toKRW(p:number,cur:string,rate:number){ return cur==="KRW"?p:p*rate; }
function pct(n:number){ return (n>=0?"+":"")+n.toFixed(2)+"%" }

/* ── 장 운영시간 계산 ── */
function getMarketStatus():{kr:MarketState;us:MarketState}{
  const now=new Date();
  const tz=(zone:string)=>{
    const parts=new Intl.DateTimeFormat("en-US",{timeZone:zone,hour:"2-digit",minute:"2-digit",weekday:"short",hour12:false}).formatToParts(now);
    const h=parseInt(parts.find(p=>p.type==="hour")?.value??"0");
    const m=parseInt(parts.find(p=>p.type==="minute")?.value??"0");
    const wd=parts.find(p=>p.type==="weekday")?.value??"";
    return{h,m,isWd:!["Sat","Sun"].includes(wd)};
  };
  const{h:kH,m:kM,isWd:kW}=tz("Asia/Seoul");
  const{h:uH,m:uM,isWd:uW}=tz("America/New_York");
  // KR: 장전동시호가 08:30~09:00, 정규장 09:00~15:30, 시간외 15:30~18:00
  const kr:MarketState=!kW?"closed":
    (kH===8&&kM>=30)||kH===8&&kM<60?"pre":  // 08:30 이후 pre 처리
    kH>=9&&(kH<15||(kH===15&&kM<30))?"open":
    (kH===15&&kM>=30)||(kH>15&&kH<18)?"after":"closed";
  // US: 프리마켓 04:00~09:30, 정규장 09:30~16:00, 애프터 16:00~20:00
  const us:MarketState=!uW?"closed":
    uH>=4&&(uH<9||(uH===9&&uM<30))?"pre":
    (uH>9||(uH===9&&uM>=30))&&uH<16?"open":
    uH>=16&&uH<20?"after":"closed";
  return{kr,us};
}

/* ══════════════════════════════════════════
   SVG 차트
══════════════════════════════════════════ */
function AreaChart({points,isUp}:{points:ChartPt[];isUp:boolean}){
  if(points.length<2) return <div className="h-40 flex items-center justify-center text-xs text-white/22">데이터 없음</div>;
  const prices=points.map(p=>p.c), min=Math.min(...prices), max=Math.max(...prices), rng=max-min||1;
  const W=400,H=130,PX=2,PY=8;
  const tx=(i:number)=>PX+(i/(points.length-1))*(W-PX*2);
  const ty=(p:number)=>PY+(1-(p-min)/rng)*(H-PY*2);
  const line=points.map((pt,i)=>`${i===0?"M":"L"} ${tx(i).toFixed(1)} ${ty(pt.c).toFixed(1)}`).join(" ");
  const area=`${line} L ${tx(points.length-1).toFixed(1)} ${H} L ${PX} ${H} Z`;
  const color=isUp?"#ef4444":"#3b82f6";
  const gid=`g${isUp?"u":"d"}`;
  return(
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
        <stop offset="100%" stopColor={color} stopOpacity="0.01"/>
      </linearGradient></defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ══════════════════════════════════════════
   종목 카드 (공통)
══════════════════════════════════════════ */
function StockCard({s,p,exRate,onClick,watched,onWatch,isCustom,onRemove,onObserve}:{
  s:StockMeta; p:PriceInfo|undefined; exRate:number;
  onClick:()=>void; watched:boolean; onWatch:(e:React.MouseEvent)=>void;
  isCustom?:boolean; onRemove?:(e:React.MouseEvent)=>void;
  onObserve?:(el:HTMLDivElement|null)=>void;
}){
  const up=p&&p.changePercent>=0;
  const cur=p?.currency??(s.market==="KR"?"KRW":"USD");
  const krwPrice=p?Math.round(toKRW(p.price,cur,exRate)):null;
  return(
    <motion.div ref={(el)=>onObserve?.(el as HTMLDivElement|null)} data-ticker={s.ticker}
      whileTap={{scale:0.98}} className="relative rounded-2xl border border-white/[0.07] bg-white/[0.06] px-4 py-3 hover:bg-white/[0.09] transition-colors cursor-pointer active:scale-[0.98] group"
      onClick={onClick}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white truncate">{s.name}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
              s.market==="KR"?"bg-blue-500/15 text-blue-400":s.market==="ETF"?"bg-purple-500/15 text-purple-400":"bg-red-500/15 text-red-400"
            }`}>{s.market}</span>
            {isCustom&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 shrink-0">추가됨</span>}
          </div>
          <p className="text-[10px] text-white/22 font-mono mt-0.5">{s.ticker}</p>
        </div>
        <div className="text-right shrink-0">
          {p?(
            <>
              <p className="text-sm font-black text-white">{cur==="KRW"?p.price.toLocaleString("ko-KR")+"원":fmtUSD(p.price)}</p>
              {cur!=="KRW"&&krwPrice&&<p className="text-[10px] text-white/22">≈{krwPrice.toLocaleString("ko-KR")}원</p>}
              <p className={`text-xs font-semibold ${up?"text-red-500":"text-blue-500"}`}>{up?"▲":"▼"} {Math.abs(p.changePercent).toFixed(2)}%</p>
            </>
          ):<p className="text-xs text-white/18">—</p>}
        </div>
        <div className="shrink-0 ml-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onWatch} className="text-base leading-none">{watched?"⭐":"☆"}</button>
          {isCustom&&onRemove&&(
            <button onClick={onRemove} className="text-[10px] text-white/22 hover:text-red-400 leading-none">✕</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   주요 지수 바
══════════════════════════════════════════ */
function IndicesBar({prices}:{prices:Record<string,PriceInfo>}){
  return(
    <div className="flex gap-4 overflow-x-auto scrollbar-none py-1">
      {INDICES.map(idx=>{
        const p=prices[idx.ticker];
        const up=p&&p.changePercent>=0;
        return(
          <div key={idx.ticker} className="shrink-0 text-center min-w-[72px]">
            <p className="text-[10px] text-white/28 font-semibold">{idx.name}</p>
            {p?(
              <>
                <p className="text-xs font-black text-white">{p.price.toLocaleString("ko-KR",{maximumFractionDigits:2})}</p>
                <p className={`text-[10px] font-semibold ${up?"text-red-500":"text-blue-500"}`}>{up?"▲":"▼"}{Math.abs(p.changePercent).toFixed(2)}%</p>
              </>
            ):<p className="text-[10px] text-white/18">—</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   상세 패널 (PC + 모바일 공용)
══════════════════════════════════════════ */
function DetailPanel({
  selStock,selPrice,exRate,portfolio,marketStatus,
  chartPts,chartLoading,chartRange,setChartRange,chartMeta,
  qty,setQty,tradeType,setTradeType,
  orderType,setOrderType,limitPrice,setLimitPrice,
  tradeLoading,executeTrade,onClose,
}:{
  selStock:StockMeta; selPrice:PriceInfo|null; exRate:number; portfolio:Portfolio|null;
  marketStatus:{kr:MarketState;us:MarketState};
  chartPts:ChartPt[]; chartLoading:boolean; chartRange:ChartRange; setChartRange:(r:ChartRange)=>void;
  chartMeta:Record<string,number|string>;
  qty:string; setQty:(q:string)=>void; tradeType:"BUY"|"SELL"; setTradeType:(t:"BUY"|"SELL")=>void;
  orderType:OrderType; setOrderType:(t:OrderType)=>void; limitPrice:string; setLimitPrice:(p:string)=>void;
  tradeLoading:boolean; executeTrade:()=>void; onClose:()=>void;
}){
  const isUp=(selPrice?.changePercent??0)>=0;
  const cur=selPrice?.currency??(selStock.market==="KR"?"KRW":"USD");
  const holding=portfolio?.holdings.find(h=>h.ticker===selStock.ticker);
  const qtyNum=parseInt(qty)||0;
  const execPrice=orderType==="MARKET"?(selPrice?.price??0):parseFloat(limitPrice.replace(/,/g,""))||0;
  const cost=Math.round(toKRW(execPrice*qtyNum,cur,exRate));

  // 장 상태 배지
  const ms=selStock.market==="KR"?marketStatus.kr:marketStatus.us;
  const msBadge:{label:string;cls:string}=
    ms==="open"?{label:"장중",cls:"bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}:
    ms==="pre" ?{label:"장전",cls:"bg-amber-500/15 text-amber-400 border-amber-500/30"}:
    ms==="after"?{label:"시간외",cls:"bg-purple-500/15 text-purple-400 border-purple-500/30"}:
                 {label:"장마감",cls:"bg-white/[0.05] text-white/28 border-white/10"};

  return(
    <div className="space-y-3">
      {/* 종목명·닫기 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black text-white">{selStock.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${msBadge.cls}`}>{msBadge.label}</span>
          </div>
          <p className="text-xs text-white/28 font-mono">{selStock.ticker} · {selStock.market}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-sm text-white/45 hover:bg-white/15 transition-colors shrink-0">✕</button>
      </div>

      {/* 현재가 */}
      {selPrice?(
        <div>
          <div className="flex items-end gap-2 flex-wrap">
            <p className="text-3xl font-black text-white">{cur==="KRW"?selPrice.price.toLocaleString("ko-KR")+"원":fmtUSD(selPrice.price)}</p>
            <p className={`text-sm font-black pb-1 ${isUp?"text-red-500":"text-blue-500"}`}>{isUp?"▲":"▼"} {Math.abs(selPrice.changePercent).toFixed(2)}%</p>
          </div>
          {cur!=="KRW"&&<p className="text-sm text-white/40">≈ {Math.round(selPrice.price*exRate).toLocaleString("ko-KR")}원</p>}
          <p className={`text-xs mt-0.5 ${isUp?"text-red-400":"text-blue-400"}`}>전일대비 {selPrice.change>=0?"+":""}{cur==="KRW"?selPrice.change.toFixed(0)+"원":fmtUSD(selPrice.change)}</p>
        </div>
      ):<div className="h-14 animate-pulse bg-white/[0.05] rounded-2xl"/>}

      {/* 차트 범위 */}
      <div className="flex gap-1">
        {(["1d","5d","1mo","3mo","1y","5y"] as ChartRange[]).map(r=>(
          <button key={r} onClick={()=>setChartRange(r)}
            className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all ${chartRange===r?"bg-white/15 text-white":"bg-white/[0.05] text-white/40 hover:bg-white/[0.09]"}`}>
            {r==="1d"?"1일":r==="5d"?"5일":r==="1mo"?"1달":r==="3mo"?"3달":r==="1y"?"1년":"5년"}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] px-2 pt-2 pb-1">
        {chartLoading
          ?<div className="h-40 flex items-center justify-center text-xs text-white/22">로딩중...</div>
          :<AreaChart points={chartPts} isUp={isUp}/>}
        {chartPts.length>1&&(
          <div className="flex justify-between text-[10px] text-white/22 px-1 pb-1">
            <span>저 {Math.min(...chartPts.map(p=>p.c)).toLocaleString()}</span>
            <span>고 {Math.max(...chartPts.map(p=>p.c)).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* 종목 정보 */}
      {Object.keys(chartMeta).length>0&&(
        <div className="grid grid-cols-2 gap-1.5">
          {[
            {label:"전일 종가", val:chartMeta.chartPreviousClose},
            {label:"52주 고가", val:chartMeta.fiftyTwoWeekHigh},
            {label:"52주 저가", val:chartMeta.fiftyTwoWeekLow},
            {label:"거래량",    val:chartMeta.regularMarketVolume},
          ].filter(i=>i.val).map(item=>(
            <div key={item.label} className="rounded-xl border border-white/[0.07] bg-white/[0.05] px-3 py-2">
              <p className="text-[10px] text-white/22">{item.label}</p>
              <p className="text-xs font-bold text-white/70 mt-0.5">{Number(item.val).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* 매수/매도 + 주문방식 */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-2.5">

        {/* 매수/매도 탭 */}
        <div className="flex gap-1.5">
          {(["BUY","SELL"] as const).map(t=>(
            <button key={t} onClick={()=>setTradeType(t)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-black transition-all ${
                tradeType===t?(t==="BUY"?"bg-red-500 text-white":"bg-blue-500 text-white"):"bg-white/[0.06] text-white/28 border border-white/[0.07]"
              }`}>{t==="BUY"?"매수":"매도"}</button>
          ))}
        </div>

        {/* 주문방식 탭 */}
        <div className="flex gap-1 rounded-xl bg-white/[0.05] border border-white/[0.07] p-1">
          {([
            {v:"MARKET" as OrderType, label:"시장가"},
            {v:"LIMIT"  as OrderType, label:"지정가"},
            {v:"RESERVE"as OrderType, label:"예약"},
          ]).map(({v,label})=>(
            <button key={v} onClick={()=>setOrderType(v)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${orderType===v?"bg-white/15 text-white shadow-sm":"text-white/40 hover:text-white/60"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* 주문방식 설명 */}
        <p className="text-[10px] text-white/22 text-center -mt-1">
          {orderType==="MARKET"?"현재 시장가로 즉시 체결":
           orderType==="LIMIT" ?"지정가에 도달하면 자동 체결":
                                "목표가를 설정해 조건 충족 시 체결"}
        </p>

        {/* 지정가/예약 입력 */}
        {orderType!=="MARKET"&&(
          <div className="space-y-1.5">
            {/* 조건 설명 */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/40">
                {orderType==="LIMIT"
                  ?(tradeType==="BUY"?"현재가 이하 도달 시 자동 매수":"현재가 이상 도달 시 자동 매도")
                  :"목표가 설정 (장 외 포함)"}
              </p>
              {/* 빠른 입력 버튼 */}
              {selPrice&&(
                <div className="flex gap-1">
                  {(tradeType==="BUY"?[-3,-1]:[1,3]).map(d=>(
                    <button key={d} onClick={()=>setLimitPrice(
                      cur==="KRW"
                        ?Math.round(selPrice.price*(1+d/100)).toString()
                        :(selPrice.price*(1+d/100)).toFixed(2)
                    )} className="rounded-lg bg-white/[0.06] border border-white/[0.09] px-2 py-0.5 text-[10px] font-bold text-white/45 hover:bg-white/[0.1]">
                      {d>0?"+":""}{d}%
                    </button>
                  ))}
                  <button onClick={()=>setLimitPrice(
                    cur==="KRW"?Math.round(selPrice.price).toString():selPrice.price.toFixed(2)
                  )} className="rounded-lg bg-white/[0.06] border border-white/[0.09] px-2 py-0.5 text-[10px] font-bold text-white/45 hover:bg-white/[0.1]">
                    현재가
                  </button>
                </div>
              )}
            </div>

            {/* 현재가 참고 표시 */}
            {selPrice&&(
              <p className="text-[10px] text-white/35 bg-white/[0.05] rounded-lg px-2.5 py-1.5">
                현재가
                <span className="font-black text-white/70 mx-1">
                  {cur==="KRW"?selPrice.price.toLocaleString("ko-KR")+"원":fmtUSD(selPrice.price)}
                </span>
                {cur!=="KRW"&&<span className="text-white/22">≈ {Math.round(selPrice.price*exRate).toLocaleString("ko-KR")}원</span>}
              </p>
            )}

            {/* 입력 필드 */}
            <div className="flex items-center gap-2">
              {cur!=="KRW"&&(
                <span className="text-sm font-black text-white/60 shrink-0">$</span>
              )}
              <input type="number" value={limitPrice} onChange={e=>setLimitPrice(e.target.value)}
                placeholder={selPrice
                  ?(cur==="KRW"?selPrice.price.toFixed(0):selPrice.price.toFixed(2))
                  :(cur==="KRW"?"원화 입력":"달러 입력")}
                step={cur==="KRW"?"100":"0.01"}
                className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm font-bold outline-none placeholder:text-white/18"/>
              <span className={`text-xs font-bold shrink-0 px-2 py-1 rounded-lg ${
                cur==="KRW"?"bg-blue-500/15 text-blue-400":"bg-emerald-500/15 text-emerald-400"
              }`}>{cur==="KRW"?"KRW":"USD"}</span>
            </div>

            {/* 목표가 vs 현재가 diff */}
            {selPrice&&limitPrice&&(
              <p className="text-[10px] text-white/22">
                현재가 대비
                <span className={`font-bold ml-1 ${((parseFloat(limitPrice)-selPrice.price)/selPrice.price)>=0?"text-red-400":"text-blue-400"}`}>
                  {((parseFloat(limitPrice)-selPrice.price)/selPrice.price*100).toFixed(2)}%
                </span>
                {cur!=="KRW"&&limitPrice&&(
                  <span className="ml-2 text-white/22">≈ {Math.round(parseFloat(limitPrice)*exRate).toLocaleString("ko-KR")}원</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* 수량 */}
        <div className="flex gap-2 items-center">
          <button onClick={()=>setQty(String(Math.max(1,parseInt(qty||"1")-1)))}
            className="w-10 h-10 rounded-xl border border-white/[0.09] bg-white/[0.06] text-lg font-bold text-white/60 hover:bg-white/[0.1] flex items-center justify-center shrink-0">−</button>
          <input type="number" value={qty} onChange={e=>setQty(e.target.value)} min="1"
            className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.05] px-3 py-2.5 text-center text-sm font-bold outline-none"/>
          <button onClick={()=>setQty(String(parseInt(qty||"1")+1))}
            className="w-10 h-10 rounded-xl border border-white/[0.09] bg-white/[0.06] text-lg font-bold text-white/60 hover:bg-white/[0.1] flex items-center justify-center shrink-0">+</button>
        </div>

        {/* 예상금액 */}
        {(orderType==="MARKET"?selPrice:limitPrice)&&qtyNum>0&&(
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/35">{orderType==="MARKET"?"예상 금액":"목표 금액"}</span>
            <span className="font-black text-white">{fmtKRW(cost)}</span>
          </div>
        )}

        {portfolio&&(
          <p className="text-xs text-white/22 text-center">
            {tradeType==="BUY"
              ?`보유 현금 ${fmtKRW(Math.round(portfolio.cash))}`
              :`보유 수량 ${holding?.quantity??0}주`}
          </p>
        )}

        <motion.button whileTap={{scale:0.97}} onClick={executeTrade} disabled={tradeLoading||(orderType==="MARKET"&&!selPrice)}
          className={`w-full rounded-xl py-3.5 text-sm font-black transition-colors ${
            tradeType==="BUY"?"bg-red-500 hover:bg-red-600 text-white":"bg-blue-500 hover:bg-blue-600 text-white"
          } disabled:opacity-40`}>
          {tradeLoading?"처리중...":
           orderType==="MARKET"?(tradeType==="BUY"?"시장가 매수":"시장가 매도"):
           orderType==="LIMIT" ?(tradeType==="BUY"?"지정가 매수 등록":"지정가 매도 등록"):
                                (tradeType==="BUY"?"예약 매수 등록":"예약 매도 등록")}
        </motion.button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   메인
══════════════════════════════════════════ */
export default function StockSimPage(){
  const [user,setUser]                 = useState<{id:number;nickname:string}|null|"loading">("loading");
  const [portfolio,setPortfolio]       = useState<Portfolio|null>(null);
  const [exRate,setExRate]             = useState(KRW_FB);
  const [prices,setPrices]             = useState<Record<string,PriceInfo>>({});
  const [idxPrices,setIdxPrices]       = useState<Record<string,PriceInfo>>({});
  const [activeTab,setActiveTab]       = useState<"market"|"holdings"|"history">("market");
  const [mktFilter,setMktFilter]       = useState<"ALL"|"KR"|"US"|"ETF">("ALL");
  const [sortKey,setSortKey]           = useState<SortKey>("default");
  const [search,setSearch]             = useState("");
  const [searchRes,setSearchRes]       = useState<StockMeta[]>([]);
  const [searchLoading,setSearchLoading] = useState(false);
  const [watchlist,setWatchlist]       = useState<string[]>([]);
  const [customStocks,setCustomStocks] = useState<StockMeta[]>([]);
  const [history,setHistory]           = useState<Trade[]>([]);
  const [selStock,setSelStock]         = useState<StockMeta|null>(null);
  const [selPrice,setSelPrice]         = useState<PriceInfo|null>(null);
  const [chartPts,setChartPts]         = useState<ChartPt[]>([]);
  const [chartRange,setChartRange]     = useState<ChartRange>("1mo");
  const [chartLoading,setChartLoading] = useState(false);
  const [chartMeta,setChartMeta]       = useState<Record<string,number|string>>({});
  const [qty,setQty]                   = useState("1");
  const [tradeType,setTradeType]       = useState<"BUY"|"SELL">("BUY");
  const [orderType,setOrderType]       = useState<OrderType>("MARKET");
  const [limitPrice,setLimitPrice]     = useState("");
  const [pendingOrders,setPendingOrders] = useState<PendingOrder[]>([]);
  const [marketStatus,setMarketStatus] = useState<{kr:MarketState;us:MarketState}>(()=>getMarketStatus());
  const [tradeLoading,setTradeLoading] = useState(false);
  const [showAnalysis,setShowAnalysis] = useState(false);
  const [toast,setToast]               = useState<{msg:string;ok:boolean}|null>(null);
  const searchTimer     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const displayListRef  = useRef<StockMeta[]>([]);
  const pricesRef       = useRef<Record<string,PriceInfo>>({});
  const cardObserverRef = useRef<IntersectionObserver|null>(null);
  const observeBatchRef = useRef<Set<string>>(new Set());
  const observeTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  const showToast=(msg:string,ok:boolean)=>{ setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  // 관심목록 + 커스텀 종목 + 예약주문 로컬스토리지
  useEffect(()=>{
    try{ const w=localStorage.getItem("stock-watchlist"); if(w) setWatchlist(JSON.parse(w)); }catch{}
    try{ const c=localStorage.getItem("stock-custom"); if(c) setCustomStocks(JSON.parse(c)); }catch{}
    try{ const p=localStorage.getItem("stock-pending"); if(p) setPendingOrders(JSON.parse(p)); }catch{}
  },[]);
  // 1분마다 장 상태 갱신
  useEffect(()=>{
    const t=setInterval(()=>setMarketStatus(getMarketStatus()),60_000);
    return()=>clearInterval(t);
  },[]);
  const toggleWatch=(ticker:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    setWatchlist(prev=>{
      const next=prev.includes(ticker)?prev.filter(t=>t!==ticker):[...prev,ticker];
      localStorage.setItem("stock-watchlist",JSON.stringify(next));
      return next;
    });
  };
  // POPULAR에 없는 종목을 커스텀 목록에 저장
  const saveCustomStock=useCallback((s:StockMeta)=>{
    if(POPULAR.find(p=>p.ticker===s.ticker)) return;
    setCustomStocks(prev=>{
      if(prev.find(p=>p.ticker===s.ticker)) return prev;
      const next=[s,...prev].slice(0,100); // 최대 100개
      localStorage.setItem("stock-custom",JSON.stringify(next));
      return next;
    });
  },[]);
  const removeCustomStock=(ticker:string,e:React.MouseEvent)=>{
    e.stopPropagation();
    setCustomStocks(prev=>{
      const next=prev.filter(s=>s.ticker!==ticker);
      localStorage.setItem("stock-custom",JSON.stringify(next));
      return next;
    });
  };

  // 세션
  useEffect(()=>{ fetch("/api/me").then(r=>r.json()).then(d=>setUser(d.ok?d.user:null)).catch(()=>setUser(null)); },[]);

  // 환율
  useEffect(()=>{
    fetch("/api/stock-price?tickers=KRW%3DX").then(r=>r.json()).then(d=>{
      if(d.ok&&d.items?.[0]) setExRate(d.items[0].price);
    });
  },[]);

  // 지수
  useEffect(()=>{
    const tickers=INDICES.map(i=>i.ticker).join(",");
    fetch(`/api/stock-price?tickers=${encodeURIComponent(tickers)}`).then(r=>r.json()).then(d=>{
      if(d.ok){ const m:Record<string,PriceInfo>={}; for(const i of d.items) m[i.ticker]=i; setIdxPrices(m); }
    });
  },[]);

  const loadPortfolio=useCallback(()=>{
    fetch("/api/stock-sim/portfolio").then(r=>r.json()).then(d=>{ if(d.ok) setPortfolio(d.portfolio); });
  },[]);
  const loadHistory=useCallback(()=>{
    fetch("/api/stock-sim/history").then(r=>r.json()).then(d=>{ if(d.ok) setHistory(d.trades); });
  },[]);
  useEffect(()=>{ if(user&&user!=="loading"){ loadPortfolio(); loadHistory(); } },[user,loadPortfolio,loadHistory]);

  const fetchPrices=useCallback(async(tickers:string[])=>{
    if(!tickers.length) return;
    for(let i=0;i<tickers.length;i+=10){
      const chunk=tickers.slice(i,i+10);
      const res=await fetch(`/api/stock-price?tickers=${chunk.join(",")}`);
      const data=await res.json();
      if(data.ok){ const m:Record<string,PriceInfo>={}; for(const it of data.items as PriceInfo[]) m[it.ticker]=it; setPrices(prev=>({...prev,...m})); }
    }
  },[]);

  // 탭·필터 변경 시 첫 30개 로드
  useEffect(()=>{
    if(activeTab==="market"&&!search){
      const popularTix=POPULAR.filter(s=>mktFilter==="ALL"||s.market===mktFilter).slice(0,28).map(s=>s.ticker);
      const customTix=customStocks.filter(s=>mktFilter==="ALL"||s.market===mktFilter).map(s=>s.ticker);
      fetchPrices([...new Set([...customTix,...popularTix])].slice(0,30));
    } else if(activeTab==="holdings"&&portfolio){
      fetchPrices(portfolio.holdings.map(h=>h.ticker));
    }
  },[activeTab,mktFilter,portfolio,search,fetchPrices,customStocks]);

  // 실시간 자동갱신 (30초)
  useEffect(()=>{
    const refresh=()=>{
      // 현재 보이는 종목 + 보유 종목 + 선택 종목
      const visibleTix=POPULAR.filter(s=>mktFilter==="ALL"||s.market===mktFilter).slice(0,20).map(s=>s.ticker);
      const holdingTix=(portfolio?.holdings??[]).map(h=>h.ticker);
      const selTix=selStock?[selStock.ticker]:[];
      const tix=[...new Set([...selTix,...holdingTix,...visibleTix])].slice(0,25);
      fetchPrices(tix);
      // 인덱스도 갱신
      fetch(`/api/stock-price?tickers=${INDICES.map(i=>i.ticker).join(",")}`).then(r=>r.json()).then(d=>{
        if(d.ok){ const m:Record<string,PriceInfo>={}; for(const i of d.items) m[i.ticker]=i; setIdxPrices(m); }
      });
    };
    const timer=setInterval(refresh,30_000);
    return()=>clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mktFilter,portfolio,selStock]);

  // 카드별 IntersectionObserver — 각 카드가 뷰포트에 들어오면 가격 자동 로드
  useEffect(()=>{
    cardObserverRef.current=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting) continue;
        const ticker=(entry.target as HTMLElement).dataset.ticker;
        cardObserverRef.current?.unobserve(entry.target);
        if(ticker&&!pricesRef.current[ticker]) observeBatchRef.current.add(ticker);
      }
      if(observeBatchRef.current.size===0) return;
      if(observeTimerRef.current) clearTimeout(observeTimerRef.current);
      observeTimerRef.current=setTimeout(()=>{
        const tickers=[...observeBatchRef.current];
        observeBatchRef.current.clear();
        if(tickers.length) fetchPrices(tickers);
      },150);
    },{rootMargin:"200px",threshold:0});
    return()=>{
      cardObserverRef.current?.disconnect();
      if(observeTimerRef.current) clearTimeout(observeTimerRef.current);
    };
  },[fetchPrices]);

  const observeCard=useCallback((el:HTMLDivElement|null,ticker:string)=>{
    if(!el) return;
    el.dataset.ticker=ticker;
    if(!pricesRef.current[ticker]) cardObserverRef.current?.observe(el);
  },[]);

  // 검색 — 로컬우선 + API fallback
  useEffect(()=>{
    if(searchTimer.current) clearTimeout(searchTimer.current);
    const q=search.trim();
    if(!q){ setSearchRes([]); return; }

    // 1) 즉시: 로컬 allStocks 이름/티커 필터 (한글 포함)
    const ql=q.toLowerCase();
    const localHits=allStocks.filter(s=>
      s.name.toLowerCase().includes(ql)||
      s.ticker.toLowerCase().includes(ql)
    ).slice(0,10);
    if(localHits.length>0){
      setSearchRes(localHits);
      fetchPrices(localHits.map(s=>s.ticker));
    }

    // 2) 동시에 Yahoo Finance API 검색 (더 많은 결과)
    setSearchLoading(true);
    searchTimer.current=setTimeout(async()=>{
      try{
        const res=await fetch(`/api/stock-search?q=${encodeURIComponent(q)}`);
        const data=await res.json();
        if(data.ok&&data.items.length>0){
          // 로컬 결과 + API 결과 병합 (중복 제거)
          const localTickers=new Set(localHits.map(s=>s.ticker));
          const apiOnly=data.items.filter((s:StockMeta)=>!localTickers.has(s.ticker));
          const merged=[...localHits,...apiOnly].slice(0,15);
          setSearchRes(merged);
          fetchPrices(merged.map((s:StockMeta)=>s.ticker));
        } else if(localHits.length===0){
          // 3) fallback: 검색어를 티커로 직접 조회
          const priceRes=await fetch(`/api/stock-price?tickers=${encodeURIComponent(q.toUpperCase())}`);
          const priceData=await priceRes.json();
          if(priceData.ok&&priceData.items[0]){
            const it=priceData.items[0];
            const isKR=it.ticker.endsWith(".KS")||it.ticker.endsWith(".KQ");
            const meta:StockMeta={ticker:it.ticker,name:it.name||it.ticker,market:isKR?"KR":"US"};
            setSearchRes([meta]);
            setPrices(prev=>({...prev,[it.ticker]:it}));
          }
        }
      }finally{ setSearchLoading(false); }
    },300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[search]);

  // 차트
  const loadChart=useCallback(async(ticker:string,range:ChartRange)=>{
    setChartLoading(true); setChartPts([]);
    try{
      const res=await fetch(`/api/stock-chart?ticker=${encodeURIComponent(ticker)}&range=${range}`);
      const data=await res.json();
      if(data.ok){ setChartPts(data.points); setChartMeta(data.meta??{}); }
    }finally{ setChartLoading(false); }
  },[]);

  // 예약주문 취소
  const cancelPendingOrder=useCallback((id:string)=>{
    setPendingOrders(prev=>{
      const next=prev.filter(o=>o.id!==id);
      localStorage.setItem("stock-pending",JSON.stringify(next));
      return next;
    });
  },[]);

  // 지정가 자동체결
  const executeLimitOrder=useCallback(async(order:PendingOrder,price:number)=>{
    try{
      const res=await fetch("/api/stock-sim/trade",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ticker:order.ticker,name:order.name,market:order.market,type:order.type,quantity:order.quantity,price,exRate})});
      const data=await res.json();
      if(data.ok){
        setPendingOrders(prev=>{ const next=prev.filter(o=>o.id!==order.id); localStorage.setItem("stock-pending",JSON.stringify(next)); return next; });
        showToast(`✓ 지정가 ${order.type==="BUY"?"매수":"매도"} 체결: ${order.name}`,true);
        loadPortfolio(); loadHistory();
      }
    }catch{}
  },[loadPortfolio,loadHistory,exRate]); // eslint-disable-line

  // 가격 업데이트 시 예약주문 체결 확인
  useEffect(()=>{
    if(!pendingOrders.length) return;
    for(const order of pendingOrders){
      const p=prices[order.ticker];
      if(!p) continue;
      // 지정가 매수: 현재가 ≤ 지정가, 지정가 매도: 현재가 ≥ 지정가
      const hit=order.type==="BUY"?p.price<=order.limitPrice:p.price>=order.limitPrice;
      if(hit) executeLimitOrder(order,p.price);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[prices]);

  const selectStock=useCallback(async(s:StockMeta)=>{
    setSelStock(s); setQty("1"); setTradeType("BUY"); setOrderType("MARKET"); setLimitPrice("");
    setChartRange("1mo"); // useEffect가 chartRange OR selStock 변화 감지해 loadChart 호출
    saveCustomStock(s);
    if(prices[s.ticker]){ setSelPrice(prices[s.ticker]); }
    else{
      const res=await fetch(`/api/stock-price?tickers=${s.ticker}`);
      const data=await res.json();
      if(data.ok&&data.items[0]){ setSelPrice(data.items[0]); setPrices(prev=>({...prev,[s.ticker]:data.items[0]})); }
    }
    // ★ loadChart는 아래 useEffect 단 하나만 호출 (중복 방지)
  },[prices,saveCustomStock]);

  // selStock 또는 chartRange 바뀔 때만 차트 로드 (단일 호출)
  const prevSelRef=useRef<string|null>(null);
  useEffect(()=>{
    if(!selStock) return;
    // 같은 종목의 range만 바뀐 경우 or 종목 자체가 바뀐 경우 모두 처리
    prevSelRef.current=selStock.ticker;
    loadChart(selStock.ticker,chartRange);
  },[selStock?.ticker,chartRange]); // eslint-disable-line

  // prices 업데이트 시 selPrice 동기화
  useEffect(()=>{
    if(selStock&&prices[selStock.ticker]) setSelPrice(prices[selStock.ticker]);
  },[prices,selStock]);

  const executeTrade=async()=>{
    if(!selStock||!selPrice) return;
    const quantity=parseInt(qty);
    if(isNaN(quantity)||quantity<=0){ showToast("수량을 입력해주세요",false); return; }

    // 지정가 / 예약주문 → 즉시 체결 안 함, pendingOrders에 추가
    if(orderType==="LIMIT"||orderType==="RESERVE"){
      const lp=parseFloat(limitPrice.replace(/,/g,""));
      if(isNaN(lp)||lp<=0){ showToast("목표가를 입력해주세요",false); return; }
      const order:PendingOrder={
        id:Date.now().toString(),
        ticker:selStock.ticker, name:selStock.name, market:selStock.market,
        type:tradeType, orderType, quantity, limitPrice:lp,
        createdAt:new Date().toISOString(),
      };
      setPendingOrders(prev=>{
        const next=[...prev,order];
        localStorage.setItem("stock-pending",JSON.stringify(next));
        return next;
      });
      showToast(`${orderType==="LIMIT"?"지정가":"예약"} ${tradeType==="BUY"?"매수":"매도"} 등록 ✓`,true);
      setSelStock(null);
      return;
    }

    // 시장가: 장 개방 여부 확인
    const mKey=selStock.market==="KR"?"kr":"us";
    const mStatus=marketStatus[mKey];
    if(mStatus!=="open"){
      const label=mStatus==="pre"?"장전(08:30~09:00)":mStatus==="after"?"시간외(15:30~18:00)":"장마감";
      showToast(`현재 ${label}입니다. 지정가/예약 주문을 이용해주세요.`,false);
      setOrderType("LIMIT");
      return;
    }

    // 시장가: 즉시 체결
    setTradeLoading(true);
    try{
      const res=await fetch("/api/stock-sim/trade",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ticker:selStock.ticker,name:selStock.name,market:selStock.market,type:tradeType,quantity,price:selPrice.price,exRate})});
      const data=await res.json();
      if(data.ok){ showToast(`${tradeType==="BUY"?"매수":"매도"} 완료 ✓`,true); loadPortfolio(); loadHistory(); setSelStock(null); }
      else showToast(data.error??"오류",false);
    }finally{ setTradeLoading(false); }
  };

  // 자산
  const holdingsKRW=portfolio?.holdings.reduce((s,h)=>{
    const p=prices[h.ticker]; const cur=p?.currency??(h.market==="KR"?"KRW":"USD");
    return s+toKRW(p?.price??h.avgPrice,cur,exRate)*h.quantity;
  },0)??0;
  const totalKRW=(portfolio?.cash??0)+holdingsKRW;
  const returnKRW=totalKRW-2_000_000;

  // POPULAR + 커스텀 통합 목록 (중복 제거)
  const popularTickers=new Set(POPULAR.map(s=>s.ticker));
  const allStocks=[...POPULAR,...customStocks.filter(s=>!popularTickers.has(s.ticker))];

  // 목록 필터·정렬
  const baseList=search?searchRes:allStocks.filter(s=>mktFilter==="ALL"||s.market===mktFilter);
  const displayList=[...baseList].sort((a,b)=>{
    if(sortKey==="change"){ const pa=prices[a.ticker]?.changePercent??-999; const pb=prices[b.ticker]?.changePercent??-999; return pb-pa; }
    if(sortKey==="price"){ const pa=toKRW(prices[a.ticker]?.price??0,prices[a.ticker]?.currency??"USD",exRate); const pb=toKRW(prices[b.ticker]?.price??0,prices[b.ticker]?.currency??"USD",exRate); return pb-pa; }
    return 0;
  });
  const watchedList=allStocks.filter(s=>watchlist.includes(s.ticker));
  // refs 동기화 (IntersectionObserver 클로저에서 사용)
  displayListRef.current=displayList;
  pricesRef.current=prices;

  // ── 포트폴리오 분석 ──
  const analysis=useMemo(()=>{
    if(!portfolio) return null;
    const holdings=portfolio.holdings;

    // 종목별 평가손익
    const holdingStats=holdings.map(h=>{
      const p=prices[h.ticker]; const cur=p?.currency??(h.market==="KR"?"KRW":"USD");
      const currPrice=toKRW(p?.price??h.avgPrice,cur,exRate);
      const avgPrice=toKRW(h.avgPrice,cur,exRate);
      const evalKRW=Math.round(currPrice*h.quantity);
      const costKRW=Math.round(avgPrice*h.quantity);
      const retKRW=evalKRW-costKRW;
      const retPct=costKRW?(retKRW/costKRW)*100:0;
      return{...h,evalKRW,costKRW,retKRW,retPct,cur};
    }).sort((a,b)=>b.retPct-a.retPct);

    // 시장별 비중
    const mktVal:Record<string,number>={KR:0,US:0,ETF:0};
    for(const h of holdingStats) mktVal[h.market]=(mktVal[h.market]??0)+h.evalKRW;
    const totalHold=Object.values(mktVal).reduce((a,b)=>a+b,0)||1;

    // 총 투자원금 vs 평가금액
    const totalCost=holdingStats.reduce((s,h)=>s+h.costKRW,0);
    const totalEval=holdingStats.reduce((s,h)=>s+h.evalKRW,0);
    const totalRetKRW=totalEval-totalCost;
    const totalRetPct=totalCost?totalRetKRW/totalCost*100:0;

    // 거래 통계
    const buyCount=history.filter(t=>t.type==="BUY").length;
    const sellCount=history.filter(t=>t.type==="SELL").length;
    // 종목별 거래 횟수
    const tradeMap:Record<string,{name:string;count:number;buyAmt:number;sellAmt:number}>={};
    for(const t of history){
      if(!tradeMap[t.ticker]) tradeMap[t.ticker]={name:t.name,count:0,buyAmt:0,sellAmt:0};
      tradeMap[t.ticker].count++;
      const amt=toKRW(t.total,t.market==="KR"?"KRW":"USD",exRate);
      if(t.type==="BUY") tradeMap[t.ticker].buyAmt+=amt;
      else tradeMap[t.ticker].sellAmt+=amt;
    }
    const topTraded=Object.values(tradeMap).sort((a,b)=>b.count-a.count).slice(0,5);

    // 매도 실현손익 추정 (매도가 - 당시 평균매입가 근사 = 현재 avgPrice 사용)
    const realizedPnL=history.filter(t=>t.type==="SELL").reduce((s,t)=>{
      const h=holdings.find(hh=>hh.ticker===t.ticker);
      if(!h) return s;
      const cur2=t.market==="KR"?"KRW":"USD";
      const sellKRW=toKRW(t.price,cur2,exRate)*t.quantity;
      const costKRW2=toKRW(h.avgPrice,cur2,exRate)*t.quantity;
      return s+(sellKRW-costKRW2);
    },0);

    return{holdingStats,mktVal,totalHold,totalCost,totalEval,totalRetKRW,totalRetPct,buyCount,sellCount,topTraded,realizedPnL};
  },[portfolio,history,prices,exRate]);

  /* ── 공통 상수 ── */
  const detailProps={selStock:selStock!,selPrice,exRate,portfolio,marketStatus,chartPts,chartLoading,chartRange,setChartRange,chartMeta,qty,setQty,tradeType,setTradeType,orderType,setOrderType,limitPrice,setLimitPrice,tradeLoading,executeTrade,onClose:()=>setSelStock(null)};

  const BgBlobs=()=>(
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/[0.03] blur-3xl opacity-50"/>
      <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-white/[0.03] blur-3xl opacity-50"/>
      <div className="absolute bottom-20 left-1/4 w-72 h-72 rounded-full bg-white/[0.03] blur-3xl opacity-40"/>
    </div>
  );

  if(user==="loading") return(
    <main className="min-h-screen bg-[#04040a] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-3xl border border-white/[0.07] bg-white/[0.04] backdrop-blur flex items-center justify-center text-3xl animate-pulse">📈</div>
        <p className="text-white/40 text-sm">불러오는 중...</p>
      </div>
    </main>
  );

  if(!user) return(
    <main className="min-h-screen bg-[#04040a] flex items-center justify-center p-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="relative w-full max-w-sm space-y-4">
        <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.04] p-3 shadow-xl backdrop-blur">
          <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.03] px-6 py-8 text-center space-y-4">
            <p className="text-5xl">📈</p>
            <div><p className="text-xl font-extrabold text-white">모의주식</p><p className="text-sm text-white/40 mt-1">로그인 후 이용할 수 있어요</p></div>
            <p className="text-xs text-white/28">시작 자금 200만원 · 전 종목 거래 가능</p>
          </div>
        </div>
        <Link href="/login" className="block w-full rounded-2xl bg-white px-5 py-4 text-center text-base font-bold text-black hover:bg-white/90 transition-colors" style={{boxShadow:"0 0 32px rgba(255,255,255,0.15)"}}>로그인하기 →</Link>
        <Link href="/hub" className="block text-center text-sm text-white/40">← 돌아가기</Link>
      </motion.div>
    </main>
  );

  /* ══════════════════════════════════════════
     메인 레이아웃 (PC 3열 / 모바일 1열)
  ══════════════════════════════════════════ */
  return(
    <main className="min-h-screen text-white">
      

      {/* ─── 상단 네비 ─── */}
      <nav className="relative sticky top-0 z-30 bg-[#04040a]/90 backdrop-blur border-b border-white/[0.07] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/hub" className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-white/55 hover:bg-white/[0.06] transition-colors">← 홈</Link>
            <span className="font-black text-white hidden sm:inline">📈 모의주식</span>
            {/* 장 상태 배지 */}
            {([
              {label:"🇰🇷 KR", ms:marketStatus.kr},
              {label:"🇺🇸 US", ms:marketStatus.us},
            ] as const).map(({label,ms})=>{
              const cfg=ms==="open"?{txt:"장중",cls:"bg-emerald-500/15 text-emerald-400 border-emerald-500/30"}:
                         ms==="pre" ?{txt:"장전",cls:"bg-amber-500/15 text-amber-400 border-amber-500/30"}:
                         ms==="after"?{txt:"시간외",cls:"bg-purple-500/15 text-purple-400 border-purple-500/30"}:
                                      {txt:"마감",cls:"bg-white/[0.05] text-white/28 border-white/10"};
              return(
                <div key={label} className={`hidden sm:flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${cfg.cls}`}>
                  <span>{label}</span><span>{cfg.txt}</span>
                </div>
              );
            })}
          </div>
          {/* 지수 (PC) */}
          <div className="hidden md:flex flex-1 justify-center">
            <IndicesBar prices={idxPrices}/>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-1.5 text-xs text-white/40">
              💱 <span className="font-bold text-white/60">1 USD = {exRate.toLocaleString("ko-KR")}원</span>
            </div>
            {portfolio&&(
              <div className="hidden sm:block rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-1.5 text-xs">
                <span className="text-white/40">총자산 </span>
                <span className="font-bold text-white">{fmtKRW(Math.round(totalKRW))}</span>
                <span className={`ml-1.5 font-bold ${returnKRW>=0?"text-red-500":"text-blue-500"}`}>{pct((returnKRW/2_000_000)*100)}</span>
              </div>
            )}
            <Link href="/stock-sim/ranking"
              className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/55 hover:bg-white/[0.06] transition-colors">
              🏆 랭킹
            </Link>
            <button onClick={()=>setShowAnalysis(true)}
              className="rounded-xl border border-white/[0.09] bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-white/55 hover:bg-white/[0.06] transition-colors">
              📊 분석
            </button>
          </div>
        </div>
      </nav>

      {/* 지수 (모바일) */}
      <div className="md:hidden relative px-4 py-2 border-b border-white/[0.07] bg-white/[0.03]">
        <IndicesBar prices={idxPrices}/>
      </div>

      {/* ─── 본문 3열 그리드 ─── */}
      <div className="relative max-w-7xl mx-auto px-4 py-4 lg:grid lg:grid-cols-[280px_1fr_380px] lg:gap-4 lg:items-start">

        {/* ══ 왼쪽 패널: 자산 + 보유/내역 ══ */}
        <aside className="hidden lg:block space-y-3 sticky top-24">
          {/* 자산 요약 */}
          {portfolio&&(
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-lg">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] px-4 py-4 space-y-2">
                <p className="text-[10px] font-bold text-white/28 uppercase tracking-wide">총 평가자산</p>
                <p className="text-2xl font-black text-white">{fmtKRW(Math.round(totalKRW))}</p>
                <p className={`text-sm font-black ${returnKRW>=0?"text-red-500":"text-blue-500"}`}>
                  {returnKRW>=0?"▲":"▼"} {fmtKRW(Math.abs(Math.round(returnKRW)))} ({pct((returnKRW/2_000_000)*100)})
                </p>
                <div className="flex gap-3 text-xs text-white/35 pt-2 border-t border-white/[0.07]">
                  <span>현금 <span className="font-bold text-white/55">{fmtKRW(Math.round(portfolio.cash))}</span></span>
                  <span>주식 <span className="font-bold text-white/55">{fmtKRW(Math.round(holdingsKRW))}</span></span>
                </div>
                <button onClick={()=>setShowAnalysis(true)}
                  className="w-full mt-1 rounded-xl bg-white/15 py-2 text-xs font-bold text-white hover:bg-white/90 transition-colors">
                  📊 상세 분석 보기
                </button>
              </div>
            </div>
          )}

          {/* 예약/지정가 주문 */}
          {pendingOrders.length>0&&(
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-lg">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
                <p className="text-xs font-bold text-white/40 px-1">⏳ 예약·지정가 주문</p>
                {pendingOrders.map(o=>{
                  const cur=o.market==="KR"?"KRW":"USD";
                  return(
                    <div key={o.id} className="rounded-xl border border-white/[0.07] bg-white/[0.06] px-3 py-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${o.type==="BUY"?"bg-red-500/15 text-red-400":"bg-blue-500/15 text-blue-400"}`}>{o.type==="BUY"?"매수":"매도"}</span>
                          <span className="text-[9px] font-bold text-white/28 bg-white/[0.05] px-1.5 py-0.5 rounded-full">{o.orderType==="LIMIT"?"지정가":"예약"}</span>
                          <span className="text-xs font-bold text-white truncate">{o.name}</span>
                        </div>
                        <p className="text-[10px] text-white/28 mt-0.5">{o.quantity}주 · 목표 {cur==="KRW"?o.limitPrice.toLocaleString("ko-KR")+"원":fmtUSD(o.limitPrice)}</p>
                      </div>
                      <button onClick={()=>cancelPendingOrder(o.id)} className="shrink-0 text-[10px] text-white/18 hover:text-red-400 transition-colors mt-0.5">취소</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 보유 종목 */}
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-lg">
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
              <p className="text-xs font-bold text-white/40 px-1">💼 보유 종목</p>
              {(!portfolio||portfolio.holdings.length===0)
                ?<p className="text-xs text-white/18 text-center py-4">없음</p>
                :portfolio.holdings.map(h=>{
                  const p=prices[h.ticker]; const cur=p?.currency??(h.market==="KR"?"KRW":"USD");
                  const evalV=Math.round(toKRW(p?.price??h.avgPrice,cur,exRate)*h.quantity);
                  const costV=Math.round(toKRW(h.avgPrice,cur,exRate)*h.quantity);
                  const ret=evalV-costV;
                  return(
                    <button key={h.id} onClick={()=>selectStock(POPULAR.find(s=>s.ticker===h.ticker)??{ticker:h.ticker,name:h.name,market:h.market})}
                      className="w-full rounded-xl border border-white/[0.07] bg-white/[0.06] px-3 py-2 text-left hover:bg-white/[0.09] transition-colors">
                      <div className="flex justify-between items-center">
                        <div><p className="text-xs font-bold text-white truncate">{h.name}</p><p className="text-[10px] text-white/28">{h.quantity}주</p></div>
                        <div className="text-right"><p className="text-xs font-black text-white">{fmtKRW(evalV)}</p>
                          <p className={`text-[10px] font-semibold ${ret>=0?"text-red-500":"text-blue-500"}`}>{ret>=0?"+":""}{fmtKRW(ret)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 관심목록 */}
          {watchedList.length>0&&(
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-lg">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
                <p className="text-xs font-bold text-white/40 px-1">⭐ 관심 종목</p>
                {watchedList.map(s=>(
                  <StockCard key={s.ticker} s={s} p={prices[s.ticker]} exRate={exRate}
                    onClick={()=>selectStock(s)} watched={watchlist.includes(s.ticker)} onWatch={(e)=>toggleWatch(s.ticker,e)}
                    isCustom={!popularTickers.has(s.ticker)} onRemove={(e)=>removeCustomStock(s.ticker,e)}/>
                ))}
              </div>
            </div>
          )}

          {/* 거래내역 */}
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-lg">
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
              <p className="text-xs font-bold text-white/40 px-1">📋 최근 거래</p>
              {history.length===0?<p className="text-xs text-white/18 text-center py-4">없음</p>
                :history.slice(0,8).map(t=>(
                  <div key={t.id} className="rounded-xl border border-white/[0.07] bg-white/[0.06] px-3 py-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`text-[10px] font-black mr-1 ${t.type==="BUY"?"text-red-400":"text-blue-400"}`}>{t.type==="BUY"?"매수":"매도"}</span>
                        <span className="text-xs font-semibold text-white/70">{t.name}</span>
                      </div>
                      <span className="text-xs font-bold text-white/55">{fmtKRW(Math.round(toKRW(t.total,t.market==="KR"?"KRW":"USD",exRate)))}</span>
                    </div>
                    <p className="text-[10px] text-white/22 mt-0.5">{new Date(t.createdAt).toLocaleDateString("ko-KR",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                  </div>
                ))}
            </div>
          </div>
        </aside>

        {/* ══ 가운데: 종목 리스트 ══ */}
        <div className="space-y-3 min-w-0">

          {/* 모바일 자산 카드 */}
          {portfolio&&(
            <div className="lg:hidden rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-md">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/28">총 평가자산</p>
                  <p className="text-xl font-black text-white">{fmtKRW(Math.round(totalKRW))}</p>
                </div>
                <p className={`text-sm font-black ${returnKRW>=0?"text-red-500":"text-blue-500"}`}>
                  {returnKRW>=0?"▲":"▼"} {pct((returnKRW/2_000_000)*100)}
                </p>
              </div>
            </div>
          )}

          {/* 모바일 탭 */}
          <div className="lg:hidden rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-2 backdrop-blur">
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-1 flex gap-1">
              {(["market","holdings","history"] as const).map(t=>(
                <button key={t} onClick={()=>setActiveTab(t)}
                  className={`flex-1 rounded-2xl py-2 text-xs font-bold transition-all ${activeTab===t?"bg-white/15 text-white shadow-sm":"text-white/40"}`}>
                  {t==="market"?"📊 시장":t==="holdings"?"💼 보유":"📋 내역"}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 + 필터 + 정렬 */}
          {(activeTab==="market"||window===undefined||typeof window!=="undefined")&&(
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-md">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-2">
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-white/22">🔍</span>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="종목명·티커 검색 (예: 삼성, AAPL, 005930)"
                    className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] pl-9 pr-10 py-2.5 text-sm outline-none placeholder:text-white/22"/>
                  {searchLoading&&<span className="absolute right-3.5 top-3 text-xs text-white/22">검색중...</span>}
                  {search&&!searchLoading&&<button onClick={()=>setSearch("")} className="absolute right-3.5 top-3 text-xs text-white/22 hover:text-white/40">✕</button>}
                </div>
                {!search&&(
                  <div className="flex gap-1.5 flex-wrap">
                    {(["ALL","KR","US","ETF"] as const).map(f=>(
                      <button key={f} onClick={()=>setMktFilter(f)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${mktFilter===f?"bg-white/15 text-white":"bg-white/[0.06] text-white/40 border border-white/[0.07]"}`}>
                        {f==="ALL"?"전체":f==="KR"?"🇰🇷 한국":f==="US"?"🇺🇸 해외":"📦 ETF"}
                      </button>
                    ))}
                    <div className="ml-auto flex gap-1">
                      {(["default","change","price"] as SortKey[]).map(sk=>(
                        <button key={sk} onClick={()=>setSortKey(sk)}
                          className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${sortKey===sk?"bg-white/15 text-white":"bg-white/[0.06] text-white/40 border border-white/[0.07]"}`}>
                          {sk==="default"?"기본":sk==="change"?"등락순":"가격순"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 종목 리스트 (모바일: market탭만 / PC: 항상) */}
          <div className={activeTab!=="market"?"lg:block hidden":"block"}>
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur shadow-md">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
                {search&&searchRes.length===0&&!searchLoading&&(
                  <p className="text-center py-8 text-sm text-white/22">검색 결과가 없습니다</p>
                )}
                {displayList.map(s=>(
                  <StockCard key={s.ticker} s={s} p={prices[s.ticker]} exRate={exRate}
                    onClick={()=>selectStock(s)}
                    watched={watchlist.includes(s.ticker)}
                    onWatch={(e)=>toggleWatch(s.ticker,e)}
                    isCustom={!popularTickers.has(s.ticker)}
                    onRemove={(e)=>removeCustomStock(s.ticker,e)}
                    onObserve={(el)=>observeCard(el,s.ticker)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 모바일: 보유 탭 */}
          {activeTab==="holdings"&&(
            <div className="lg:hidden rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
                {(!portfolio||portfolio.holdings.length===0)
                  ?<div className="text-center py-10 text-sm text-white/22">보유 종목이 없습니다</div>
                  :portfolio.holdings.map(h=>{
                    const p=prices[h.ticker]; const cur=p?.currency??(h.market==="KR"?"KRW":"USD");
                    const ev=Math.round(toKRW(p?.price??h.avgPrice,cur,exRate)*h.quantity);
                    const co=Math.round(toKRW(h.avgPrice,cur,exRate)*h.quantity);
                    const ret=ev-co; const rp=co?(ret/co)*100:0;
                    return(
                      <motion.button key={h.id} whileTap={{scale:0.98}}
                        onClick={()=>selectStock(POPULAR.find(s=>s.ticker===h.ticker)??{ticker:h.ticker,name:h.name,market:h.market})}
                        className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.06] px-4 py-3 text-left hover:bg-white/[0.09] transition-colors">
                        <div className="flex justify-between items-start">
                          <div><p className="text-sm font-bold text-white">{h.name}</p><p className="text-xs text-white/35">{h.quantity}주 · 평균 {fmtKRW(Math.round(toKRW(h.avgPrice,cur,exRate)))}</p></div>
                          <div className="text-right"><p className="text-sm font-black text-white">{fmtKRW(ev)}</p>
                            <p className={`text-xs font-semibold ${ret>=0?"text-red-500":"text-blue-500"}`}>{ret>=0?"+":""}{fmtKRW(ret)} ({pct(rp)})</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 모바일: 내역 탭 */}
          {activeTab==="history"&&(
            <div className="lg:hidden rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-3 backdrop-blur">
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-3 space-y-1.5">
                {history.length===0?<div className="text-center py-10 text-sm text-white/22">거래 내역이 없습니다</div>
                  :history.map(t=>{
                    const cur=t.market==="KR"?"KRW":"USD";
                    return(
                      <div key={t.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.06] px-4 py-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${t.type==="BUY"?"bg-red-500/15 text-red-400":"bg-blue-500/15 text-blue-400"}`}>{t.type==="BUY"?"매수":"매도"}</span>
                              <span className="text-sm font-bold text-white">{t.name}</span>
                            </div>
                            <p className="text-xs text-white/35 mt-0.5">{t.quantity}주</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white">{fmtKRW(Math.round(toKRW(t.total,cur,exRate)))}</p>
                            <p className="text-[10px] text-white/22">{new Date(t.createdAt).toLocaleDateString("ko-KR",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* ══ 오른쪽 패널: 종목 상세 (PC) ══ */}
        <aside className="hidden lg:block sticky top-24">
          {selStock?(
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur shadow-lg">
              <DetailPanel {...detailProps}/>
            </div>
          ):(
            <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.04] p-6 backdrop-blur shadow-lg text-center space-y-3">
              <p className="text-4xl">📊</p>
              <p className="font-bold text-white/60">종목을 선택하면<br/>상세 정보가 표시됩니다</p>
              <p className="text-xs text-white/22">차트 · 매수 · 매도</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── 모바일 하단 시트 ── */}
      <AnimatePresence>
        {selStock&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={e=>{if(e.target===e.currentTarget)setSelStock(null);}}>
            <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}}
              transition={{type:"spring",damping:30,stiffness:300}}
              className="w-full max-w-lg rounded-t-[32px] border border-white/[0.07] bg-[#0a0a14] shadow-2xl"
              style={{maxHeight:"92dvh",overflowY:"auto"}}>
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-black/15"/></div>
              <div className="px-4 pb-8 space-y-3">
                <DetailPanel {...detailProps}/>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 분석 패널 오버레이 */}
      <AnimatePresence>
        {showAnalysis&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={e=>{if(e.target===e.currentTarget)setShowAnalysis(false);}}>
            <motion.div initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} exit={{y:60,opacity:0}}
              transition={{type:"spring",damping:28,stiffness:280}}
              className="w-full sm:max-w-lg bg-[#0a0a14] rounded-t-[32px] sm:rounded-[28px] shadow-2xl overflow-hidden"
              style={{maxHeight:"92dvh"}}>
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.07]">
                <div>
                  <p className="font-black text-lg text-white">📊 내 포트폴리오 분석</p>
                  <p className="text-xs text-white/28 mt-0.5">보유 종목 · 거래 내역 기반</p>
                </div>
                <button onClick={()=>setShowAnalysis(false)} className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-sm text-white/45 hover:bg-white/15">✕</button>
              </div>

              <div className="overflow-y-auto p-4 space-y-3" style={{maxHeight:"calc(92dvh - 80px)"}}>
                {!analysis?(
                  <p className="text-center py-12 text-sm text-white/22">포트폴리오가 없습니다</p>
                ):(
                  <>
                    {/* 총 수익률 */}
                    <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.06] px-5 py-4 space-y-2">
                      <p className="text-xs font-bold text-white/28 uppercase tracking-wide">평가손익 (보유중)</p>
                      <div className="flex items-end gap-3">
                        <p className={`text-3xl font-black ${analysis.totalRetKRW>=0?"text-red-500":"text-blue-500"}`}>
                          {analysis.totalRetKRW>=0?"+":""}{fmtKRW(Math.round(analysis.totalRetKRW))}
                        </p>
                        <p className={`text-lg font-black pb-0.5 ${analysis.totalRetKRW>=0?"text-red-400":"text-blue-400"}`}>
                          {pct(analysis.totalRetPct)}
                        </p>
                      </div>
                      <div className="flex gap-4 text-xs text-white/35 pt-1 border-t border-white/[0.07]">
                        <span>투자원금 <span className="font-bold text-white/55">{fmtKRW(Math.round(analysis.totalCost))}</span></span>
                        <span>평가금액 <span className="font-bold text-white/55">{fmtKRW(Math.round(analysis.totalEval))}</span></span>
                      </div>
                    </div>

                    {/* 시장별 비중 */}
                    <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.06] px-5 py-4 space-y-3">
                      <p className="text-xs font-bold text-white/28 uppercase tracking-wide">시장별 비중</p>
                      {([["KR","🇰🇷 한국","#3b82f6"],["US","🇺🇸 해외","#ef4444"],["ETF","📦 ETF","#8b5cf6"]] as [string,string,string][]).map(([mkt,label,color])=>{
                        const val=analysis.mktVal[mkt]??0;
                        const pctV=val/analysis.totalHold*100;
                        if(val===0) return null;
                        return(
                          <div key={mkt} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-white/55">{label}</span>
                              <span className="font-bold text-white/70">{pctV.toFixed(1)}% · {fmtKRW(Math.round(val))}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{width:`${pctV}%`,background:color}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 종목별 수익률 */}
                    {analysis.holdingStats.length>0&&(
                      <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.06] px-5 py-4 space-y-2">
                        <p className="text-xs font-bold text-white/28 uppercase tracking-wide">종목별 평가손익</p>
                        {analysis.holdingStats.map(h=>(
                          <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-white/[0.07] last:border-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white truncate">{h.name}</p>
                              <p className="text-[10px] text-white/22">{h.quantity}주 · 평균 {h.cur==="KRW"?Math.round(h.avgPrice).toLocaleString("ko-KR")+"원":fmtUSD(h.avgPrice)}</p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className={`text-sm font-black ${h.retKRW>=0?"text-red-500":"text-blue-500"}`}>
                                {h.retKRW>=0?"+":""}{fmtKRW(Math.abs(h.retKRW))}
                              </p>
                              <p className={`text-xs font-semibold ${h.retPct>=0?"text-red-400":"text-blue-400"}`}>{pct(h.retPct)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 거래 통계 */}
                    <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.06] px-5 py-4 space-y-3">
                      <p className="text-xs font-bold text-white/28 uppercase tracking-wide">거래 통계</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {label:"총 거래",val:`${analysis.buyCount+analysis.sellCount}회`},
                          {label:"매수",val:`${analysis.buyCount}회`},
                          {label:"매도",val:`${analysis.sellCount}회`},
                        ].map(i=>(
                          <div key={i.label} className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-center">
                            <p className="text-[10px] text-white/28">{i.label}</p>
                            <p className="text-base font-black text-white mt-0.5">{i.val}</p>
                          </div>
                        ))}
                      </div>
                      {/* 실현손익 */}
                      {analysis.sellCount>0&&(
                        <div className="flex justify-between items-center text-sm pt-1 border-t border-white/[0.07]">
                          <span className="text-white/40">실현손익 (근사치)</span>
                          <span className={`font-black ${analysis.realizedPnL>=0?"text-red-500":"text-blue-500"}`}>
                            {analysis.realizedPnL>=0?"+":""}{fmtKRW(Math.round(analysis.realizedPnL))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 많이 거래한 종목 */}
                    {analysis.topTraded.length>0&&(
                      <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.06] px-5 py-4 space-y-2">
                        <p className="text-xs font-bold text-white/28 uppercase tracking-wide">자주 거래한 종목</p>
                        {analysis.topTraded.map((t,i)=>(
                          <div key={t.name} className="flex items-center gap-3 py-1 border-b border-white/[0.07] last:border-0">
                            <span className="w-5 text-center text-xs font-black text-white/28 shrink-0">{i+1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{t.name}</p>
                              <p className="text-[10px] text-white/22">총 {t.count}회 거래</p>
                            </div>
                            <div className="text-right text-xs">
                              <p className="text-red-400 font-semibold">매수 {fmtKRW(Math.round(t.buyAmt))}</p>
                              {t.sellAmt>0&&<p className="text-blue-400 font-semibold">매도 {fmtKRW(Math.round(t.sellAmt))}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 총 자산 요약 */}
                    <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.06] px-5 py-4 space-y-2">
                      <p className="text-xs font-bold text-white/28 uppercase tracking-wide">자산 요약</p>
                      {[
                        {label:"시작 자금",val:"2,000,000원",muted:true},
                        {label:"현금",val:fmtKRW(Math.round(portfolio?.cash??0))},
                        {label:"주식 평가",val:fmtKRW(Math.round(analysis.totalEval))},
                        {label:"총 평가자산",val:fmtKRW(Math.round((portfolio?.cash??0)+analysis.totalEval)),bold:true},
                        {label:"총 수익률",val:pct((((portfolio?.cash??0)+analysis.totalEval-2_000_000)/2_000_000)*100),color:((portfolio?.cash??0)+analysis.totalEval)>=2_000_000?"text-red-500":"text-blue-500"},
                      ].map(row=>(
                        <div key={row.label} className={`flex justify-between text-sm py-1 border-b border-white/[0.07] last:border-0 ${row.bold?"font-black":"font-medium"}`}>
                          <span className={row.muted?"text-white/22":"text-white/45"}>{row.label}</span>
                          <span className={row.color??"text-white"}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 토스트 */}
      <AnimatePresence>
        {toast&&(
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-2xl px-5 py-3 text-sm font-bold shadow-lg whitespace-nowrap ${toast.ok?"bg-emerald-500 text-white":"bg-red-500 text-white"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
