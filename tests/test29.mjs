// 서브메뉴 항목 앞 표시(작은 네모)가 잘리지 않고 제 모양인지 CSS 값으로 확인한다.
// 이전 두 시안(연결선 + 동그란 점 → 세로 레일 + 막대)은 모두 .submenu 바깥이나
// 경계에 걸쳐 그려져서, 높이 애니메이션용 overflow: hidden 과 부딪혔다.
// 지금은 표시가 글 흐름(flex 항목) 안에 있어 구조적으로 잘릴 수 없다.
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

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*(?:,[^{]*)?\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}
// 0 은 단위 없이 쓰는 게 보통이라 px 를 붙이지 않은 값도 받아 준다
const px = (rule, prop) => {
  const m = (rule || '').match(new RegExp('(?:^|[;{ ])' + prop + ':\\s*(-?[\\d.]+)(px|)(?=[;\\s}])'));
  return m ? parseFloat(m[1]) : null;
};

console.log('\n[1] 값 읽기');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const submenu = ruleOf('.submenu');
const item = ruleOf('.sub-item');
const mark = ruleOf('.sub-item::before');
check('.submenu 규칙', submenu !== null);
check('.sub-item 규칙', item !== null);
check('표시 규칙', mark !== null);

console.log('\n[2] 잘릴 수가 없다');
check('.submenu 는 넘침을 가림', /overflow: hidden/.test(submenu), submenu);
// 예전 시안이 잘렸던 이유 : 표시를 absolute + 음수 left 로 밖에 내보냈다
check('표시를 바깥으로 빼지 않음', !/position: absolute/.test(mark), mark);
check('음수 위치 없음', !/left: -/.test(mark) && !/margin-left: -/.test(mark), mark);
check('항목 안에 자리를 차지', /flex: 0 0 6px/.test(mark), mark);
check('항목이 가로로 늘어놓는 상자', /display: flex/.test(item), item);
check('표시와 글자 세로 가운데', /align-items: center/.test(item), item);
check('표시와 글자 사이 간격', px(item, 'gap') === 11, 'gap ' + px(item, 'gap'));

console.log('\n[3] 네모 모양');
check('가로세로 같은 네모', px(mark, 'width') === 6 && px(mark, 'height') === 6,
  px(mark, 'width') + ' x ' + px(mark, 'height'));
check('모서리만 살짝 둥글게', px(mark, 'border-radius') === 2, mark);
check('동그라미 아님', !/border-radius: 50%/.test(mark), mark);
check('속이 찬 네모', /background: #d7dae0/.test(mark), mark);
check('테두리 없음', !/border:/.test(mark), mark);
check('색 변화는 부드럽게', /transition: background/.test(mark), mark);

console.log('\n[4] 세로 레일은 더 쓰지 않는다');
check('레일 규칙 제거', ruleOf('.submenu::before') === null, ruleOf('.submenu::before'));
check('레일 자리로 두던 안쪽 여백도 제거', !/padding-left/.test(submenu), submenu);
// #d1d5db 는 좌석 '점검 중' 색으로 아직 쓰인다. 서브메뉴 쪽에만 없으면 된다
const subCss = html.slice(html.indexOf('.submenu {'), html.indexOf('/* ---------- Sidebar bottom'));
check('서브메뉴 CSS 에 연결선 흔적 없음',
  !subCss.includes('#d1d5db') && !/레일|연결선/.test(subCss), subCss.slice(0, 80));

console.log('\n[5] 들여쓰기');
// 상위 메뉴보다 안쪽으로 들어가야 하위로 읽힌다
check('묶음 자체가 들여써짐', /margin: 0 0 0 22px/.test(submenu), submenu);
check('펼쳤을 때도 같은 들여쓰기', /margin: 2px 0 6px 22px/.test(ruleOf('.submenu.open')));
check('항목 안쪽 여백 유지', /padding: 8px 10px/.test(item), item);

console.log('\n[6] 실제 화면에서');
const staff = qa('.nav-item').find(b => b.dataset.title === '직원관리');
click(staff);
const panel = staff.closest('.nav-group').querySelector('.submenu');
check('서브메뉴 펼쳐짐', panel.classList.contains('open'));
check('하위 항목 2개', panel.querySelectorAll('.sub-item').length === 2);

const store = qa('.nav-item').find(b => b.dataset.title === '매점 관리');
click(store);
const sPanel = store.closest('.nav-group').querySelector('.submenu');
check('매점 하위 3개', sPanel.querySelectorAll('.sub-item').length === 3);
check('모든 서브메뉴가 같은 규칙 사용',
  qa('.submenu').every(p => p.querySelectorAll('.sub-item').length > 0));
check('표시는 CSS 로만 — 마크업에 여분 요소 없음',
  qa('.sub-item').every(b => b.children.length === 0),
  qa('.sub-item').map(b => b.children.length).join(','));

console.log('\n[7] 평소 · 호버 · 선택 3단계');
click(qa('.sub-item').find(b => b.dataset.title === '재고 관리'));
const active = qa('.sub-item').find(b => b.dataset.title === '재고 관리');
check('선택 표시', active.classList.contains('active'));
check('평소엔 회색', /background: #d7dae0/.test(mark), mark);
check('호버는 옅은 파랑',
  /background: var\(--point-line\)/.test(ruleOf('.sub-item:hover::before')),
  ruleOf('.sub-item:hover::before'));
check('선택은 진한 파랑',
  /background: var\(--point\)/.test(ruleOf('.sub-item.active::before')),
  ruleOf('.sub-item.active::before'));
check('선택 항목은 알약 배경도',
  /var\(--point-soft\)/.test(ruleOf('.sub-item.active')), ruleOf('.sub-item.active'));
check('호버하면 글자도 파랑',
  /color: var\(--point\)/.test(ruleOf('.sub-item:hover')), ruleOf('.sub-item:hover'));

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
