export type HanjaItem = {
  id: number;
  character: string;
  meaning: string;
  reading: string;
};

export const defaultHanjaData: HanjaItem[] = [
  { id: 1, character: "山", meaning: "산", reading: "산" },
  { id: 2, character: "水", meaning: "물", reading: "수" },
  { id: 3, character: "火", meaning: "불", reading: "화" },
  { id: 4, character: "木", meaning: "나무", reading: "목" },
  { id: 5, character: "金", meaning: "쇠", reading: "금" },
  { id: 6, character: "土", meaning: "흙", reading: "토" },
  { id: 7, character: "月", meaning: "달", reading: "월" },
  { id: 8, character: "日", meaning: "해", reading: "일" },
  { id: 9, character: "門", meaning: "문", reading: "문" },
  { id: 10, character: "手", meaning: "손", reading: "수" },
  { id: 11, character: "耳", meaning: "귀", reading: "이" },
  { id: 12, character: "目", meaning: "눈", reading: "목" },
  { id: 13, character: "人", meaning: "사람", reading: "인" },
  { id: 14, character: "口", meaning: "입", reading: "구" },
  { id: 15, character: "心", meaning: "마음", reading: "심" },
];