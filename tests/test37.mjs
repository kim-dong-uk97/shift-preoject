// 대시보드 아래쪽 : 룸 현황을 없애고 남은 세 패널을 좁고 길게 나란히 둔다.
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
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);

function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*(?:,[^{]*)?\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const cols = () => q('#dashboard .dash-cols');
const panels = () => [...cols().children];
const titles = () => panels().map(p => txt(p.querySelector('.panel-title')));
const listOf = t => panels().find(p => txt(p.querySelector('.panel-title')) === t)
  .querySelectorAll('.list .row');

console.log('\n[1] 룸 현황이 사라졌다');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('룸 패널 없음', !qa('.panel-title').some(t => txt(t) === '룸 현황'),
  qa('.panel-title').map(txt).join(','));
check('룸 격자 없음', q('#room-grid') === null);
check('룸 요약 수치 없음',
  q('#room-use') === null && q('#room-free') === null && q('#room-seat-free') === null);
// 마크업만 지우고 스크립트를 남기면 getElementById 가 null 이라 터진다
check('룸 스크립트도 제거', !html.includes('ROOMS') && !html.includes('roomGrid'));
check('룸 전용 CSS 제거',
  !html.includes('.room-grid') && !html.includes('.room-summary') && !html.includes('.room-seats'));
check('룸에만 쓰던 태그 제거', !html.includes('.tag-use') && !html.includes('.tag-empty'));
check('다른 태그는 그대로', html.includes('.tag-in') && html.includes('.tag-out'));

console.log('\n[2] 남은 세 개를 한 줄에');
check('묶음 하나로 합침', cols() !== null);
check('옛 묶음 제거', !html.includes('mid-cols') && !html.includes('bottom-cols'));
check('패널 3개', panels().length === 3, panels().length + '개');
check('입·퇴장 / 매점 주문 / 점검 필요',
  titles().join(',') === '실시간 입·퇴장,매점 주문,점검 필요', titles().join(','));

const css = ruleOf('.dash-cols');
check('격자', /display: grid/.test(css), css);
check('세 칸', /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(css), css);
// 세 칸이면 한 칸이 좁아진다 = 가로가 줄고 세로가 길어진다
check('두 칸이 아님', !/repeat\(2,/.test(css), css);
// stretch 로 묶으면 한 칸을 펼 때 옆 칸 높이와 더보기 버튼까지 따라 움직인다
check('칸마다 제 높이', /align-items: start/.test(css), css);
check('높이를 서로 묶지 않음', !/align-items: stretch/.test(css), css);
check('좁아지면 두 칸', /max-width: 1180px\) \{\s*\.dash-cols \{ grid-template-columns: repeat\(2/.test(html));
check('더 좁으면 한 칸', /\.dash-cols \{ grid-template-columns: minmax\(0, 1fr\); \}/.test(html));
check('좁은 칸에 맞춰 글자 조임',
  /\.dash-cols \.row \.name \{ font-size: 12\.5px; \}/.test(html));

console.log('\n[3] 세로로 채울 내용');
check('입·퇴장 9건', listOf('실시간 입·퇴장').length === 9, listOf('실시간 입·퇴장').length + '건');
check('입·퇴장 안내도 9건',
  txt(panels()[0].querySelector('.panel-note')) === '최근 9건',
  txt(panels()[0].querySelector('.panel-note')));
check('점검 필요 4건', listOf('점검 필요').length === 4, listOf('점검 필요').length + '건');
check('점검 안내도 4건',
  txt(panels()[2].querySelector('.panel-note')) === '4건',
  txt(panels()[2].querySelector('.panel-note')));
// 진행 중인 주문(대기 4 + 조리 3)이 잘리지 않아야 한다
check('매점 주문이 안 잘림', qa('#dash-orders .row').length === 7,
  qa('#dash-orders .row').length + '건');
check('완료·취소는 제외', !qa('#dash-orders .row').some(r => /완료|취소/.test(txt(r))));

console.log('\n[4] 위쪽은 그대로');
check('KPI 4장', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
check('좌석표도 그대로', q('#seat-slot').contains(q('#seat-map')));
check('좌석 140석', qa('#seat-map .seat').length === 140);
check('대시보드 안에 세 칸', q('#dashboard').contains(cols()));

console.log('\n[5] 매점 주문은 계속 이어진다');
click(nav('매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));
click(qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '아이스크림'));
click(q('#btn-place'));
click(nav('대시보드'));
check('새 주문이 대시보드에도', txt(q('#dash-orders')).includes('아이스크림'),
  txt(q('#dash-orders')));
check('건수 표기 동기화', txt(q('#dash-order-note')) === txt(q('#order-note')),
  txt(q('#dash-order-note')) + ' / ' + txt(q('#order-note')));

console.log('\n[6] 회귀');
click(nav('좌석 관리'));
check('좌석 관리 정상', q('#page-seats').style.display === 'block');
click(nav('대시보드'));
check('대시보드 복귀', q('#dashboard').style.display === 'block');
check('세 칸 유지', panels().length === 3);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
