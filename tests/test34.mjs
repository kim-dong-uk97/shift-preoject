// 주문 관리 : 한 건씩 영수증 카드로 보이고 아래에서 취소 / 조리를 고른다.
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

let confirmAnswer = true, lastConfirm = '';
window.confirm = (m) => { lastConfirm = m; return confirmAnswer; };

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
const won2num = t => Number(String(t).replace(/[^\d]/g, ''));

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
const cards = () => qa('#order-list .ord');
const cardNo = n => qa('#order-list .ord').find(c => c.dataset.order === String(n));
const items = c => [...c.querySelectorAll('.ord-item')];
const acts = c => [...c.querySelectorAll('.ord-acts button')];

click(nav('매점 관리'));
click(sub('주문 관리'));

console.log('\n[1] 목록 대신 카드');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('주문 관리 화면', q('#page-orders').style.display === 'block');
check('한 줄짜리 목록 아님', qa('#order-list .row').length === 0);
check('카드 격자', q('#order-list').classList.contains('ord-grid'));
check('주문 9건', cards().length === 9, cards().length + '건');
check('카드마다 주문번호 보유', cards().every(c => /^\d+$/.test(c.dataset.order)));

const grid = ruleOf('.ord-grid');
check('격자로 나열', /display: grid/.test(grid), grid);
check('한 줄에 5장', /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/.test(grid), grid);
// 5장이 그대로 들어가면 좁은 화면에서 못 읽는다
check('좁아지면 장수를 줄임',
  /max-width: 1150px\) \{ \.ord-grid \{ grid-template-columns: repeat\(3/.test(html) &&
  /max-width: 620px\) \{ \.ord-grid \{ grid-template-columns: 1fr/.test(html));

console.log('\n[2] 영수증 모양');
const ord = ruleOf('.ord');
const itemsCss = ruleOf('.ord-items');
check('카드 테두리 · 둥근 모서리',
  /border: 1px solid var\(--border\)/.test(ord) && /border-radius: 12px/.test(ord), ord);
check('세로로 길게', /min-height: 244px/.test(ord), ord);
check('품목 칸이 남는 높이를 먹음', /flex: 1/.test(itemsCss), itemsCss);
check('품목 칸을 점선으로 떼어 놓음',
  /border-top: 1px dashed/.test(itemsCss) && /border-bottom: 1px dashed/.test(itemsCss), itemsCss);
check('숫자는 폭 고정', /tabular-nums/.test(ruleOf('.ord-total')));
// 조리 중 카드는 포인트 컬러(파랑)로 띄운다
check('조리 중은 파란 테두리',
  /border-color: var\(--point-line\)/.test(ruleOf('.ord.cook')), ruleOf('.ord.cook'));
check('머리도 파란 바탕', /background: var\(--point-soft\)/.test(ruleOf('.ord.cook .ord-head')),
  ruleOf('.ord.cook .ord-head'));
// 색은 토큰으로만 — 직접 쓴 값이 섞이면 톤이 어긋난다
check('직접 쓴 색값 없음',
  !/#[0-9a-f]{6}/i.test(ruleOf('.ord.cook')) && !/#[0-9a-f]{6}/i.test(ruleOf('.ord.cook .ord-head')));
check('끝난 건은 뒤로 물림', /opacity: 0\.6/.test(ruleOf('.ord.done')), ruleOf('.ord.done'));

console.log('\n[3] 카드 한 장에 담기는 것');
const c41 = cardNo(1041);
check('#1041 있음', c41 !== undefined);
check('주문번호', txt(c41.querySelector('.ord-no')) === '#1041', txt(c41.querySelector('.ord-no')));
check('좌석', txt(c41.querySelector('.ord-seat')) === 'A-12', txt(c41.querySelector('.ord-seat')));
check('상태 태그', txt(c41.querySelector('.tag')) === '대기', txt(c41.querySelector('.tag')));
check('품목 2줄', items(c41).length === 2, items(c41).length + '줄');
check('품목 이름', items(c41).map(i => txt(i.querySelector('.nm'))).join(',') === '라면,공기밥',
  items(c41).map(i => txt(i.querySelector('.nm'))).join(','));
check('수량 표기', items(c41).every(i => /^×\d+$/.test(txt(i.querySelector('.qty')))),
  items(c41).map(i => txt(i.querySelector('.qty'))).join(','));
// 글자만으론 묻혀서 칩으로 띄운다
const qtyCss = ruleOf('.ord-item .qty');
check('수량은 칩', /border-radius: 999px/.test(qtyCss) && /background: var\(--accent-soft\)/.test(qtyCss),
  qtyCss);
check('한 자리여도 폭 유지', /min-width: 28px/.test(qtyCss), qtyCss);
check('가운데 정렬', /text-align: center/.test(qtyCss), qtyCss);
check('2개 이상은 색으로 한 번 더',
  /var\(--point-soft\)/.test(ruleOf('.ord-item .qty.many')), ruleOf('.ord-item .qty.many'));
check('수량 1 은 many 아님',
  items(cardNo(1041)).every(i => !i.querySelector('.qty').classList.contains('many')));
check('수량 2 는 many',
  items(cardNo(1039))[0].querySelector('.qty').classList.contains('many'));
check('줄마다 수량 칩', cards().every(c =>
  items(c).every(i => i.querySelector('.qty') !== null)));
check('줄마다 금액', items(c41).every(i => /원$/.test(txt(i.querySelector('.amt')))));
check('결제 수단 + 경과 시간',
  /SHIFT결제 · \d+분 전|SHIFT결제 · 방금/.test(txt(c41.querySelector('.ord-pay'))),
  txt(c41.querySelector('.ord-pay')));
check('합계 = 줄 금액의 합',
  won2num(txt(c41.querySelector('.ord-total'))) ===
  items(c41).reduce((n, i) => n + won2num(txt(i.querySelector('.amt'))), 0),
  txt(c41.querySelector('.ord-total')));
// 메뉴가 라면으로 바뀌었는데 주문에 옛 이름이 남아 있으면 금액이 0 이 된다
check('없는 메뉴를 가리키지 않음', cards().every(c =>
  items(c).every(i => won2num(txt(i.querySelector('.amt'))) > 0)),
  cards().map(c => txt(c.querySelector('.ord-total'))).join(' / '));
check('수량 2 인 줄은 단가의 2배', (() => {
  const c = cardNo(1039);
  const i = items(c)[0];
  return txt(i.querySelector('.qty')) === '×2' &&
    won2num(txt(i.querySelector('.amt'))) === won2num(txt(c.querySelector('.ord-total')));
})(), txt(cardNo(1039)));

console.log('\n[4] 아래쪽 작업 줄');
check('대기 = 취소 / 조리 시작',
  acts(cardNo(1041)).map(b => txt(b)).join(',') === '취소,조리 시작',
  acts(cardNo(1041)).map(b => txt(b)).join(','));
check('조리 = 취소 / 조리 완료',
  acts(cardNo(1038)).map(b => txt(b)).join(',') === '취소,조리 완료',
  acts(cardNo(1038)).map(b => txt(b)).join(','));
const actsCss = ruleOf('.ord-acts');
check('카드 아래에 붙음', /border-top: 1px solid var\(--border\)/.test(actsCss), actsCss);
check('폭을 반씩 나눠 가짐', /display: flex/.test(actsCss) &&
  /flex: 1/.test(ruleOf('.ord-acts button')), actsCss);
check('버튼 사이 구분선', /border-left/.test(ruleOf('.ord-acts button + button')));
check('진행 버튼은 파랑', /color: var\(--point\)/.test(ruleOf('.ord-acts .go')));
check('취소는 눌렀을 때만 빨강', /var\(--danger\)/.test(ruleOf('.ord-acts .cancel:hover')));

console.log('\n[5] 조리 시작 → 완료');
const noteBefore = txt(q('#order-note'));
click(cardNo(1041).querySelector('[data-next]'));
check('조리로 전환', cardNo(1041).classList.contains('cook'));
check('태그도 조리', txt(cardNo(1041).querySelector('.tag')) === '조리');
check('버튼이 조리 완료로', txt(cardNo(1041).querySelector('[data-next]')) === '조리 완료');
check('건수 갱신', txt(q('#order-note')) !== noteBefore,
  noteBefore + ' -> ' + txt(q('#order-note')));
click(cardNo(1041).querySelector('[data-next]'));
check('완료', cardNo(1041).classList.contains('done'));
check('완료엔 버튼 없음', acts(cardNo(1041)).length === 0);
check('대신 안내 문구', txt(cardNo(1041).querySelector('.ord-msg')) === '완료된 주문');

console.log('\n[6] 취소 — 재고를 되돌린다');
click(nav('매점 관리'));
click(sub('재고 관리'));
const stockOf = name => {
  const row = qa('#stock-list .stock-row')
    .find(r => txt(r.querySelector('.stock-name')) === name);
  return row ? won2num(txt(row.querySelector('.stock-qty .now'))) : null;
};
const colaBefore = stockOf('콜라');
check('콜라 재고 읽힘', colaBefore !== null && colaBefore > 0, String(colaBefore));

click(sub('주문 관리'));
confirmAnswer = false;
click(cardNo(1039).querySelector('[data-cancel]'));
check('확인창에서 아니오 = 그대로', cardNo(1039).classList.contains('wait'));

confirmAnswer = true;
click(cardNo(1039).querySelector('[data-cancel]'));
check('확인 문구', lastConfirm.includes('#1039') && lastConfirm.includes('재고'), lastConfirm);
check('취소 상태', cardNo(1039).classList.contains('cancel'));
check('태그 취소', txt(cardNo(1039).querySelector('.tag')) === '취소');
check('취소엔 버튼 없음', acts(cardNo(1039)).length === 0);
check('안내 문구', txt(cardNo(1039).querySelector('.ord-msg')) === '취소된 주문');

click(sub('재고 관리'));
check('콜라 2개가 재고로 복구', stockOf('콜라') === colaBefore + 2,
  colaBefore + ' -> ' + stockOf('콜라'));

console.log('\n[7] 대시보드는 한 줄 요약 그대로');
click(nav('대시보드'));
check('대시보드는 .row 유지', qa('#dash-orders .row').length > 0);
check('대시보드엔 카드 없음', qa('#dash-orders .ord').length === 0);
check('건수 동기화', txt(q('#dash-order-note')) === txt(q('#order-note')),
  txt(q('#dash-order-note')) + ' / ' + txt(q('#order-note')));
check('완료 · 취소는 대시보드에서 빠짐',
  !qa('#dash-orders .row').some(r => /완료|취소/.test(txt(r))),
  qa('#dash-orders .row').map(txt).join(' | '));
check('대시보드에도 품목 이름', txt(q('#dash-orders')).includes('돈까스'), txt(q('#dash-orders')));

console.log('\n[8] 새 주문도 카드로');
click(nav('매점 관리'));
click(sub('상품 관리'));
// 와플은 판매 중지(on: false) 라 담기지 않는다
click(qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '아이스크림'));
check('주문서에 담김', qa('#order-items .order-line').length === 1,
  String(qa('#order-items .order-line').length));
click(q('#btn-place'));
click(sub('주문 관리'));
const fresh = cards()[0];
check('맨 앞에 새 주문', Number(fresh.dataset.order) >= 1042, fresh.dataset.order);
check('품목 표시', txt(fresh.querySelector('.nm')) === '아이스크림', txt(fresh.querySelector('.nm')));
check('금액 0 아님', won2num(txt(fresh.querySelector('.ord-total'))) > 0);
check('방금 들어온 주문', txt(fresh.querySelector('.ord-pay')).includes('방금'),
  txt(fresh.querySelector('.ord-pay')));
check('대기 + 두 버튼', acts(fresh).map(b => txt(b)).join(',') === '취소,조리 시작');

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
