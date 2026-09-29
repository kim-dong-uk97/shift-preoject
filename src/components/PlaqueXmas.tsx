"use client";

import { useSeason } from "@/lib/season";
import { XmasGarland } from "./ChristmasDecor";

// 장식 공 색: 초록 → 노랑 → 빨강 번갈아
const BAUBLE_COLORS = ["#4cbf6a", "#f2c94c", "#e84a3c"];

/** 크리스마스 모드: BEST AI 도구 제목판 네 변을 화환으로 두르고 장식 공 6개 (전구 없음) */
export default function PlaqueXmas() {
  const { xmas } = useSeason();
  if (!xmas) return null;
  return <XmasGarland wrap span={30} sag={3} topY={-3} bulbsPerSpan={0} baubleCount={6} baubleColors={BAUBLE_COLORS} />;
}
