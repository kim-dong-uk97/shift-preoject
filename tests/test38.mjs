// 대시보드 세 칸 : 6줄까지만 보이고 넘치면 '더보기' 로 편다.
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
const sub = t => qa('.sub-item').find(b => b.dataset.title === t);
const panels = () => [...q('#dashboard .dash-cols').children];
const panelOf = t => panels().find(p => txt(p.querySelector('.panel-title')) === t);
const rowsOf = t => [...panelOf(t).querySelectorAll('.list > .row')];
const shownOf = t => rowsOf(t).filter(r => r.style.display !== 'none');
const btnOf = t => panelOf(t).querySelector('.more-btn');
const CAP = 6;

console.log('\n[1] 세 칸 모두 더보기를 가진다');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('패널 3개', panels().length === 3);
check('칸마다 버튼 하나', panels().every(p => p.querySelectorAll('.more-btn').length === 1));
check('버튼은 목록 다음', panels().every(p => {
  const kids = [...p.children];
  return kids.indexOf(p.querySelector('.more-btn')) === kids.indexOf(p.querySelector('.list')) + 1;
}));
const btnCss = ruleOf('.more-btn');
// 옆 칸을 펼쳐도 이 버튼이 따라 내려가면 안 된다
check('자기 목록 바로 밑', /margin-top: 12px/.test(btnCss), btnCss);
check('남는 높이를 먹지 않음', !/margin-top: auto/.test(btnCss), btnCss);
check('칸 높이를 서로 묶지 않음',
  /align-items: start/.test(ruleOf('.dash-cols')), ruleOf('.dash-cols'));

console.log('\n[2] 6줄까지만 보인다');
check('입·퇴장은 9건이 들어 있음', rowsOf('실시간 입·퇴장').length === 9,
  rowsOf('실시간 입·퇴장').length + '건');
check('그중 6줄만 보임', shownOf('실시간 입·퇴장').length === CAP,
  shownOf('실시간 입·퇴장').length + '줄');
check('나머지는 숨김', rowsOf('실시간 입·퇴장').slice(CAP).every(r => r.style.display === 'none'));
check('앞에서부터 보여 줌',
  txt(shownOf('실시간 입·퇴장')[0]).includes('김민준'), txt(shownOf('실시간 입·퇴장')[0]));
check('버튼에 남은 건수', txt(btnOf('실시간 입·퇴장')) === '더보기 3건',
  txt(btnOf('실시간 입·퇴장')));
check('aria-expanded=false', btnOf('실시간 입·퇴장').getAttribute('aria-expanded') === 'false');

console.log('\n[3] 넘치지 않으면 버튼을 숨긴다');
check('점검 필요 4건', rowsOf('점검 필요').length === 4);
check('전부 보임', shownOf('점검 필요').length === 4);
check('버튼 숨김', btnOf('점검 필요').style.display === 'none',
  btnOf('점검 필요').style.display);

console.log('\n[4] 눌러서 펴고 접는다');
click(btnOf('실시간 입·퇴장'));
check('전부 보임', shownOf('실시간 입·퇴장').length === 9,
  shownOf('실시간 입·퇴장').length + '줄');
check('버튼이 접기로', txt(btnOf('실시간 입·퇴장')) === '접기', txt(btnOf('실시간 입·퇴장')));
check('aria-expanded=true', btnOf('실시간 입·퇴장').getAttribute('aria-expanded') === 'true');
check('펼침 표시 클래스', panelOf('실시간 입·퇴장').classList.contains('expanded'));
check('마지막 줄도 보임',
  txt(shownOf('실시간 입·퇴장')[8]).includes('F-13'), txt(shownOf('실시간 입·퇴장')[8]));
// 한 칸을 펼쳐도 다른 칸은 줄 수도, 버튼 글자도 그대로여야 한다
check('다른 칸 줄 수 그대로', shownOf('매점 주문').length === CAP,
  shownOf('매점 주문').length + '줄');
