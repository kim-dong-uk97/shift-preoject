# SHIFT IA 도면

PC방 통합 소프트웨어 SHIFT — Seat Web(이용자)·Counter Web(직원) 정보구조 및 서비스 플로우 참조 문서.
FigJam 실물 보드와 2026-09-06 대조 완료한 최종본.

## 프로젝트 컨텍스트

- **프로젝트**: SHIFT (PC방 통합 소프트웨어, AI 에이전트 기반 주문·결제·좌석이동)
- **담당 트랙**: IA / Wireframe / Design System / UI (오너: 김동욱, W5~W8)
- **시스템 경계**:
  - 결제/인증은 "핑거(Finger)"와 연동 — 자체 결제 인프라를 새로 만들지 않음
  - 노하드(디스크리스) 인프라는 기존 것 유지 — 대체 대상 아님
  - 신규 개발 범위: Seat Shell(Windows) + Seat Web + Ops/Counter Web(운영+관리 통합) 클라이언트, 그 위의 AI 에이전트(음성·채팅) 레이어
- **팀 구조 (SHIFT P1 Master WBS v1.0 기준)**:
  - 김동욱: IA/Wireframe/Design System/UI (W5~W8) — 이 문서의 산출물
  - 김정욱: 경쟁사 분석·System Architecture/ADR·Domain Model/ERD — 아키텍처 총괄
  - 이영광: WBS 마스터·Test Strategy/QA·최종 인도 — PM 겸 QA/배포 총괄
  - 이승화: VOC 추적·Runbook/교육
  - 노은지/박상준: Backend Domain/API/Payment Integration(W5~W15) — Finger 연동
  - 조재민: Seat Shell/Seat Web/Counter·Admin 구현(W6~W10) — 이 IA를 이어받아 개발
- **핸드오프**: 김동욱의 IA/Wireframe(W5~W8)이 끝나야 조재민의 구현(W6~W10)이 이어지는 구조라 일정이 타이트하게 겹침. Handoff 산출물은 QA가 검증 가능한 수준의 상태/인터랙션 스펙 필요.

---

## Sheet 01 — Service Flow (최종본)

Seat Web(이용자)와 Counter Web(직원) 사이의 전체 서비스 흐름. 주문(메뉴탐색→옵션·세트선택→장바구니→결제→주문보드 접수→조리/취소→주문 상태 확인→수령 완료)과 좌석이동·메신저(AI 지름길 + 직접 경로)가 모두 끝까지 연결된 상태.

핵심 설계 결정:
- **AI 어시스턴트의 점선은 메뉴 탐색 하나에만 연결**해 그 뒤로 이어지는 실선 체인(메뉴탐색→옵션·세트선택→장바구니→결제) 전체를 대신 수행함을 나타낸다 — 단계마다 따로 긋지 않는다.
- **좌석이동·메신저는 AI 없이도 항상 쓸 수 있어야 한다**: AI 점선 지름길뿐 아니라, 좌석 착석 지점에서 바로 가는 실선 경로(좌석이동 → 좌석이동 요청 처리, 알림수신 ↔ 메신저)가 별도로 존재한다.
- **주문 상태 확인은 결제 이후 단계가 아니라**, 알림수신·좌석이동·마이페이지와 같은 층위의 직접 진입 가지다 — 언제든 확인 가능한 화면이기 때문.
- **Counter Web도 Seat Web과 대칭**으로 로그인(공용 계정)에서 주문보드·좌석이동 요청 처리·메신저 세 갈래로 갈라진다.
- 결제 → 주문보드 접수로 카운터에 전달되고, 조리 완료·취소·환불 처리가 모두 주문 상태 확인을 거쳐 수령 완료·종료로 합류한다.

