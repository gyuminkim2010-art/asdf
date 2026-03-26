import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolName = String(searchParams.get("schoolName") || "").trim();

    const apiKey = process.env.NEIS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "NEIS API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (!schoolName) {
      return NextResponse.json(
        { ok: false, message: "학교 이름을 입력해 주세요." },
        { status: 400 }
      );
    }

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

    const schools = rows.map((row: any) => ({
      schoolName: row.SCHUL_NM,
      atptCode: row.ATPT_OFCDC_SC_CODE,
      schoolCode: row.SD_SCHUL_CODE,
      schoolType: row.SCHUL_KND_SC_NM || "",
      address: row.ORG_RDNMA || row.ORG_RDNDA || "",
    }));

    return NextResponse.json({
      ok: true,
      schools,
    });
  } catch (error) {
    console.error("GET /api/school-search error:", error);

    return NextResponse.json(
      { ok: false, message: "학교 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}