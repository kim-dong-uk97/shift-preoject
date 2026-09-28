import { INK, npcPalette, npcRows } from "@/lib/sprites";

export type Character = {
  id: string;
  name: string;
  role: string;
  rows: string[];
  palette: Record<string, string>;
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

export const characters: Character[] = [
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
];

export const defaultCharacter = characters[0];

/** 받침 유무에 따라 주격 조사 선택 (오로라가 / 멀린이) */
export function subjectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return "가";
  return code % 28 ? "이" : "가";
}