```mermaid
flowchart TD
    start(["좌석 착석 · QR 인증"])
    login(["로그인<br/>(공용 계정)"])

    subgraph seat ["Seat Web (이용자)"]
        ai(["AI 어시스턴트<br/>(음성 · 채팅)"])
        notice["알림수신"]
        menu["메뉴 탐색"]
        mypage["마이페이지"]
        seatMove["좌석이동"]
        select["옵션 · 세트 선택"]
        cart["장바구니"]
        pay["결제"]
        status["주문 상태 확인"]
        finish(["수령 완료 · 종료"])
    end

    subgraph counter ["Counter Web (직원)"]
        messenger["메신저"]
        seatMoveHandle["좌석이동 요청 처리<br/>(승인 · 거절)"]
        board["주문보드 접수"]
        stock{"재고 있음?"}
        cook["조리중"]
        complete["조리 완료"]
        refund["취소 · 환불 처리"]
    end

    start -->|"AI Agent 사용"| ai
    start --> notice
    start --> menu
    start --> mypage
    start --> seatMove
    start --> status
    ai -.-> menu
    ai -.-> messenger
    ai -.-> seatMoveHandle

    menu --> select --> cart --> pay
    seatMove -->|"이동 요청"| seatMoveHandle
    notice <-->|"메시지 · 문의"| messenger

    login --> board
    login --> seatMoveHandle
    login --> messenger

    pay --> board
    board --> stock
    stock -->|"Yes"| cook --> complete
    stock -->|"No"| refund
    complete --> status
    refund --> status
    status --> finish

    classDef aiNode fill:#E9E1F7,stroke:#7C5CBF,color:#2E1F4D;
    classDef stateNode fill:#FCEFD1,stroke:#C98A1F,color:#3A2E10;
    classDef negNode fill:#FBE1DE,stroke:#C4453A,color:#5C1A14;
    classDef posNode fill:#DFF3E6,stroke:#2F9E64,color:#123821;

    style seat fill:#EAF4FF,stroke:#3DADFF
    style counter fill:#FFF8E8,stroke:#FFC943
    class ai,messenger,seatMoveHandle aiNode;
    class stock stateNode;
    class refund negNode;
    class complete,finish posNode;
```

---

## Sheet 02 — Seat Web IA

이용자가 좌석에서 접속하는 화면. 하단 탭은 주문·계정 2개로 단순화했고, 주문 상태는 별도 탭이 아니라 주문 탭 안의 한 단계로 포함된다. AI 어시스턴트가 전역에서 주문·좌석이동·알림·계정 조회까지 대신 실행하며(점선), 메뉴 결제는 Finger 연동으로 즉시 처리되고 PC 이용시간·요금(계정 탭)과는 완전히 분리된다.

```mermaid
flowchart TD
    seatRoot["Seat Web"]
    ai["AI 어시스턴트<br/>[전역 음성·채팅]"]
    aiState["상태: 대기·듣는 중<br/>처리중·실행완료·실패"]
    auth["로그인·좌석 인증<br/>[진입·1회]"]
    order["주문<br/>[하단 탭]"]
    menuList["메뉴 목록<br/>[기본 화면]"]
    detail["상품 상세·옵션/세트<br/>[모달]"]
    detailState["상태: 판매중·품절"]
    cart["장바구니<br/>[전역 바텀시트]"]
    cartState["상태: 비어있음·담김"]
    payment["결제<br/>[풀스크린 플로우]<br/>Finger 연동 · 즉시 결제"]
    paymentState["상태: 결제대기·완료·실패"]
    seatMove["좌석 이동<br/>[모달·요청]"]
    seatMoveState["상태: 요청됨·승인대기·완료"]
    orderStatus["주문 상태<br/>[주문 탭 내 화면]"]
    statusState["상태: 대기·조리중<br/>완료·품절·취소"]
    account["계정<br/>[하단 탭]"]
    accountState["상태: 회원·비회원"]
    accountTime["잔여시간·요금<br/>[표시]"]
    notice["알림·메시지함<br/>[전역 토스트]"]
    noticeState["상태: 공지·개별 메시지"]

    seatRoot --> ai --> aiState
    ai -.->|"주문 실행"| order
    ai -.->|"좌석이동 실행"| seatMove
    ai -.->|"알림 확인"| notice
    ai -.->|"계정 조회"| account
    seatRoot --> auth
    seatRoot --> order
    order --> menuList --> detail --> detailState
    order --> cart --> cartState
    order --> payment
    payment --> paymentState
    order --> orderStatus --> statusState
    seatRoot --> seatMove --> seatMoveState
    seatRoot --> account
    account --> accountState
    account --> accountTime
    seatRoot --> notice --> noticeState

    classDef rootNode fill:#DCEBF7,stroke:#1F5C8B,color:#0B2A40,font-weight:bold;
    classDef stateNode fill:#FCEFD1,stroke:#C98A1F,color:#3A2E10;
    classDef negNode fill:#FBE1DE,stroke:#C4453A,color:#5C1A14;
    classDef posNode fill:#DFF3E6,stroke:#2F9E64,color:#123821;
    classDef specialNode fill:#E9E1F7,stroke:#7C5CBF,color:#2E1F4D;

    class seatRoot rootNode;
    class aiState,detailState,cartState,paymentState,seatMoveState,statusState,accountState,noticeState stateNode;
    class ai,seatMove specialNode;
    class accountTime posNode;
```

