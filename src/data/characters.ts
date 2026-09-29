import { INK, npcPalette, npcRows } from "@/lib/sprites";

export type Character = {
  id: string;
  name: string;
  role: string;
  rows: string[];
  palette: Record<string, string>;
  /** true면 캐릭터 뽑기로 얻는 캐릭터 */
  gacha?: boolean;
};

const SKIN = "#f2c29b";
const SKIN_SHADE = "#d49a72";

/** 마법사 (16x20) */
const wizardRows = [
  ".......oo.......",
  "......oppo......",
  ".....oppppo.....",
  "....oppyppppo...",
  "...oppppppppo...",
  "..oooooooooooo..",
  "...osssssssso...",
  "...osesssseso...",
  "...owwwSSwwwo...",
  "...owwwwwwwwo...",
  "..oppwwwwwwppo..",
  ".opppwwwwwwpppo.",
  ".oSppwwwwwwppSo.",
  ".oSpppwwwwpppSo.",
  "..oppppppppppo..",
  "..oppppppppppo..",
  "..oppppppppppo..",
  "..oppppppppppo..",
  "...oppppppppo...",
  "...oooooooooo...",
];

/** 엘프 (16x20): 긴 금발 + 잎 머리띠 + 뾰족 귀 + 드레스 */
const elfRows = [
  ".....oooooo.....",
  "....ohhhhhho....",
  "...ohhhyhhhho...",
  "..ohhhhhhhhhho..",
  ".EohhsssssshhoE.",
  ".oEhseesseeshEo.",
  "..ohspsssspsho..",
  "..ohsssrrsssho..",
  "..ohhssssssHho..",
  "..ohhhossohhho..",
  "..ohhoddddohho..",
  ".ohhoddwwddohho.",
  ".ohoSddDDddSoho.",
  "..ooSddddddSoo..",
  "...oddddddddo...",
  "...odDddddDdo...",
  "..oddddddddddo..",
  "..odddDddDdddo..",
  ".oddddddddddddo.",
  ".oooooooooooooo.",
];

/** 로봇 (16x20) */
const robotRows = [
  "......oyyo......",
  ".......oo.......",
  "...oooooooooo...",
  "...ommmmmmmmo...",
  "...omccmmccmo...",
  "...omccmmccmo...",
  "...ommmmmmmmo...",
  "...omddddddmo...",
  "...ommmmmmmmo...",
  "...oooooooooo...",
  "....oommmmoo....",
  "..oMMMMMMMMMMo..",
  "..oMMMMccMMMMo..",
  ".ogoMMMMMMMMogo.",
  ".ogoMMyyyyMMogo.",
  ".oooMMMMMMMMooo.",
  "...oMMMMMMMMo...",
  "...ommmoommmo...",
  "...ommmo.ommmo..",
  "...ooooo.ooooo..",
];

/** 도도한 고양이 (16x20): 반쯤 감은 눈, 리본 목걸이, 세운 꼬리 */
const catRows = [
  "...o.......o....",
  "..ofo.....ofo...",
  "..offo...offo...",
  "..okkfooofkko...",
  ".offfffffffffo..",
  "..ooffffffffo...",
  "..oeffffffffeoo.",
  "..ofeeelleeefofo",
  "..offggllggffffo",
  "..offllppllffffo",
  "..orffleelffrffo",
  "...orrrrrrrrffo.",
  "..oroffyyfforfo.",
  "...offllllffffo.",
  "...offllllffffo.",
  "..offfllllffffo.",
  "..offfllllffffo.",
  "...offfllfffffo.",
  "...offffffffoo..",
  "....ollffllo....",
];

/** 마녀 (16x20): 은발 꼬마 마녀 — 넓은 챙 검은 모자 + 빨간 리본, 빨간 망토, 검은 드레스, 수정 구슬 */
const witchRows = [
  "..otttoo........",
  "...ootttoo......",
  ".....ottttooo...",
  "....ottttttrro..",
  "oooorrrrrrrrrroo",
  "tttttttttttttttt",
  "oooohhhhhhhhoooo",
  "...ohssssssho...",
  "..ohhsgssgshho..",
  "..ohhpssssphho..",
  "..ohhhhmmhhhho..",
  "..ohccwwwwccho..",
  "..ohccdwwdccho..",
  "..occcBBbbccco..",
  "..occsblbbscco..",
  "..occcbbbBccco..",
  ".occccddddcccco.",
  ".occccddddcccco.",
  ".occccddddcccco.",
  "..oookkookkooo..",
];

/** 말괄량이 소녀 (16x20): 옆으로 뻗친 꼬불 양갈래, 주근깨, 원피스 + 앞치마, 짝짝이 줄무늬 양말 */
const girlRows = [
  ".......oo.......",
  ".....oohhoo.....",
  "ooo.ohhhhhho.ooo",
  "hbbohhhhhhhhobbh",
  "hhhhhhhshshhhhhh",
  "hhoohsssssshoohh",
  "oo.ohsessesho.oo",
  "....ofssssfo....",
  "....oosmmsoo....",
  "...oddwwwwddo...",
  "...odwwwwwwdo...",
  "...odwwwwwwdo...",
  "...odwWWwwwdo...",
  "...oswWWwwwso...",
  "..oddwwwwwwddo..",
  "..oddddddddddo..",
  "...oorrooggoo...",
  "....owwoowwo....",
  "....orrooggo....",
  "...okkkookkko...",
];

