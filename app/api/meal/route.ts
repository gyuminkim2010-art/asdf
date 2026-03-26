import { NextResponse } from "next/server";

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function parseMealText(value: string, removeAllergy = false) {
  let text = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim();

  if (removeAllergy) {
    text = text.replace(/\(\d+(\.\d+)*\)/g, "");
  }

  return text;
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

    const from = String(searchParams.get("from") || "").trim();
    const to = String(searchParams.get("to") || "").trim();

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

    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date();

    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime())
    ) {
      return NextResponse.json(
        { ok: false, message: "날짜 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const url = new URL("https://open.neis.go.kr/hub/mealServiceDietInfo");
    url.searchParams.set("KEY", apiKey);
    url.searchParams.set("Type", "json");
    url.searchParams.set("pIndex", "1");
    url.searchParams.set("pSize", "200");
    url.searchParams.set("ATPT_OFCDC_SC_CODE", schoolInfo.atptCode);
    url.searchParams.set("SD_SCHUL_CODE", schoolInfo.schoolCode);
    url.searchParams.set("MLSV_FROM_YMD", formatDate(fromDate));
    url.searchParams.set("MLSV_TO_YMD", formatDate(toDate));

    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    const data = await response.json();
    const rows = data?.mealServiceDietInfo?.[1]?.row ?? [];

    const meals = rows.map((row: any) => ({
      date: row.MLSV_YMD,
      mealType: row.MMEAL_SC_NM || "",
      dish: parseMealText(row.DDISH_NM || "", true),
      calorie: row.CAL_INFO || "",
      nutrition: parseMealText(row.NTR_INFO || ""),
      origin: parseMealText(row.ORPLC_INFO || ""),
    }));

    return NextResponse.json({
      ok: true,
      school: schoolInfo.schoolName,
      meals,
    });
  } catch (error) {
    console.error("GET /api/meal error:", error);

    return NextResponse.json(
      { ok: false, message: "급식 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}