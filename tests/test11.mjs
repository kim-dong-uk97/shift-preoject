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
const submit = el => el.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
const fire = (el, t) => el.dispatchEvent(new window.Event(t, { bubbles: true }));
const toastText = () => q('#toast-wrap').textContent;

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
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();
// 담기는 카드 클릭, 수량 조절은 오른쪽 주문서에서 한다
const lines = () => qa('#order-items .order-line');
const lineOf = n => lines().find(l => txt(l.querySelector('.nm')) === n);
const add = n => click(cardOf(n));
const minusOf = n => lineOf(n).querySelector('.step-btn.minus');
const qtyOf = n => {
  const b = cardOf(n).querySelector('.menu-qty');
  return b ? txt(b) : '0';
};
const sumText = () => txt(q('#order-sum'));

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

console.log('\n[1] 메뉴 · 페이지');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const storeNav = qa('.nav-item').find(b => b.dataset.title === '매점 관리');
check('메뉴 관리/재고 체크/주문확인 sub-item 없음',
  qa('.sub-item').filter(b => ['메뉴 관리', '재고 체크', '주문확인'].includes(b.dataset.title)).length === 0);
check('하위 3개',
  [...storeNav.closest('.nav-group').querySelectorAll('.sub-item')].map(b => b.dataset.title)
    .join(',') === '상품 관리,주문 관리,재고 관리');
check('매점 페이지 표시', q('#page-store').style.display === 'block');
check('준비중 카드 숨김', q('#page-body').style.display === 'none');
check('부제', q('#page-desc').textContent === '매점 상품 · 주문 담기');
check('좌우 2단 레이아웃', q('#page-store .store-layout') !== null);

console.log('\n[2] 검색 · 카테고리 칩');
check('검색창', q('#store-search') !== null);
check('카테고리 칩 6개', qa('#store-cats .chip-btn').length === 6);
check('첫 칩이 전체', qa('#store-cats .chip-btn')[0].textContent.trim() === '전체');
check('전체가 기본 선택', qa('#store-cats .chip-btn')[0].classList.contains('on'));
check('전체 메뉴 14개', cards().length === 14, cards().length + '개');

click(qa('#store-cats .chip-btn').find(b => b.textContent.trim() === '음료'));
check('음료만 표시', cards().length === 3, cards().length + '개');
check('칩 선택 전환', qa('#store-cats .chip-btn').find(b => b.textContent.trim() === '음료').classList.contains('on'));
click(qa('#store-cats .chip-btn')[0]);
q('#store-search').value = '라면';
fire(q('#store-search'), 'input');
check('이름 검색', cards().length === 2 && cards().every(c => txt(c).includes('라면')), cards().length + '개');
q('#store-search').value = '';
fire(q('#store-search'), 'input');
check('검색 해제', cards().length === 14);

console.log('\n[3] 카드 내용 (원화)');
const ramen = cardOf('라면');
check('가격 원화 표기', txt(ramen).includes('3,000원'), txt(ramen));
check('주문 화면엔 남은 개수 없음', !/개 남음|재고/.test(txt(ramen)), txt(ramen));
check('썸네일 존재(사진 또는 아이콘)', ramen.querySelector('.menu-thumb img, .menu-thumb svg') !== null);
check('BEST 강조 배지', ramen.querySelector('.promo-best') !== null);

const soldOut = cardOf('에너지드링크');
check('품절 배지', txt(soldOut).includes('품절'), txt(soldOut));
check('품절 카드 흐리게', soldOut.classList.contains('off'));
check('판매 중지 배지', txt(cardOf('와플')).includes('판매 중지'));

