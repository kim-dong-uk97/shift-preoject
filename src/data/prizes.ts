import type { PrizeSprite } from "@/lib/sprites";

export type Rarity = "common" | "rare" | "legend" | "miss";

export type Prize = {
  id: string;
  name: string;
  desc: string;
  sprite: PrizeSprite;
  /** 스프라이트 팔레트 (o: 외곽선은 공통) */
  colors: Record<string, string>;
  rarity: Rarity;
  /** 확률 가중치 (합계 100 기준 %) */
  weight: number;
};

// TODO(TBD): 상품 구성·확률은 예시값. 운영 확정 후 서버에서 내려받도록 교체 필요
export const prizes: Prize[] = [
  { id: "can", name: "캔 음료", desc: "편의점 캔 음료 1개 교환권", sprite: "can", colors: { r: "#c0492f", w: "#efe6d2" }, rarity: "common", weight: 20 },
  { id: "pc1", name: "PC방 1시간", desc: "PC방 1시간 이용 쿠폰", sprite: "monitor", colors: { b: "#4f7fbf", c: "#bfe0ff" }, rarity: "rare", weight: 10 },
  { id: "pc3", name: "PC방 3시간", desc: "PC방 3시간 이용 쿠폰", sprite: "monitor", colors: { b: "#8d5fb0", c: "#f2b544" }, rarity: "legend", weight: 5 },
  { id: "character", name: "캐릭터 뽑기", desc: "동료 1명 획득 (도도·멀린·루나·헤이즐 중)", sprite: "card", colors: { x: "#8a5cc8", q: "#f2c94c" }, rarity: "legend", weight: 5 },
  { id: "miss", name: "꽝", desc: "다음 기회에!", sprite: "miss", colors: { x: "#8a7a66" }, rarity: "miss", weight: 60 },
];

export const rarityInfo: Record<Rarity, { label: string; className: string }> = {
  common: { label: "일반", className: "bg-cream text-ink" },
  rare: { label: "희귀", className: "bg-blue text-cream" },
  legend: { label: "전설", className: "bg-gold text-ink" },
  miss: { label: "꽝", className: "bg-wood-dark text-cream/80" },
};

/** 가중치 기반 추첨 (데모: 클라이언트 난수) */
export function drawPrize(): Prize {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * total;
  for (const p of prizes) {
    r -= p.weight;
    if (r < 0) return p;
  }
  return prizes[prizes.length - 1];
}
