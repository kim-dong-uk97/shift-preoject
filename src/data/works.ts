// 내 작업: 도구로 만든 결과물 목록
// TODO(TBD): 지금은 화면 확인용 예시 데이터. 도구 연동·저장 방식(로그인·서버) 확정 후 실제 목록으로 교체

export type Work = {
  id: string;
  /** 만든 도구 이름 (src/data/home.ts의 도구 title과 같아야 분류됨) */
  tool: string;
  title: string;
  /** 마지막 수정일 (YYYY-MM-DD) */
  updatedAt: string;
};

export const sampleWorks: Work[] = [
  { id: "w1", tool: "AI 슬라이드", title: "3분기 매출 보고", updatedAt: "2026-09-28" },
  { id: "w2", tool: "AI 슬라이드", title: "신메뉴 기획안", updatedAt: "2026-09-21" },
  { id: "w3", tool: "AI 시트", title: "주간 방문자 정리", updatedAt: "2026-09-27" },
  { id: "w4", tool: "AI 문서", title: "이벤트 공지문", updatedAt: "2026-09-25" },
  { id: "w5", tool: "디자인", title: "가게 포스터 시안", updatedAt: "2026-09-24" },
  { id: "w6", tool: "코드", title: "예약 확인 봇", updatedAt: "2026-09-19" },
  { id: "w7", tool: "AI 이미지", title: "치즈냥이 캐릭터", updatedAt: "2026-09-29" },
  { id: "w8", tool: "AI 쇼츠", title: "PC방 소개 쇼츠", updatedAt: "2026-09-26" },
];
