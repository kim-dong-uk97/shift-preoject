// 도트 스프라이트 원본 데이터 ('.'은 투명)

export const INK = "#1e120a";

/** 선술집 주인 NPC (16x20) */
export const npcRows = [
  "....oooooooo....",
  "...ohhhhhhhho...",
  "..ohhhhhhhhhho..",
  "..ohhsssssshho..",
  "..ohssssssssho..",
  "..oosessssesoo..",
  "...osssSSssso...",
  "...ommmmmmmmo...",
  "...osmssssmso...",
  "....osssssso....",
  "...owwwoowwwo...",
  "..owwwwaawwwwo..",
  ".owwwaaaaaawwwo.",
  ".oSwaaaaaaaawSo.",
  ".oSSaaaaaaaaSSo.",
  "..ooaaaaaaaaoo..",
  "...oaaaaaaaao...",
  "...oaaaaaaaao...",
  "...oaaaooaaao...",
  "...oooo..oooo...",
];

export const npcPalette = {
  o: INK,
  h: "#7a4122",
  s: "#f2c29b",
  S: "#d49a72",
  e: INK,
  m: "#5a2e15",
  w: "#efe6d2",
  a: "#a0452e",
};

/** 9x9 단색 아이콘 (x: 채움) */
export const icons = {
  play: [
    "x......",
    "xxx....",
    "xxxxx..",
    "xxxxxxx",
    "xxxxx..",
    "xxx....",
    "x......",
  ],
  arrowDown: ["..x..", "..x..", "xxxxx", ".xxx.", "..x.."],
  send: ["..x..", ".xxx.", "xxxxx", "..x..", "..x.."],
  plus: ["..x..", "..x..", "xxxxx", "..x..", "..x.."],
  mic: ["..xxx..", "..xxx..", "x.xxx.x", "x.xxx.x", ".x...x.", "..xxx..", "...x...", ".xxxxx."],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof icons;

/** 메뉴판 항목 앞 보석 (7x7, x: 색 / h: 하이라이트) */
export const gemRows = [
  "..ooo..",
  ".oxhxo.",
  "oxhxxxo",
  "oxxxxxo",
  ".oxxxo.",
  "..oxo..",
  "...o...",
];

/* ---------- 금광 위젯 ---------- */

/** 안전모 쓴 광부 몸통 (20x16, 오른쪽을 봄) */
const minerBase = [
  "..oooooo",
  ".oyyyyyyo",
  ".oyyyylllo",
  "oooooooooo",
  ".osssssso",
  ".ossssseo",
  ".osssssso",
  "..osssso",
  ".obbbbbbo",
  "obbbbbbbso",
  "obbbbbbbso",
  ".obbbbbbo",
  ".oppppppo",
  ".opppoppo",
  ".opo..opo",
  ".ooo..ooo",
].map((r) => r.padEnd(20, "."));

/** 기본 그리드 위에 좌표 목록을 특정 문자로 덮어씀 */
function overlay(base: string[], points: [number, number][], ch: string) {
  const rows = base.map((r) => r.split(""));
  for (const [x, y] of points) rows[y][x] = ch;
  return rows.map((r) => r.join(""));
}

/** 프레임 A: 곡괭이를 들어 올림 */
export const minerUpRows = overlay(
  overlay(minerBase, [[9, 8], [10, 7], [10, 6], [11, 5], [11, 4], [12, 3], [12, 2]], "w"),
  [[10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [9, 2], [15, 2], [15, 3]],
  "g",
);

/** 프레임 B: 곡괭이로 내려침 */
export const minerDownRows = overlay(
  overlay(minerBase, [[10, 9], [11, 10], [12, 10], [13, 11], [14, 11]], "w"),
  [[15, 8], [15, 9], [15, 10], [15, 11], [15, 12], [15, 13], [14, 7], [16, 14]],
  "g",
);

export const minerPalette = {
  o: INK,
  y: "#f2b544",
  l: "#fff4c0",
  s: "#f2c29b",
  e: INK,
  b: "#4f7fbf",
  p: "#5c3620",
  w: "#a0703c",
  g: "#aab3bd",
};

/** 금이 박힌 바위 (12x10) */
export const oreRows = [
  "...oooooo...",
  "..orrrrrro..",
  ".orrGGrrrro.",
  ".orGHGrrdro.",
  "orrrGrrrrdro",
  "orrrrrGGrdro",
  "ordrrGHGrrro",
  "orddrrGrrddo",
  ".oddddddddo.",
  "..oooooooo..",
];

export const orePalette = { o: INK, r: "#6b6259", d: "#4a423b", G: "#f2b544", H: "#fff1a8" };

/** 뽑기권 (11x6, 양옆 홈) */
export const ticketRows = [
  "ooooooooooo",
  "oyyyoyyyyyo",
  ".yyyoyrryy.",
  ".yyyoyrryy.",
  "oyyyoyyyyyo",
  "ooooooooooo",
];

export const ticketPalette = { o: INK, y: "#f2b544", r: "#c0492f" };

/* ---------- NPC 머리 위 기호 (7x12) ---------- */

export const exclaimRows = [
  "..ooo..",
  "..oyo..",
  "..oyo..",
  "..oyo..",
  "..oyo..",
  "..oyo..",
  "..oyo..",
  "..ooo..",
  ".......",
  "..ooo..",
  "..oyo..",
  "..ooo..",
];

export const questionRows = [
  ".ooooo.",
  "oyyyyyo",
  "oyoooyo",
  "ooo.oyo",
  "..ooyyo",
  "..oyyo.",
  "..oyo..",
  "..ooo..",
  ".......",
  "..ooo..",
  "..oyo..",
  "..ooo..",
];

/* ---------- 뽑기 상품 (9x9) ---------- */

export const prizeSprites = {
  can: {
    rows: ["..ooooo..", ".orrrrro.", ".orwwwro.", ".orwwwro.", ".orrrrro.", ".orwwwro.", ".orrrrro.", ".orrrrro.", "..ooooo.."],
  },
  coffee: {
    rows: ["..s.s....", "...s.s...", "ooooooo..", "obbbbboo.", "obbbbbo.o", "obbbbboo.", "obbbbbo..", ".ooooo...", "........."],
  },
  monitor: {
    rows: ["ooooooooo", "obbbbbbbo", "obcbbbbbo", "obbbbbbbo", "obbbbbbbo", "ooooooooo", "...ooo...", "..ooooo..", "........."],
  },
  miss: {
    rows: ["oo.....oo", "oxo...oxo", ".oxo.oxo.", "..oxoxo..", "...oxo...", "..oxoxo..", ".oxo.oxo.", "oxo...oxo", "oo.....oo"],
  },
} satisfies Record<string, { rows: string[] }>;

export type PrizeSprite = keyof typeof prizeSprites;

/** 뽑기 캡슐 (9x9, 위: 색 c / 하이라이트 h / 아래: 흰색 w) */
export const capsuleRows = [
  "..ooooo..",
  ".occccco.",
  "occcchcco",
  "occccccco",
  "ooooooooo",
  "owwwwwwwo",
  "owwwwwwwo",
  ".owwwwwo.",
  "..ooooo..",
];
