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
const toastText = () => q('#toast-wrap').textContent;
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
const submit = el => el.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);
// 담기는 카드 클릭으로 바뀌었다
const plusOf = n => cardOf(n);
const payBtns = () => qa('#pay-methods .pay-btn');
// 버튼 텍스트에는 표식(N/K/S)이 앞에 붙으므로 표식을 뺀 라벨만 본다
const payLabel = b => txt(b).replace(txt(b.querySelector('.pay-mark')), '');
const payOf = n => payBtns().find(b => payLabel(b) === n);
const markOf = n => txt(payOf(n).querySelector('.pay-mark'));

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

console.log('\n[1] 카운터 픽업 제거');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('좌석배달/픽업 토글 제거', q('#order-type') === null);
check('.seg 마크업 없음', qa('.seg').length === 0);
check('픽업 문구 없음', !html.includes('카운터 픽업'));
check('.seg CSS 제거', !html.includes('.seg button'));

console.log('\n[2] 결제란 구성');
check('결제 영역 존재', q('#page-store .pay-sec') !== null);
check('결제 수단 라벨', txt(q('.pay-label')) === '결제 수단');
check('결제 수단 5개', payBtns().length === 5, payBtns().length + '개');
check('현금 / 네이버페이 / 카카오페이 / 카드결제 / SHIFT결제',
  payBtns().map(payLabel).join(',') === '현금,네이버페이,카카오페이,카드결제,SHIFT결제',
  payBtns().map(payLabel).join(','));
check('항목마다 표식', payBtns().every(b => b.querySelector('.pay-mark')));
check('현금은 아이콘', payOf('현금').querySelector('.pay-mark svg') !== null);
check('카드결제는 아이콘', payOf('카드결제').querySelector('.pay-mark svg') !== null);
check('네이버페이는 N 표식', markOf('네이버페이') === 'N');
check('카카오페이는 K 표식', markOf('카카오페이') === 'K');
check('SHIFT결제는 S 표식', markOf('SHIFT결제') === 'S');
check('결제란이 결제 금액 아래', q('#order-sum').compareDocumentPosition(q('.pay-sec')) & 4);
check('결제란이 주문 넣기 위', q('.pay-sec').compareDocumentPosition(q('#btn-place')) & 4);
check('SHIFT결제가 한 줄 차지', html.includes('.pay-grid .pay-btn:last-child { grid-column: 1 / -1; }'));

console.log('\n[3] 선택 동작');
check('기본 선택은 카드결제', payOf('카드결제').classList.contains('on'));
check('하나만 선택됨', payBtns().filter(b => b.classList.contains('on')).length === 1);
click(payOf('카카오페이'));
check('카카오페이로 전환', payOf('카카오페이').classList.contains('on'));
check('이전 선택 해제', !payOf('카드결제').classList.contains('on'));
check('여전히 하나만 선택', payBtns().filter(b => b.classList.contains('on')).length === 1);
click(payOf('SHIFT결제'));
check('SHIFT결제 선택', payOf('SHIFT결제').classList.contains('on'));

console.log('\n[4] 주문에 결제 수단 반영');
click(plusOf('라면'));
click(plusOf('콜라'));
const before = qa('#order-list .ord').length;
click(q('#btn-place'));
check('주문 접수', qa('#order-list .ord').length === before + 1);
check('토스트에 결제 수단', toastText().includes('SHIFT결제'), toastText());
check('토스트에 원화 금액', /SHIFT결제 [\d,]+원/.test(toastText()), toastText());
const newRow = txt(qa('#order-list .ord')[0]);
check('주문 목록에 결제 수단', newRow.includes('SHIFT결제'), newRow);
check('주문 목록에 좌석', newRow.includes('A-12'), newRow);
check('픽업 표기 없음', !newRow.includes('픽업'));

click(payOf('현금'));
click(plusOf('콜라'));
click(q('#btn-place'));
check('다른 결제 수단도 반영', txt(qa('#order-list .ord')[0]).includes('현금'), txt(qa('#order-list .ord')[0]));
check('선택은 유지됨', payOf('현금').classList.contains('on'));

console.log('\n[5] 기존 주문 표기');
const rows = qa('#order-list .ord').map(txt);
check('기존 주문에도 결제 수단', rows.filter(r => /현금|네이버페이|카카오페이|카드결제|SHIFT결제/.test(r)).length === rows.length,
  rows.find(r => !/현금|네이버페이|카카오페이|카드결제|SHIFT결제/.test(r)) || '');

console.log('\n[6] 대시보드 연동 · 회귀');
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('대시보드 주문 렌더', qa('#dash-orders .row').length > 0);
check('대시보드에도 결제 수단', qa('#dash-orders .row').every(r => /현금|네이버페이|카카오페이|카드결제|SHIFT결제/.test(txt(r))));
click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));
check('메뉴 카드 정상', cards().length === 14);
check('재고 차감 유지', stockOf('콜라') === 86, String(stockOf('콜라')));
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);
click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
