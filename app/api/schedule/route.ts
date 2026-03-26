import { NextResponse } from "next/server";

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function cleanText(value: string) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim();
}

async function findSchoolInfo(apiKey: string, schoolName: string) {
  const url = new URL("https://open.neis.go.kr/hub/schoolInfo");
  url.searchParams.set("KEY", apiKey);
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", "1");
  url.searchParams.set("pSize", "20");
  url.searchParams.set("SCHUL_NM", schoolName);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  const data = await response.json();
  const rows = data?.schoolInfo?.[1]?.row ?? [];

  if (!rows.length) return null;

  const exact =
    rows.find((row: any) => String(row.SCHUL_NM).trim() === schoolName) ?? rows[0];

  return {
    schoolName: exact.SCHUL_NM,
    atptCode: exact.ATPT_OFCDC_SC_CODE,
    schoolCode: exact.SD_SCHUL_CODE,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const schoolName = String(
      searchParams.get("schoolName") ||
        process.env.DEFAULT_SCHOOL_NAME ||
        "대아고등학교"
    ).trim();

    const year = String(searchParams.get("year") || "").trim();
    const month = String(searchParams.get("month") || "").trim();

    const apiKey = process.env.NEIS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "NEIS API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const schoolInfo = await findSchoolInfo(apiKey, schoolName);

    if (!schoolInfo) {
      return NextResponse.json(
        { ok: false, message: "학교를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const targetYear = Number(year);
    const targetMonth = Number(month);

    if (
      !Number.isInteger(targetYear) ||
      !Number.isInteger(targetMonth) ||
      targetMonth < 1 ||
      targetMonth > 12
    ) {
      return NextResponse.json(
        { ok: false, message: "연월 값이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const url = new URL("https://open.neis.go.kr/hub/SchoolSchedule");
    url.searchParams.set("KEY", apiKey);
    url.searchParams.set("Type", "json");
    url.searchParams.set("pIndex", "1");
    url.searchParams.set("pSize", "300");
    url.searchParams.set("ATPT_OFCDC_SC_CODE", schoolInfo.atptCode);
    url.searchParams.set("SD_SCHUL_CODE", schoolInfo.schoolCode);
    url.searchParams.set("AA_FROM_YMD", formatDate(startDate));
    url.searchParams.set("AA_TO_YMD", formatDate(endDate));

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    const data = await response.json();
    const rows = data?.SchoolSchedule?.[1]?.row ?? [];

    const schedules = rows.map((row: any) => ({
      date: row.AA_YMD,
      eventName: cleanText(row.EVENT_NM || ""),
      content: cleanText(row.EVENT_CNTNT || ""),
      schoolName: schoolInfo.schoolName,
    }));

    return NextResponse.json({
      ok: true,
      school: schoolInfo.schoolName,
      schedules,
    });
  } catch (error) {
    console.error("GET /api/schedule error:", error);

    return NextResponse.json(
      { ok: false, message: "학사일정을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}