console.log('\n[4] 주문서에 담기');
check('처음엔 빈 주문서', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
check('주문 넣기 비활성', q('#btn-place').disabled === true);

add('라면');
check('수량 1', qtyOf('라면') === '1');
check('주문서 1줄', lines().length === 1);
check('주문서에 메뉴명', txt(lines()[0]).includes('라면'));

add('라면');
add('콜라');
check('수량 2', qtyOf('라면') === '2');
check('주문서 2줄', lines().length === 2);
check('줄 금액 = 단가×수량', txt(lineOf('라면')).includes('6,000원'), txt(lineOf('라면')));
check('주문 수량 합계 3개', sumText().includes('3개'), sumText());
check('소계 7,500원', sumText().includes('7,500원'), sumText());
check('결제 금액 표시', sumText().includes('결제 금액'));
check('주문 넣기 활성', q('#btn-place').disabled === false);

click(minusOf('라면'));
check('− 로 감소', qtyOf('라면') === '1');
check('합계 재계산 4,500원', sumText().includes('4,500원'), sumText());

console.log('\n[5] 재고 한도');
const rice = cardOf('공기밥');
check('공기밥 재고 60', stockOf('공기밥') === 60, String(stockOf('공기밥')));
for (let i = 0; i < 60; i++) add('공기밥');
check('재고만큼 담김', qtyOf('공기밥') === '60');
check('주문서 + 비활성', lineOf('공기밥').querySelector('.step-btn.plus').disabled === true);
add('공기밥');
check('더 안 담김', qtyOf('공기밥') === '60');
click(lineOf('공기밥').querySelector('[data-rm]'));
check('× 로 줄 삭제', lineOf('공기밥') === undefined);
check('카드 수량 0 복귀', qtyOf('공기밥') === '0');

console.log('\n[6] 결제 수단');
// 선택하면 목록을 다시 그리므로 매번 새로 조회한다
const pays = () => qa('#pay-methods .pay-btn');
check('결제 수단 5개', pays().length === 5, pays().length + '개');
check('항상 하나만 선택', pays().filter(b => b.classList.contains('on')).length === 1);
click(pays()[0]);
check('선택 전환', pays()[0].classList.contains('on'));
check('전환 후에도 하나만', pays().filter(b => b.classList.contains('on')).length === 1);

console.log('\n[7] 주문 넣기 → 재고 차감 · 접수 목록');
const ordersBefore = qa('#order-list .ord').length;
const noBefore = q('#order-no').textContent;
click(q('#btn-place'));
check('주문서 비워짐', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
check('주문번호 증가', q('#order-no').textContent !== noBefore, noBefore + ' -> ' + q('#order-no').textContent);
check('접수 목록에 추가', qa('#order-list .ord').length === ordersBefore + 1);
check('접수 토스트(결제수단 + 원화)', /주문 #\d+ 접수 · \S+ [\d,]+원/.test(toastText()), toastText());
check('라면 재고 차감(42 -> 41)', stockOf('라면') === 41, String(stockOf('라면')));
check('콜라 재고 차감(88 -> 87)', stockOf('콜라') === 87, String(stockOf('콜라')));
check('카드 수량 초기화', qtyOf('라면') === '0');

console.log('\n[8] 접수 주문 상태 진행');
const card = () => qa('#order-list .ord')[0];
check('새 주문은 대기', card().classList.contains('wait'));
check('조리 시작 버튼', txt(card().querySelector('[data-next]')) === '조리 시작');
const noteBefore = q('#order-note').textContent;
click(card().querySelector('[data-next]'));
check('조리로 전환', card().classList.contains('cook'));
check('완료 버튼으로 바뀜', txt(card().querySelector('[data-next]')) === '조리 완료');
check('대기/조리 건수 갱신', q('#order-note').textContent !== noteBefore,
  noteBefore + ' -> ' + q('#order-note').textContent);
click(card().querySelector('[data-next]'));
check('완료 처리', card().classList.contains('done'));
check('완료엔 버튼 없음', card().querySelector('[data-next]') === null);
check('완료엔 취소도 없음', card().querySelector('[data-cancel]') === null);

console.log('\n[9] 대시보드 매점 주문 연동');
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('대시보드 주문 목록 렌더', qa('#dash-orders .row').length > 0);
check('건수 표기 동기화', q('#dash-order-note').textContent === q('#order-note').textContent,
  q('#dash-order-note').textContent + ' / ' + q('#order-note').textContent);
check('완료 주문은 대시보드에서 제외', !qa('#dash-orders .row').some(r => txt(r).includes('완료')));
check('대시보드도 원화 표기', txt(q('#dash-orders')).includes('원'));

console.log('\n[10] 메뉴 편집 (점장 PIN)');
// 앞의 재고 확인에서 PIN 이 이미 풀렸으므로 다시 잠그고 검사한다
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
click(q('.btn-lock-toggle'));
click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));
check('수정/삭제 버튼 상시 노출', cards().every(c => c.querySelector('[data-edit]') && c.querySelector('[data-del]')));
check('상품 추가 카드', q('#menu-grid .prod-add') !== null);
check('담기도 계속 가능', cards().every(c => c.hasAttribute('data-pick')));

click(cardOf('라면').querySelector('[data-edit]'));
check('PIN 잠금', q('#pin-modal').classList.contains('open'));
check('안내 문구', q('#pin-desc').textContent.includes('메뉴를 수정하려면'), q('#pin-desc').textContent);
unlock();
check('수정 폼', q('#form-modal').classList.contains('open') && q('#form-title').textContent === '상품 수정');
check('기존 값 로드', q('[data-key="name"]').value === '라면');
check('카테고리 select 5개', q('[data-key="cat"]').options.length === 5);
setField('price', 3500);
setField('stock', 50);
submit(q('#form-modal-form'));
check('가격 반영', txt(cardOf('라면')).includes('3,500원'));
check('재고 반영', stockOf('라면') === 50, String(stockOf('라면')));

const before = cards().length;
click(q('#menu-grid .prod-add'));
setField('name', '만두');
setField('cat', 'fry');
setField('price', 4500);
setField('stock', 20);
submit(q('#form-modal-form'));
check('메뉴 추가', cards().length === before + 1);
check('새 메뉴 표시', cardOf('만두') !== undefined && txt(cardOf('만두')).includes('4,500원'));

confirmAnswer = false;
click(cardOf('만두').querySelector('[data-del]'));
check('삭제 취소', cardOf('만두') !== undefined);
confirmAnswer = true;
click(cardOf('만두').querySelector('[data-del]'));
check('삭제 확인 문구', lastConfirm.includes('상품 목록에서 삭제'), lastConfirm);
check('메뉴 삭제됨', cardOf('만두') === undefined);
check('삭제 후에도 담기 가능', cards().every(c => c.hasAttribute('data-pick')));

console.log('\n[11] 회귀');
click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);
click(qa('.nav-item').find(b => b.dataset.title === '좌석 관리'));
check('좌석 관리 정상', q('#page-seats #seat-panel') !== null);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
