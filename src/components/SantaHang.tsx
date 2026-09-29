"use client";

import { useSeason } from "@/lib/season";
import PixelSprite from "./PixelSprite";

/**
 * 선물 보따리를 어깨에 멘 산타 (28x34)
 * o: 외곽선, r/R: 빨강/그림자, w: 흰색, s: 피부, S: 코, p: 볼, e: 눈, b: 검정, y: 버클, k/K/l: 빨간 보따리(면/그림자/하이라이트), t: 끈
 */
const SANTA = [
  ".......o.......ooooooooooo..",
  "....oookooo...orrrrrrrrrrwo.",
  "...okkkkkkko.oorrrrrrrrrwwwo",
  "..okkkkkkkkkorrrrrrrrrrwwwww",
  ".okkllkkkkkkkrrrrrrrrrrrwwwo",
  "okkkllkkkkkkkrrrrrrrrrrrowo.",
  "okkkkkkkkkkkkrrrrrrrrrrroo..",
  "okkkkkkkkkkkkrrrrrrrrrrro...",
  "kkkkkkkkkkkkwwwwwwwwwwwwwo..",
  "okkkkkkkkkktwwwwwwwwwwwwwo..",
  "okkkkkkkkkKttKsssssssssoo...",
  "okkkkkkkkksssKssesssesso....",
  ".okkkkkkkksssospssSsspso....",
  "..okkkkkkkwwwoswwwwwwwso....",
  "...okkkkkkrrrwwwwwwwwwwwo...",
  "....oookoorrrwwwwwwwwwwwo...",
  ".......o.orrwwwwwwwwwwwwwo..",
  ".........orrrwwwwwwwwwwwo...",
  ".........orrrwwwwwwwwwwwooo.",
  ".........orrrrrwwwwwwwrRrrro",
  ".........orrrrrrrrwrrrrRrrro",
  "..........oorrrrrrrrrrrRrrro",
  "...........orrrrrrrrrrrRrrro",
  "...........orrrrrrrrrrrRrrro",
  "...........obbbbbyyybbbbbrro",
  "...........obbbbbyyybbbbbsso",
  "...........orrrrrwwwrrrRssso",
  "...........orrrrrwwwrrrRRoo.",
  "...........owwwwwwwwwwwwwo..",
  "............orrrrooorrrro...",
  "............orrrro.orrrro...",
  "............orrrro.orrrro...",
  "...........obbbbbo.obbbbbo..",
  "...........obbbbbo.obbbbbo..",
];

const PALETTE = {
  o: "#1e120a",
  r: "#c8352b",
  R: "#9e2720",
  w: "#f5f5f5",
  s: "#f2c29b",
  S: "#d98a6a",
  p: "#f09a9a",
  e: "#1e120a",
  b: "#1a1a1a",
  y: "#f2c94c",
  k: "#a8232b",
  K: "#7a1820",
  l: "#e2575c",
  t: "#f2c94c",
};

/** 산타 몸 가운데 칸 (이 열이 박스 테두리에 오도록 배치 → 오른쪽 절반은 박스 뒤로 가려짐) */
const MID_COL = 18;
const SCALE = 5;

/** 크리스마스 모드에서 산타 버튼을 누르면: 추천영상 박스 뒤에서 몸통 절반만 빼꼼 내민 산타 (넓은 화면에서만) */
export default function SantaHang() {
  const { xmas, santa } = useSeason();
  if (!xmas || !santa) return null;
  return (
    // 음수 z-index: 박스(aside)보다 뒤에 그려져 오른쪽 절반이 가려짐
    <div
      className="pointer-events-none absolute top-[22%] -z-10 hidden xl:block"
      style={{ left: -12 - MID_COL * SCALE }}
      aria-hidden="true"
    >
      {/* 박스 뒤에서 옆으로 미끄러져 나옴 */}
      <div className="animate-santa-enter">
        <div className="animate-santa" style={{ transformOrigin: `${MID_COL * SCALE}px 100%` }}>
          <PixelSprite rows={SANTA} palette={PALETTE} scale={SCALE} title="박스 뒤에서 나온 산타" />
        </div>
      </div>
    </div>
  );
}
