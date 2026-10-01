import type { MenuIconName } from "@/lib/menuIcons";

// "알아보기" 안내 페이지(/guide)의 문구. 여기 글만 고치면 페이지 내용이 바뀜
// TODO(TBD): 초안 문구. 실제 서비스 구성·명칭 확정 후 수정

export const promoMenu = {
  /** 맨 위 간판: 도구 타일이 깔린 어두운 배경 + 추천하는 치즈냥이 */
  hero: {
    // 제목 1줄: before + (금색 강조) + after
    titleBefore: "Arvis는 ",
    titleHighlight: "AI 선술집",
    titleAfter: "입니다.",
    title2: "좋은 AI 도구, 마음껏 쓰세요.",
    subtitle: "업무 자동화부터 나만의 맞춤 에이전트 구축까지",
    desc: "PC방에서 바로, 말 한마디로 시작하세요",
    order: "AI 만들기 시작하기",
    browse: "활용법 먼저 보기",
    bubble: "사장냥 강력 추천!",
  },

  /** 두 번째: 여기저기 흩어진 AI 가게 영수증 → Arvis 한 테이블로 모임 */
  compare: {
    titleBefore: "AI 가게, 다섯 군데나 ",
    titleHighlight: "돌지 마세요.",
    subtitle: "Arvis 한곳에서 좋은 AI 도구를 마음대로 골라 쓰세요.",
    // 왼쪽 흩어진 영수증 (TODO(TBD): 실제 서비스명 표기 여부 결정. 지금은 종류로만 표기)
    scattered: [
      { name: "대화 AI", lines: ["따로 가입", "따로 기록", "따로 결제"] },
      { name: "이미지 AI", lines: ["따로 가입", "따로 결제", "따로 저장"] },
      { name: "문서 AI", lines: ["따로 가입", "따로 기록", "따로 결제"] },
      { name: "영상 AI", lines: ["따로 가입", "따로 결제", "따로 저장"] },
      { name: "코딩 AI", lines: ["따로 가입", "따로 설정", "따로 결제"] },
    ],
    scatteredLabel: "여기저기 흩어짐",
    merged: {
      name: "Arvis",
      tagline: "모든 AI, 하나의 테이블.",
      points: ["엄선한 AI 도구 9가지", "AI Agent 하나로 전부 안내", "대화·작업 기록을 한곳에", "PC방에서 바로 시작"],
    },
  },

  /** 세 번째: 요금제 (월간/연간 전환). 금액은 원 단위 숫자로 적으면 쉼표·할인액은 자동 계산
   * TODO(TBD): 가격·크레딧·구성은 전부 예시 값. 실제 요금 정책 확정 후 교체 */
  pricing: {
    titleBefore: "요금제만 고르세요. ",
    titleHighlight: "도구는 마음껏.",
    monthlyLabel: "월간",
    yearlyLabel: "연간",
    yearlyBadge: "20% 할인",
    plans: [
      {
        id: "regular",
        name: "단골",
        desc: "처음 시작하는 데 필요한 모든 것",
        monthly: 9900,
        yearlyPerMonth: 7900,
        cta: "단골 시작하기",
        credit: "10,000 크레딧 / 월",
        creditNote: "매월 초기화",
        includesTitle: "마음껏 쓰는 것",
        features: ["AI 도구 9가지 전부", "AI Agent와 대화", "내 작업 저장공간 10 GB", "금광 뽑기권 보너스"],
        footnote: "언제든지 해지 가능",
        featured: false,
      },
      {
        id: "owner",
        name: "주인장",
        desc: "매일 많이 쓰는 파워 단골을 위해",
        monthly: 29900,
        yearlyPerMonth: 23900,
        cta: "주인장 시작하기",
        credit: "125,000 크레딧 / 월",
        creditNote: "넉넉하게",
        includesTitle: "단골 전부 포함, 추가로",
        features: ["단골 대비 12배 크레딧", "내 작업 저장공간 1 TB", "새 도구 먼저 써보기"],
        footnote: "언제든지 해지 가능",
        featured: true,
      },
    ],
    note: "※ 가격과 구성은 예시예요",
  },

  /** 네 번째: 도구 작업실 (왼쪽 큰 제목 + 오른쪽 9개 도구 타일, 도구 목록은 src/data/home.ts와 같음) */
  workspace: {
    titleLine1: "한 테이블 위의 작업실.",
    titleLine2: "새로운 일하는 방식.",
    desc: "말 한마디로 슬라이드와 문서를 만들고, 설명만으로 코드를 짜고, 이미지와 쇼츠까지 한 번에 뽑아요.",
    moreLabel: "활용법 보기",
  },

  /** 활용법: 도구를 이렇게 써보세요 (오른쪽 꼬리표는 인기·추천·NEW 표시) */
  specials: {
    title: "이렇게 써보세요",
    lead: "처음이라면 이런 것부터 시작해 보세요",
    items: [
      { name: "반복 업무 자동화", icon: "sheet", desc: "반복되는 문서·시트 작업을 대신 처리해요", tag: "인기" },
      { name: "나만의 AI 비서", icon: "doc", desc: "메일 정리, 일정 챙기기, 자료 요약까지", tag: "추천" },
      { name: "콘텐츠 한 번에", icon: "video", desc: "이미지·영상·쇼츠를 한 번에 만들어요", tag: "NEW" },
      { name: "나만의 도구 만들기", icon: "code", desc: "원하는 기능을 말하면 전용 도구로 만들어요", tag: "" },
    ] satisfies { name: string; icon: MenuIconName; desc: string; tag: string }[],
  },

  /** 이런 손님께 추천 */
  audience: {
    title: "이런 손님께 추천해요",
    items: [
      "매주 같은 보고서를 손으로 만드는 분",
      "AI를 써보고 싶은데 어디서부터 할지 모르는 분",
      "내 업무에 딱 맞는 도구가 없어 아쉬웠던 분",
    ],
  },

  /** 자주 묻는 질문 */
  faq: {
    title: "자주 묻는 질문",
    items: [
      { q: "코딩을 몰라도 만들 수 있나요?", a: "네. 하고 싶은 일을 말로 설명하면 NPC가 대신 만들어 드려요." },
      { q: "PC방에서 만든 건 집에서도 쓸 수 있나요?", a: "로그인하면 내 작업에 저장돼 어디서든 불러올 수 있어요. (준비 중)" },
      { q: "비용이 드나요?", a: "기본 기능은 무료이고, 일부 고급 기능은 추후 안내할 예정이에요." },
    ],
  },

  /** 맨 아래 시작 권유 */
  cta: {
    title: "자, 지금 바로 써보실래요?",
    desc: "하고 싶은 일 한 줄이면 충분해요",
    order: "AI 만들기 시작하기",
    home: "메인으로 돌아가기",
  },

  note: "※ 서비스 구성은 준비 중이라 바뀔 수 있어요",
};
