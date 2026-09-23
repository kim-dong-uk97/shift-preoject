import fs from 'node:fs';
import { JSDOM } from 'jsdom';

// 저장소 안의 admin/index.html 을 읽는다 (이 파일 기준 상대 경로)
const ADMIN = new URL('../admin/index.html', import.meta.url);
const html = fs.readFileSync(ADMIN, 'utf8');
const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
dom.virtualConsole.on('jsdomError', e => errors.push(e.message));
const { window } = dom;
const doc = window.document;
window.confirm = () => true;

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
// CSS 규칙 본문을 원문에서 꺼내 확인한다 (jsdom 은 외부 스타일 계산이 제한적)
function rule(sel) {
  const re = new RegExp('\\n\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

console.log('\n[1] 카테고리 3개로 분류');
const cats = qa('#nav .nav-cat').map(c => c.textContent.trim());
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('카테고리 4개', cats.length === 4, cats.join(' / '));
check('현황 / 영업 / 경영 / 빠른 제어',
  cats.join(',') === '현황,영업,경영,빠른 제어', cats.join(','));

// nav 자식 순서대로 카테고리별 메뉴를 모은다
const grouped = {};
let cur = null;
[...q('#nav').children].forEach(el => {
  if (el.classList.contains('nav-cat')) { cur = el.textContent.trim(); grouped[cur] = []; }
  else if (el.classList.contains('nav-group')) {
    grouped[cur].push(el.querySelector('.nav-item').dataset.title);
  }
});
check('현황 = 대시보드, 좌석 관리',
  grouped['현황'].join(',') === '대시보드,좌석 관리', grouped['현황'].join(','));
check('영업 = 요금, 회원, 매점',
  grouped['영업'].join(',') === '요금 관리,회원 관리,매점 관리', grouped['영업'].join(','));
check('경영 = 매출·정산, 직원, 매장',
  grouped['경영'].join(',') === '매출·정산 관리,직원관리,매장관리', grouped['경영'].join(','));
check('메뉴 총 8개', qa('#nav .nav-item').length === 8, qa('#nav .nav-item').length + '개');
check('메뉴가 빠짐없이 분류됨',
  Object.values(grouped).reduce((a, b) => a + b.length, 0) === 8);
check('첫 카테고리가 nav 맨 위', q('#nav').firstElementChild.classList.contains('nav-cat'));

console.log('\n[1-2] 빠른 제어 : 상단 바에서 사이드바로');
check('상단 바에 빠른 제어 없음', q('.topbar .quick-actions') === null);
check('.quick-actions CSS 제거', !html.includes('.quick-actions {'));
check('사이드바에 빠른 제어', q('#nav #quick-actions') !== null);
check('명령 4개', qa('#quick-actions .nav-action').length === 4,
  qa('#quick-actions .nav-action').length + '개');
check('전체 소등/재부팅/OFF/ON',
  qa('#quick-actions .nav-action').map(b => b.dataset.action).join(',') === 'lights,reboot,off,on',
  qa('#quick-actions .nav-action').map(b => b.dataset.action).join(','));
check('페이지 이동 메뉴와 분리', qa('#quick-actions .nav-item').length === 0);
check('메뉴는 여전히 8개', qa('#nav .nav-item').length === 8);
check('전원 OFF 는 위험 표시', qa('#quick-actions .nav-action')[2].classList.contains('danger'));
check('빠른 제어가 메뉴 맨 아래', q('#nav').lastElementChild.id === 'quick-actions');

// 실제로 명령이 나가는지 (확인창 자동 승인 상태)
const toast0 = q('#toast-wrap').textContent;
click(qa('#quick-actions .nav-action')[0]);
check('소등 명령 동작', q('#toast-wrap').textContent !== toast0 &&
  q('#toast-wrap').textContent.includes('소등'), q('#toast-wrap').textContent);
check('명령을 눌러도 페이지 이동 없음', q('#dashboard').style.display !== 'none');

console.log('\n[2] 호버 : 배경 없이 글자·아이콘만 파란색');
const navHover = rule('.nav-item:hover');
check('.nav-item:hover 규칙 존재', navHover !== null);
check('배경 지정 없음', navHover && !navHover.includes('background'), navHover);
check('포인트 컬러 적용', navHover && navHover.includes('color: var(--point)'), navHover);
check('아이콘은 currentColor 상속',
  qa('#nav .nav-item > svg').every(sv => sv.getAttribute('stroke') === 'currentColor'));

const subHover = rule('.sub-item:hover');
check('.sub-item:hover 규칙 존재', subHover !== null);
check('하위 메뉴도 배경 없음', subHover && !subHover.includes('background'), subHover);
check('하위 메뉴도 포인트 컬러', subHover && subHover.includes('color: var(--point)'), subHover);
// 점 -> 레일 위 막대로 바뀌었다. 호버는 옅은 파랑, 선택은 진한 파랑으로 단계를 준다
check('하위 메뉴 표시 막대도 같이 물듦',
  rule('.sub-item:hover::before') && rule('.sub-item:hover::before').includes('var(--point-line)'),
  rule('.sub-item:hover::before'));
check('선택은 더 진하게',
  rule('.sub-item.active::before') && rule('.sub-item.active::before').includes('var(--point)'),
  rule('.sub-item.active::before'));

console.log('\n[3] 선택 상태 : 연한 파란 배경 + 왼쪽 막대');
// 쉼표로 묶인 선택자까지 잡는다
function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*(?:,[^{]*)?\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}
const active = ruleOf('.nav-item.active');
check('연한 파란 배경', active && active.includes('background: var(--point-soft)'), active);
check('글자·아이콘 포인트 컬러', active && active.includes('color: var(--point)'), active);
check('글자 굵기 강조', active && active.includes('font-weight: 700'), active);
check('호버해도 선택 색 유지', /\.nav-item\.active,\s*\.nav-item\.active:hover/.test(html));

const bar = ruleOf('.nav-item.active::before');
check('왼쪽 막대 존재', bar !== null);
check('막대가 왼쪽 바깥', bar && bar.includes('left: -7px'), bar);
check('막대 색 = 포인트', bar && bar.includes('background: var(--point)'), bar);
check('막대 배치 기준(.nav-item relative)',
  ruleOf('.nav-item') && ruleOf('.nav-item').includes('position: relative'));

const subActive = ruleOf('.sub-item.active');
check('하위 선택도 연한 배경', subActive && subActive.includes('var(--point-soft)'), subActive);
check('하위 선택 글자 포인트 컬러', subActive && subActive.includes('color: var(--point)'), subActive);
check('하위 선택 점은 채워진 파랑',
  ruleOf('.sub-item.active::before') && ruleOf('.sub-item.active::before').includes('background: var(--point)'));
check('흰 글자 선택 스타일 제거', !/\.(nav|sub)-item\.active[^{]*\{[^}]*color: #fff/.test(html));

console.log('\n[4] 아코디언 펼침 표시');
const open = rule('.nav-item.open');
check('펼침도 배경 대신 색', open && !open.includes('background') && open.includes('var(--point)'), open);

console.log('\n[5] 좁은 화면에서는 머리글이 구분선으로');
// 720px 블록이 여러 개(타일용 / 사이드바용)라 전부 모아서 확인한다
const narrowBlocks = [...html.matchAll(/@media \(max-width: 720px\) \{([\s\S]*?)\n  \}\n/g)].map(m => m[1]);
const navNarrow = narrowBlocks.find(b => b.includes('.nav-cat'));
check('반응형 블록에 .nav-cat 규칙', !!navNarrow, narrowBlocks.length + '개 블록 확인');
check('구분선으로 바뀜', !!navNarrow && /\.nav-cat \{[^}]*height: 1px/s.test(navNarrow));
check('좁은 화면에선 테두리 중복 없음', !!navNarrow && /\.nav-cat \{[^}]*border-top: 0/s.test(navNarrow));

console.log('\n[5-2] 분야 사이 구분');
const cat = ruleOf('.nav-cat');
check('묶음 위에 가는 선', cat && cat.includes('border-top: 1px solid var(--border)'), cat);
check('위아래 여백 확보',
  cat && cat.includes('margin: 20px 0 8px') && cat.includes('padding: 16px 12px 0'), cat);
check('첫 묶음엔 선 없음',
  (ruleOf('.nav-cat:first-child') || '').includes('border-top: 0'),
  ruleOf('.nav-cat:first-child'));
check('묶음 4개', qa('#nav .nav-cat').length === 4);

console.log('\n[6] 메뉴 동작 회귀');
click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));
check('좌석 관리 이동', q('#page-seats').style.display === 'block');
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 이동', q('#page-fees').style.display === 'block');
click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));
check('회원 관리 이동', q('#page-members').style.display === 'block');

const storeNav = qa('.nav-item').find(b => b.dataset.title === '직원관리');
click(storeNav);
check('아코디언 펼침', storeNav.classList.contains('open'));
check('서브메뉴 표시', storeNav.closest('.nav-group').querySelector('.submenu').classList.contains('open'));
click(qa('.sub-item').find(b => b.dataset.title === '권한 설정'));
check('하위 메뉴 선택', q('#page-body').style.display === 'flex');
check('선택 표시 이동', qa('.sub-item').find(b => b.dataset.title === '권한 설정').classList.contains('active'));

const secureNav = qa('.nav-item').find(b => b.dataset.title === '매출·정산 관리');
click(secureNav);
check('경영 그룹 PIN 잠금 유지', q('#pin-modal').classList.contains('open'));
click(q('#pin-cancel'));

click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 복귀', q('#dashboard').style.display === 'block');
check('지표 타일 유지', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