/** 학생 (16x20, 모모와 같은 비율): 빵모자, 셔츠 + 넥타이 + 반바지, 무릎 양말, 등에 멘 검은 책가방 */
const studentRows = [
  "....oocoooo.....",
  "...occccccco....",
  "..occccccccco...",
  "..occhhhhhhco...",
  "...ohhhhhhhho...",
  "...ohhsshshho...",
  "...ohsessesho...",
  "....opsssspo....",
  "...ooosmmsooo...",
  "..okjjwwwwjjko..",
  "..okjkjttjkjko..",
  "..okjkjttjkjko..",
  "..okjkjttjkjko..",
  "..oksjjjjjjsko..",
  "..okknnnnnnkko..",
  "...oonnoonnoo...",
  "....ossoosso....",
  "....owwoowwo....",
  "....owwoowwo....",
  "...obbboobbbo...",
];

const allCharacters: Character[] = [
  { id: "aurora", name: "오로라", role: "선술집 주인", rows: npcRows, palette: npcPalette },
  {
    id: "merlin",
    name: "멀린",
    role: "마법사",
    rows: wizardRows,
    palette: { o: INK, p: "#6b4aa0", y: "#f2b544", s: SKIN, S: SKIN_SHADE, e: INK, w: "#efe6d2" },
  },
  {
    id: "luna",
    name: "루나",
    role: "엘프",
    rows: elfRows,
    palette: {
      o: INK,
      h: "#f5d77a",
      H: "#d9b252",
      y: "#6fcf8f",
      E: SKIN,
      s: SKIN,
      S: SKIN_SHADE,
      e: "#2f6a4a",
      p: "#f4a3a3",
      r: "#d0606a",
      d: "#3f7a5a",
      D: "#7fbf8f",
      w: "#efe6d2",
    },
  },
  {
    id: "bolt",
    name: "볼트",
    role: "AI 로봇",
    rows: robotRows,
    palette: { o: INK, y: "#f2b544", m: "#aab3bd", c: "#6fe3f0", d: "#4a423b", M: "#4f7fbf", g: "#8a8f96" },
  },
  {
    id: "dodo",
    name: "도도",
    role: "도도한 고양이",
    rows: catRows,
    palette: { o: INK, f: "#b9b1cc", l: "#ece7f4", k: "#f4a6b8", e: "#2a2340", g: "#6fcf8f", p: "#f08aa8", r: "#d8344a", y: "#f2c94c" },
  },
  {
    id: "hazel",
    name: "헤이즐",
    role: "마녀",
    rows: witchRows,
    palette: {
      o: INK,
      t: "#3a3242",
      r: "#d8344a",
      h: "#c9c3d6",
      s: "#f7e6dc",
      g: "#d8344a",
      p: "#f4a3b0",
      m: "#c0496a",
      c: "#c0392f",
      d: "#2a2230",
      w: "#f5f5f5",
      b: "#3fbf6a",
      B: "#b8f5c8",
      l: "#ffffff",
      k: "#2a2230",
    },
  },
  {
    id: "momo",
    name: "모모",
    role: "말괄량이 소녀",
    rows: girlRows,
    palette: { o: INK, h: "#e8702a", b: "#4cbf6a", s: SKIN, e: INK, f: "#c77a4a", m: "#c0496a", d: "#4f7fbf", w: "#f5f0e6", W: "#d9cfbd", r: "#d8344a", g: "#4cbf6a", k: "#2a1a10" },
  },
  {
    id: "haru",
    name: "하루",
    role: "학생",
    rows: studentRows,
    palette: { o: INK, c: "#2f3f6a", h: "#5a3a22", s: SKIN, e: INK, p: "#f4a3a3", m: "#c0496a", j: "#9cc9ec", w: "#f5f5f5", t: "#d8344a", k: "#1f1f24", n: "#7a5a3a", b: "#2a1a10" },
  },
];

// 선택 창 순서: 윗줄 오로라·모모·하루·볼트 / 아랫줄 도도·멀린·루나·헤이즐
const ORDER = ["aurora", "momo", "haru", "bolt", "dodo", "merlin", "luna", "hazel"];
export const characters: Character[] = ORDER.map((id) => {
  const c = allCharacters.find((x) => x.id === id);
  if (!c) throw new Error(`unknown character: ${id}`);
  return c;
});

export const defaultCharacter = characters[0];

/** 캐릭터 뽑기로 얻는 캐릭터 (선택 창 아랫줄) */
const GACHA_IDS = ["dodo", "merlin", "luna", "hazel"];
for (const c of characters) if (GACHA_IDS.includes(c.id)) c.gacha = true;
export const gachaCharacters = characters.filter((c) => c.gacha);

/**
 * 뽑기 캐릭터 잠금 여부.
 * 지금(false): 모두 선택 가능 / 나중에 true로 바꾸면 뽑기로 얻은 캐릭터만 선택 가능
 * TODO(TBD): 잠금 적용 시점 확정 후 true로 전환
 */
export const LOCK_GACHA_CHARACTERS = false;

const UNLOCK_KEY = "aurora.npc.unlocked";

/** 캐릭터 뽑기로 얻은 캐릭터 id 목록 (브라우저 저장) */
export function loadUnlocked(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(UNLOCK_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** 아직 없는 뽑기 캐릭터 중 하나를 무작위로 얻음. 모두 모았으면 null */
export function unlockRandomCharacter(): Character | null {
  const owned = loadUnlocked();
  const left = gachaCharacters.filter((c) => !owned.includes(c.id));
  if (!left.length) return null;
  const pick = left[Math.floor(Math.random() * left.length)];
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify([...owned, pick.id]));
  } catch {
    // 저장 불가 시 이번 방문 동안만
  }
  return pick;
}

/** 받침 유무에 따라 주격 조사 선택 (오로라가 / 멀린이) */
export function subjectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return "가";
  return code % 28 ? "이" : "가";
}
