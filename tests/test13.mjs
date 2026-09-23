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
const submit = el => el.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const toastText = () => q('#toast-wrap').textContent;
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
function setField(k, v) {
  const el = q('[data-key="' + k + '"]');
  if (el.type === 'checkbox') el.checked = v; else el.value = String(v);
}
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);
const lines = () => qa('#order-items .order-line');
const lineOf = n => lines().find(l => txt(l.querySelector('.nm')) === n);
const lineQty = n => txt(lineOf(n).querySelector('.step-qty'));
const cardQty = n => {
  const b = cardOf(n).querySelector('.menu-qty');
  return b ? txt(b) : null;
};

// 재고는 상품 수정 폼에서 다루므로 폼을 열어 값을 읽는다
function stockOf(name) {
  click(cardOf(name).querySelector("[data-edit]"));
  unlock();
  const v = Number(q('[data-key="stock"]').value);
  click(q("#form-cancel"));
  return v;
}
click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));

console.log('\n[1] 카드에서 수량 조절 제거');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('카드에 스테퍼 없음', qa('#menu-grid .stepper').length === 0);
check('모든 카드가 클릭 대상', cards().every(c => c.hasAttribute('data-pick')));
check('pick 클래스 부여', cards().every(c => c.classList.contains('pick')));

console.log('\n[2] 강조 배지 (BEST / NEW)');
const ramen = cardOf('라면');
check('라면 BEST', txt(ramen.querySelector('.promo')) === 'BEST');
check('김치볶음밥 NEW', txt(cardOf('김치볶음밥').querySelector('.promo')) === 'NEW');
check('평점 · 조리시간 배지 제거', qa('#menu-grid .menu-tag').length === 0);
check('배지가 썸네일 아래 이름 위',
  ramen.querySelector('.menu-thumb').compareDocumentPosition(ramen.querySelector('.menu-tags')) & 4 &&
  ramen.querySelector('.menu-tags').compareDocumentPosition(ramen.querySelector('.prod-name')) & 4);

console.log('\n[3] 카드 클릭으로 담기');
check('처음엔 빈 주문서', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
check('담기 전 수량 배지 없음', cardQty('라면') === null);
click(cardOf('라면'));
check('주문서에 추가', lines().length === 1 && lineOf('라면'));
check('썸네일에 수량 배지 1', cardQty('라면') === '1');
click(cardOf('라면'));
click(cardOf('라면'));
check('누를 때마다 1씩', cardQty('라면') === '3');
check('주문서 수량 동기화', lineQty('라면') === '3');
check('줄은 하나만', lines().length === 1);
click(cardOf('콜라'));
check('다른 메뉴는 새 줄', lines().length === 2);

console.log('\n[4] 주문서에서 수량 조절');
check('줄마다 스테퍼', lines().every(l => l.querySelector('.step-btn.minus') && l.querySelector('.step-btn.plus')));
check('줄에 조리시간 표기', txt(lineOf('라면')).includes('5분'), txt(lineOf('라면')));
click(lineOf('라면').querySelector('.step-btn.plus'));
check('+ 로 증가', lineQty('라면') === '4');
check('카드 배지도 갱신', cardQty('라면') === '4');
check('줄 금액 갱신', txt(lineOf('라면')).includes('12,000원'), txt(lineOf('라면')));
click(lineOf('라면').querySelector('.step-btn.minus'));
click(lineOf('라면').querySelector('.step-btn.minus'));
check('− 로 감소', lineQty('라면') === '2');
check('합계 재계산', txt(q('#order-sum')).includes('7,500원'), txt(q('#order-sum')));

click(lineOf('콜라').querySelector('.step-btn.minus'));
check('0이 되면 줄 삭제', lineOf('콜라') === undefined);
check('카드 배지도 사라짐', cardQty('콜라') === null);

console.log('\n[5] 재고 한도');
const rice = cardOf('공기밥');
check('공기밥 재고 60', stockOf('공기밥') === 60, String(stockOf('공기밥')));
for (let i = 0; i < 60; i++) click(cardOf('공기밥'));
check('재고만큼 담김', cardQty('공기밥') === '60');
check('주문서 + 비활성', lineOf('공기밥').querySelector('.step-btn.plus').disabled === true);
click(cardOf('공기밥'));
check('카드 더 눌러도 그대로', cardQty('공기밥') === '60');
check('한도 안내 토스트', toastText().includes('재고를 모두 담았습니다'), toastText());
click(lineOf('공기밥').querySelector('[data-rm]'));
check('× 로 줄 삭제', lineOf('공기밥') === undefined);

console.log('\n[6] 품절 · 판매 중지');
click(cardOf('에너지드링크'));
check('품절은 안 담김', lineOf('에너지드링크') === undefined);
check('재고 없음 안내', toastText().includes('재고가 없습니다'), toastText());
click(cardOf('와플'));
check('판매 중지도 안 담김', lineOf('와플') === undefined);
check('판매 중지 안내', toastText().includes('판매 중지'), toastText());

console.log('\n[7] 주문 넣기 흐름 유지');
const before = qa('#order-list .ord').length;
click(q('#btn-place'));
check('주문 접수', qa('#order-list .ord').length === before + 1);
check('주문서 비워짐', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
check('카드 배지 초기화', cardQty('라면') === null);
check('재고 차감(42 -> 40)', stockOf('라면') === 40, String(stockOf('라면')));

console.log('\n[8] 메뉴 편집 : 조리 시간');
check('편집 중에도 담기 가능', cards().every(c => c.hasAttribute('data-pick')));
click(cardOf('라면').querySelector('[data-edit]'));
unlock();
check('조리 시간 입력 존재', q('[data-key="cook"]') !== null);
check('기존 조리 시간 로드', q('[data-key="cook"]').value === '5', q('[data-key="cook"]').value);
check('평점 입력은 없음', q('[data-key="rate"]') === null);
setField('cook', -1);
submit(q('#form-modal-form'));
check('음수 조리시간 차단', q('#form-error').classList.contains('show'), q('#form-error').textContent);
setField('cook', 9);
submit(q('#form-modal-form'));
click(cardOf('라면'));
check('조리 시간 반영(주문서 표기)', txt(q('#order-items .order-line')).includes('9분'),
  txt(q('#order-items .order-line')));
click(q('#order-items .order-line [data-rm]'));

click(q('#menu-grid .prod-add'));
setField('name', '만두');
setField('cat', 'fry');
setField('price', 4500);
setField('stock', 20);
setField('cook', 6);
submit(q('#form-modal-form'));
check('새 메뉴 추가', cardOf('만두') !== undefined);
check('새 메뉴는 강조 배지 없음', cardOf('만두').querySelector('.promo') === null);
click(cardOf('만두'));
check('새 메뉴도 담기 동작', lineOf('만두') !== undefined);

console.log('\n[9] 회귀');
check('결제 수단 유지', qa('#pay-methods .pay-btn').length === 5);
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('대시보드 주문 연동', qa('#dash-orders .row').length > 0);
click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
