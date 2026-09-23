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
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();
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
const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const sub = t => qa('.sub-item').find(b => b.dataset.title === t);
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => txt(c.querySelector('.prod-name')) === n);
const lines = () => qa('#order-items .order-line');

console.log('\n[1] 매점 관리 하위 3개');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const subs = [...nav('매점 관리').closest('.nav-group').querySelectorAll('.sub-item')]
  .map(b => b.dataset.title);
check('상품 관리 / 주문 관리 / 재고 관리',
  subs.join(',') === '상품 관리,주문 관리,재고 관리', subs.join(','));
check('상위는 펼치기 전용(data-page 없음)', !nav('매점 관리').hasAttribute('data-page'));
check('재고 정리 이름 사라짐', sub('재고 정리') === undefined);
check('상위 메뉴 8개 유지', qa('#nav .nav-item').length === 8);

click(nav('매점 관리'));
check('상위 클릭은 펼치기만', sub('상품 관리').closest('.submenu').classList.contains('open'));
check('화면은 안 바뀜', q('#page-store').style.display !== 'block');

console.log('\n[2] 상품 관리 = 기존 화면');
click(sub('상품 관리'));
check('상품 화면 표시', q('#page-store').style.display === 'block');
check('제목', q('#page-title').textContent === '상품 관리');
check('부제', q('#page-desc').textContent === '매점 상품 · 주문 담기');
check('메뉴 카드 14개', cards().length === 14);
check('검색·칩 유지', q('#store-search') !== null && qa('#store-cats .chip-btn').length === 6);
check('오른쪽 주문서 유지', q('#page-store .order-panel') !== null);
check('접수된 주문은 여기 없음', q('#page-store #order-list') === null);

console.log('\n[3] 상품 추가·수정·삭제가 항상 열려 있음');
check('편집 토글 제거', q('#btn-menu-edit') === null);
check('모든 카드에 수정 버튼', cards().every(c => c.querySelector('[data-edit]')));
check('모든 카드에 삭제 버튼', cards().every(c => c.querySelector('[data-del]')));
check('상품 추가 카드', q('#menu-grid .prod-add') !== null);
check('추가 카드 문구', txt(q('#menu-grid .prod-add')) === '상품 추가', txt(q('#menu-grid .prod-add')));
check('카드 담기도 그대로', cards().every(c => c.hasAttribute('data-pick')));

console.log('\n[4] 담기와 편집이 서로 안 엉킨다');
click(cardOf('라면'));
check('카드 본문 클릭 = 담기', lines().length === 1);
click(cardOf('라면').querySelector('[data-edit]'));
check('수정 버튼은 담기지 않음', lines().length === 1);
check('PIN 확인', q('#pin-modal').classList.contains('open'));
unlock();
check('수정 폼 열림', q('#form-modal').classList.contains('open') &&
  q('#form-title').textContent === '상품 수정');
q('[data-key="price"]').value = '3500';
submit(q('#form-modal-form'));
check('가격 반영', txt(cardOf('라면')).includes('3,500원'));

const before = cards().length;
click(q('#menu-grid .prod-add'));
check('추가 폼', q('#form-title').textContent === '상품 추가');
q('[data-key="name"]').value = '만두';
q('[data-key="price"]').value = '4500';
q('[data-key="stock"]').value = '20';
q('[data-key="cook"]').value = '6';
submit(q('#form-modal-form'));
check('상품 추가됨', cards().length === before + 1 && cardOf('만두') !== undefined);

confirmAnswer = true;
click(cardOf('만두').querySelector('[data-del]'));
check('삭제 문구', lastConfirm.includes('상품 목록에서 삭제'), lastConfirm);
check('삭제됨', cardOf('만두') === undefined);
check('삭제해도 담긴 건 유지', lines().length === 1);

console.log('\n[5] 주문란 편집 : 담당자 · 좌석');
check('담당자 편집 버튼', q('#btn-order-user') !== null);
check('좌석 편집 버튼', q('#btn-order-seat') !== null);
check('초기 담당자', txt(q('#order-user')) === '피터펜');
check('초기 좌석', txt(q('#order-seat')) === 'A-12');

click(q('#btn-order-user'));
check('담당자 폼', q('#form-title').textContent === '담당자 변경');
check('현재 값 로드', q('[data-key="name"]').value === '피터펜');
q('[data-key="name"]').value = '';
submit(q('#form-modal-form'));
check('빈 이름 차단', q('#form-error').classList.contains('show'));
q('[data-key="name"]').value = '웬디';
submit(q('#form-modal-form'));
check('담당자 변경', txt(q('#order-user')) === '웬디');
check('변경 토스트', toastText().includes('담당자를 웬디'), toastText());

click(q('#btn-order-seat'));
check('좌석 폼', q('#form-title').textContent === '좌석 변경');
q('[data-key="seat"]').value = 'Z-99';
submit(q('#form-modal-form'));
check('없는 좌석 차단', q('#form-error').classList.contains('show'), q('#form-error').textContent);
check('좌석 안 바뀜', txt(q('#order-seat')) === 'A-12');
q('[data-key="seat"]').value = 'c-08';
submit(q('#form-modal-form'));
check('소문자도 받아 대문자로', txt(q('#order-seat')) === 'C-08');

click(q('#btn-place'));
const newCard = txt(qa('#order-list .ord')[0]);
check('바꾼 좌석으로 접수', newCard.includes('C-08'), newCard);

console.log('\n[6] 주문 관리 = 접수된 주문');
click(sub('주문 관리'));
check('주문 화면 표시', q('#page-orders').style.display === 'block');
check('제목', q('#page-title').textContent === '주문 관리');
check('부제', q('#page-desc').textContent === '접수된 주문 처리');
check('상품 화면 숨김', q('#page-store').style.display === 'none');
check('접수 목록 존재', qa('#page-orders #order-list .ord').length > 0);
const card0 = () => qa('#order-list .ord')[0];
check('상태 진행 버튼', card0().querySelector('[data-next]') !== null);
check('취소 버튼도 함께', card0().querySelector('[data-cancel]') !== null);
const noteBefore = txt(q('#order-note'));
click(card0().querySelector('[data-next]'));
check('조리로 전환', card0().classList.contains('cook'));
check('건수 갱신', txt(q('#order-note')) !== noteBefore, noteBefore + ' -> ' + txt(q('#order-note')));

console.log('\n[7] 재고 관리');
click(sub('재고 관리'));
check('재고 화면 표시', q('#page-stock').style.display === 'block');
check('제목', q('#page-title').textContent === '재고 관리');
check('재고 목록 14개', qa('#stock-list .stock-row').length === 14);
check('분류 칩 5개', qa('#stock-filter .chip-btn').length === 5);

console.log('\n[8] 회귀');
click(nav('대시보드'));
check('대시보드 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
check('대시보드 주문 연동 유지', qa('#dash-orders .row').length > 0);
click(nav('좌석 관리'));
check('좌석 관리 정상', q('#page-seats #seat-panel') !== null);
click(nav('회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(nav('요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