---

## Sheet 03 — Ops Web IA (Counter + Admin)

카운터 직원과 관리자가 함께 쓰는 공용 계정 화면. 운영(주문·좌석·메신저)과 관리(메뉴·좌석·게임·요금제) 두 영역으로 나뉜다. 메신저는 좌석 상세를 거치지 않는 좌석현황판의 독립 기능이다.

```mermaid
flowchart LR
    opsRoot["Ops Web<br/>(Counter + Admin)"]
    login["로그인<br/>[진입·공용 계정]"]

    subgraph counterOps ["운영 (Counter)"]
        direction TB
        board["주문보드<br/>[탭]"]
        boardState["상태: 신규·조리중·완료"]
        orderDetail["주문 상세<br/>[모달]"]
        cooking["조리중 전환<br/>[액션]"]
        soldOut["품절 처리<br/>[액션]"]
        cancel["취소·환불 처리<br/>[액션]"]
        seatBoard["좌석 현황판<br/>[탭]"]
        seatBoardState["상태: 사용중·빈자리·예약"]
        seatDetail["좌석 상세<br/>[모달]"]
        seatProgram["실행 중 프로그램/게임<br/>[표시]"]
        seatTime["잔여시간·요금<br/>[표시]"]
        seatMoveReq["좌석 이동 요청 처리<br/>[승인/거절]"]
        messenger["메신저<br/>[기능]"]
        messageSeat["좌석별 메시지 발송<br/>[기능]"]
        messageBroadcast["전체 공지 발송<br/>[기능]"]

        board --> boardState
        board --> orderDetail
        orderDetail --> cooking
        orderDetail --> soldOut
        orderDetail --> cancel
        seatBoard --> seatBoardState
        seatBoard --> seatDetail
        seatBoard --> messenger
        seatDetail --> seatProgram
        seatDetail --> seatTime
        seatDetail --> seatMoveReq
        messenger --> messageSeat
        messenger --> messageBroadcast
    end

    subgraph adminOps ["관리 (Admin)"]
        direction TB
        menuManage["메뉴 관리<br/>[탭]"]
        menuList2["상품 목록<br/>[리스트]"]
        menuState["상태: 판매중·품절·숨김"]
        menuEdit["상품 등록/수정<br/>[폼 모달]"]
        seatManage["좌석 관리<br/>[탭]"]
        seatMap["좌석 배치도<br/>[그리드]"]
        seatMapState["상태: 사용가능·사용중·점검중"]
        gameMaster["게임마스터<br/>[탭]"]
        gameList["게임 목록<br/>[리스트]"]
        gameState["상태: 설치됨·업데이트필요·제거됨"]
        feeManage["요금제 관리<br/>[탭]"]
        feeList["요금제 목록<br/>[리스트]"]
        feeState["상태: 판매중·비활성"]
        feeEdit["요금제 등록/수정<br/>[폼 모달]"]

        menuManage --> menuList2 --> menuState
        menuManage --> menuEdit
        seatManage --> seatMap --> seatMapState
        gameMaster --> gameList --> gameState
        feeManage --> feeList --> feeState
        feeManage --> feeEdit
    end

    opsRoot --> login
    opsRoot --> board
    opsRoot --> seatBoard
    opsRoot --> menuManage
    opsRoot --> seatManage
    opsRoot --> gameMaster
    opsRoot --> feeManage

    classDef rootNode fill:#DCEBF7,stroke:#1F5C8B,color:#0B2A40,font-weight:bold;
    classDef stateNode fill:#FCEFD1,stroke:#C98A1F,color:#3A2E10;
    classDef negNode fill:#FBE1DE,stroke:#C4453A,color:#5C1A14;
    classDef posNode fill:#DFF3E6,stroke:#2F9E64,color:#123821;
    classDef specialNode fill:#E9E1F7,stroke:#7C5CBF,color:#2E1F4D;

    class opsRoot rootNode;
    class boardState,seatBoardState,menuState,seatMapState,gameState,feeState stateNode;
    class soldOut,cancel negNode;
    class cooking posNode;
    class messenger,seatMoveReq specialNode;
```

---

## 참고

- 원본 참조 아티팩트: https://claude.ai/code/artifact/ec7f5477-2fd0-41f6-8c69-a7a00f7ed7e4
- GitHub은 코드 블록의 ` ```mermaid ` 펜스를 자동으로 다이어그램 렌더링한다 (README.md에서 바로 확인 가능).
- 다음 단계: 화면 단위 와이어프레임 (로드맵 4~7단계, W5~W8).
