import { characters, defaultCharacter, type Character } from "@/data/characters";

export type ChatMessage = { role: "npc" | "user"; text: string };
export type Conversation = { id: string; title: string; updatedAt: number; messages: ChatMessage[] };

export const GREETING = "반갑습니다, 모험가님! 무엇이든 물어보세요 :)";
// AI 연동 전 임시 응답
export const DEMO_REPLY = "좋은 질문이에요! 지금은 연습용 대답이라, 진짜 AI 연결은 곧 준비할게요.";
export const DEMO_DELAY_MS = 2200;

export const NPC_KEY = "aurora.npc";
const CONV_KEY = "aurora.conversations";
const MAX_CONVERSATIONS = 50;

export function loadNpc(): Character {
  try {
    return characters.find((c) => c.id === localStorage.getItem(NPC_KEY)) ?? defaultCharacter;
  } catch {
    return defaultCharacter;
  }
}

export function saveNpc(c: Character) {
  try {
    localStorage.setItem(NPC_KEY, c.id);
  } catch {
    // 저장 불가 시 이번 방문 동안만 유지
  }
}

// TODO(TBD): 대화 기록은 현재 브라우저 저장소. 로그인·서버 저장 방식 확정 후 교체
export function loadConversations(): Conversation[] {
  try {
    const v = JSON.parse(localStorage.getItem(CONV_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((c) => c && typeof c.id === "string" && Array.isArray(c.messages)) : [];
  } catch {
    return [];
  }
}

export function saveConversations(list: Conversation[]) {
  try {
    const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(CONV_KEY, JSON.stringify(sorted));
  } catch {
    // 저장 불가 시 화면에만 유지
  }
}

/** 첫 질문으로 대화 제목 만들기 */
export const titleFrom = (text: string) => (text.length > 24 ? `${text.slice(0, 24)}…` : text);

/** "방금 / 5분 전 / 3시간 전 / 9월 28일" */
export function relativeTime(ts: number, now = Date.now()) {
  const m = Math.floor((now - ts) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
