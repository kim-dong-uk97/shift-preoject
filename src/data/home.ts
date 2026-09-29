import type { MenuIconName } from "@/lib/menuIcons";

/** color: 마우스를 올리면 아이콘에 채워지는 색 */
export type ToolItem = { title: string; icon: MenuIconName; color: string };
export type ToolGroup = { title: string; items: ToolItem[] };
export type Video = { title: string; views: string; tags: string[]; thumb: string };

export const toolGroups: ToolGroup[] = [
  {
    title: "오피스 스위트",
    items: [
      { title: "AI 슬라이드", icon: "slide", color: "#f28a3c" },
      { title: "AI 시트", icon: "sheet", color: "#4cbf6a" },
      { title: "AI 문서", icon: "doc", color: "#4f8fe0" },
    ],
  },
  {
    title: "빌드 스위트",
    items: [
      { title: "디자인", icon: "design", color: "#b57ae8" },
      { title: "코드", icon: "code", color: "#3fbfd8" },
      { title: "CRM", icon: "crm", color: "#e8c34f" },
    ],
  },
  {
    title: "콘텐츠 제작",
    items: [
      { title: "AI 이미지", icon: "image", color: "#f26a9a" },
      { title: "AI 영상", icon: "video", color: "#e8504a" },
      { title: "AI 쇼츠", icon: "shorts", color: "#ff7a3d" },
    ],
  },
];

export const bestVideos: Video[] = [
  { title: "내 PC에 나만의 AI 만들기", views: "90만", tags: ["AI 자동화", "AI 만들기"], thumb: "/thumbnails/my-pc-ai.png" },
  { title: "요즘 난리 난 AI 오픈클로 비트코인 자동 매매 놀라운 수익화", views: "100만", tags: ["AI 자동화", "비트코인"], thumb: "/thumbnails/openclaw-bitcoin.png" },
  { title: "왕초보도 혼자 가능한 딱 3일 만에 AI공부 끝내기!", views: "150만", tags: ["AI 배우기", "AI 자동화"], thumb: "/thumbnails/ai-study-3days.png" },
  { title: "5초만에 원하는 이미지 만들기!", views: "120만", tags: ["AI 배우기", "AI 생성"], thumb: "/thumbnails/ai-image-5sec.png" },
  { title: "AI 쇼츠영상 너무 쉽다 10분만에 마스터 하는 방법", views: "410만", tags: ["AI 자동화", "AI 영상"], thumb: "/thumbnails/ai-shorts-10min.png" },
];
