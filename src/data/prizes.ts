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

// ── 카드 섞기(셔플 백) 방식 ──
// 가중치 비율대로 카드 묶음을 만들어 섞은 뒤 한 장씩 뽑고, 다 쓰면 새로 섞음
// (60/20/10/5/5 → 20장: 꽝 12, 캔 4, 1시간 2, 3시간 1, 캐릭터 1) → 묶음마다 비율이 정확히 맞고,
// 섞을 때 꽝이 ${MAX_MISS_STREAK}번 넘게 이어지지 않게 골라서 골고루 섞여 나옴
// TODO(TBD): 실제 보상 지급 시에는 서버에서 추첨·보관해야 함 (지금은 브라우저 저장소라 조작 가능)
const DECK_KEY = "aurora.gacha.deck";
/** 꽝이 이보다 길게 이어지지 않도록 섞음 (묶음 경계 포함) */
const MAX_MISS_STREAK = 4;

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** 상품 구성이 바뀌면 남은 묶음을 버리고 새로 만들기 위한 표시 */
const deckSignature = () => prizes.map((p) => `${p.id}:${p.weight}`).join(",");

const randomInt = (n: number) => {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
};

/** 뽑는 순서(배열 뒤→앞)로 봤을 때 꽝 연속이 MAX_MISS_STREAK 이하인지 (앞 묶음에서 이어진 연속 포함) */
function spreadOk(deck: string[], carried: number) {
  let run = carried;
  for (let i = deck.length - 1; i >= 0; i--) {
    run = deck[i] === "miss" ? run + 1 : 0;
    if (run > MAX_MISS_STREAK) return false;
  }
  return true;
}

/** 새 묶음: 가중치를 최대공약수로 나눈 장수만큼 넣고 피셔-예이츠로 섞음 (꽝이 몰리면 다시 섞음) */
function newDeck(carried: number): string[] {
  const unit = prizes.reduce((g, p) => gcd(g, p.weight), 0) || 1;
  const deck = prizes.flatMap((p) => Array<string>(Math.round(p.weight / unit)).fill(p.id));
  for (let tries = 0; tries < 500; tries++) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    if (spreadOk(deck, carried)) break;
  }
  return deck;
}

/** 이번 묶음 크기 (확률 안내 문구용) */
export const deckSize = () => {
  const unit = prizes.reduce((g, p) => gcd(g, p.weight), 0) || 1;
  return prizes.reduce((n, p) => n + Math.round(p.weight / unit), 0);
};

/** 한 장 뽑기: 남은 묶음에서 맨 뒤 카드를 꺼냄 (묶음이 비었거나 구성이 바뀌었으면 새로 섞음) */
export function drawPrize(): Prize {
  let rest: string[] = [];
  let streak = 0; // 지금까지 이어진 꽝 연속
  try {
    const saved = JSON.parse(localStorage.getItem(DECK_KEY) ?? "null");
    if (saved?.sig === deckSignature() && Array.isArray(saved.rest)) {
      rest = saved.rest.filter((id: unknown) => prizes.some((p) => p.id === id));
      streak = Number(saved.streak) || 0;
    }
  } catch {
    // 저장소를 못 읽으면 새 묶음
  }
  if (rest.length === 0) rest = newDeck(streak);
  const id = rest.pop()!;
  streak = id === "miss" ? streak + 1 : 0;
  try {
    localStorage.setItem(DECK_KEY, JSON.stringify({ sig: deckSignature(), rest, streak }));
  } catch {
    // 저장 불가 시 이번 뽑기만 반영
  }
  return prizes.find((p) => p.id === id) ?? prizes[prizes.length - 1];
}
