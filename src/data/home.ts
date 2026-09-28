import type { MenuIconName } from "@/lib/menuIcons";

export type ToolItem = { title: string; desc: string; color: string };
export type ToolCategory = { title: string; icon: MenuIconName; color: string; items: ToolItem[] };
export type Video = { title: string; views: string; tags: string[]; thumb: string };

export const toolCategories: ToolCategory[] = [
  {
    title: "일하기",
    icon: "work",
    color: "var(--color-green)",
    items: [
      { title: "AI 슬라이드", desc: "빠르고 높은 퀄리티 제작 PPT", color: "var(--color-purple)" },
      { title: "AI 엑셀 시트", desc: "자주사용하는 엑셀 자동화 시트", color: "var(--color-green)" },
      { title: "AI 문서 자동화", desc: "자료 조사와 문서까지 한번에", color: "var(--color-gold)" },
    ],
  },
  {
    title: "배우기",
    icon: "learn",
    color: "var(--color-red)",
    items: [
      { title: "AI 이미지", desc: "빠르게 원하는 AI 이미지 제작", color: "var(--color-red)" },
      { title: "AI 코드", desc: "아이디어에서부터 웹 사이트 구현까지 AI로 제작", color: "var(--color-blue)" },
      { title: "AI 디자인", desc: "원하는 디자인에서 부터 각 종 레퍼런스 까지 탐구", color: "var(--color-purple)" },
    ],
  },
  {
    title: "만들기",
    icon: "make",
    color: "var(--color-gold)",
    items: [
      { title: "나만의 AI Agent 만들기", desc: "나만의 AI agent 자동화 만들기 ex) 주식, 정보, 가계부 등", color: "var(--color-gold)" },
      { title: "AI 영상 만들기", desc: "AI영상으로 수익화 하기", color: "var(--color-red)" },
      { title: "SNS 광고 자동화 하기", desc: "나만의 가게 AI 자동화 홍보하기 ex) 인스타그램, 스레드, 유튜브", color: "var(--color-blue)" },
    ],
  },
];

export const bestVideos: Video[] = [
  { title: "내 PC에 나만의 AI 만들기", views: "9만", tags: ["AI 자동화", "AI 만들기"], thumb: "/thumbnails/my-pc-ai.png" },
  { title: "요즘 난리 난 AI 오픈클로 비트코인 자동 매매 놀라운 수익화", views: "10만", tags: ["AI 자동화", "비트코인"], thumb: "/thumbnails/openclaw-bitcoin.png" },
  { title: "왕초보도 혼자 가능한 딱 3일 만에 AI공부 끝내기!", views: "15만", tags: ["AI 배우기", "AI 자동화"], thumb: "/thumbnails/ai-study-3days.png" },
  { title: "5초만에 원하는 이미지 만들기!", views: "12만", tags: ["AI 배우기", "AI 생성"], thumb: "/thumbnails/ai-image-5sec.png" },
  { title: "AI 쇼츠영상 너무 쉽다 10분만에 마스터 하는 방법", views: "41만", tags: ["AI 자동화", "AI 영상"], thumb: "/thumbnails/ai-shorts-10min.png" },
];
