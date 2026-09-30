import { INK } from "@/lib/sprites";

/** 앉아서 오른쪽 앞발을 들어 가리키는 치즈냥이 (꼬리는 왼쪽). 배너·안내 페이지에서 같이 씀 */
export const CAT = [
  "....o.......o.....",
  "....oo.....oo.....",
  "....oPo...oPo.....",
  "....oOOoooOOo.....",
  "...oOOOOOOOOOo....",
  "...oOOOOOOOOOo....",
  "...oOGwOOOGwOo....",
  "...oOGGOOOGGOo.oo.",
  "...oOPWWpWWPOooWWo",
  "....oOWWWWWOooOWWo",
  ".....ooOOOoooOOoo.",
  ".....oOOWOOOOo....",
  "....oOOWWWOOo.....",
  "..o.oDOWWWODo.....",
  ".oo.oOOWWWOOo.....",
  "oOooODOWWWODOo....",
  "oOOoOOOWWWOOOo....",
  "oOOoOOWWoOOOOo....",
  ".oo.ooooooooo.....",
];
export const CAT_PALETTE = {
  o: INK,
  O: "#f29a3a", // 치즈 털
  D: "#c8641e", // 줄무늬
  W: "#fbe3b8", // 주둥이·배·발
  P: "#ff9fb0", // 귀 안쪽·볼
  p: "#ff8fa3", // 코
  G: INK, // 눈
  w: "#ffffff", // 눈 반짝
};