check('다른 칸 버튼 그대로', txt(btnOf('매점 주문')) === '더보기 1건', txt(btnOf('매점 주문')));
check('다른 칸은 접힌 상태', !panelOf('매점 주문').classList.contains('expanded'));
check('점검 필요도 그대로', shownOf('점검 필요').length === 4);

click(btnOf('실시간 입·퇴장'));
check('다시 6줄', shownOf('실시간 입·퇴장').length === CAP);
check('버튼도 원래대로', txt(btnOf('실시간 입·퇴장')) === '더보기 3건');
check('클래스 해제', !panelOf('실시간 입·퇴장').classList.contains('expanded'));

console.log('\n[5] 매점 주문 — 다시 그려도 유지된다');
// 대시보드는 진행 중인 주문을 자르지 않고 다 넘기고, 자르는 건 더보기가 맡는다
check('진행 중 7건 전부 들어 있음', rowsOf('매점 주문').length === 7,
  rowsOf('매점 주문').length + '건');
check('6줄만 보임', shownOf('매점 주문').length === CAP);
check('남은 1건', txt(btnOf('매점 주문')) === '더보기 1건', txt(btnOf('매점 주문')));

click(btnOf('매점 주문'));
check('펼침', shownOf('매점 주문').length === 7);
check('이번엔 입·퇴장이 그대로', shownOf('실시간 입·퇴장').length === CAP,
  shownOf('실시간 입·퇴장').length + '줄');
check('둘을 따로 펼쳐 둘 수 있음', (() => {
  click(btnOf('실시간 입·퇴장'));
  const both = shownOf('실시간 입·퇴장').length === 9 && shownOf('매점 주문').length === 7;
  click(btnOf('실시간 입·퇴장'));
  return both;
})());
check('한쪽만 접어도 다른 쪽은 유지', shownOf('매점 주문').length === 7 &&
  shownOf('실시간 입·퇴장').length === CAP);

// 주문을 하나 더 넣으면 목록이 다시 그려진다
click(nav('매점 관리'));
click(sub('상품 관리'));
click(qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '아이스크림'));
click(q('#btn-place'));
click(nav('대시보드'));
check('새 주문 반영', rowsOf('매점 주문').length === 8, rowsOf('매점 주문').length + '건');
check('다시 그려도 펼침 유지', shownOf('매점 주문').length === 8,
  shownOf('매점 주문').length + '줄');
check('버튼도 접기 그대로', txt(btnOf('매점 주문')) === '접기', txt(btnOf('매점 주문')));

click(btnOf('매점 주문'));
check('접으면 6줄', shownOf('매점 주문').length === CAP);
check('남은 2건으로 갱신', txt(btnOf('매점 주문')) === '더보기 2건', txt(btnOf('매점 주문')));

console.log('\n[6] 건수가 줄면 버튼이 사라진다');
// 주문을 완료 처리해 진행 중 건수를 6 밑으로 내린다
click(nav('매점 관리'));
click(sub('주문 관리'));
// 카드는 누를 때마다 다시 그려지므로 매번 현재 DOM 에서 다시 찾는다
const liveCards = () => qa('#order-list .ord')
  .filter(x => x.classList.contains('wait') || x.classList.contains('cook'));
for (let i = 0; i < 20 && liveCards().length > CAP; i++) {
  click(liveCards()[0].querySelector('[data-next]'));
}
check('진행 중을 6건까지 내림', liveCards().length === CAP, liveCards().length + '건');
click(nav('대시보드'));
check('진행 중 6건 이하', rowsOf('매점 주문').length <= CAP, rowsOf('매점 주문').length + '건');
check('버튼 숨김', btnOf('매점 주문').style.display === 'none', btnOf('매점 주문').style.display);
check('남은 줄은 다 보임', shownOf('매점 주문').length === rowsOf('매점 주문').length);

console.log('\n[7] 회귀');
check('KPI 4장', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
check('좌석표 그대로', qa('#seat-map .seat').length === 140);
check('건수 표기 동기화', txt(q('#dash-order-note')) === txt(q('#order-note')),
  txt(q('#dash-order-note')) + ' / ' + txt(q('#order-note')));

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
