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
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

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
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);
const lines = () => qa('#order-items .order-line');
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}

click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));

console.log('\n[1] 메뉴 검색창 축소');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('search-sm 적용', q('#store-search').closest('.search').classList.contains('search-sm'));
const sm = ruleOf('.search-sm');
check('폭 제한', sm && sm.includes('max-width: 240px'), sm);
check('입력 높이도 축소', (ruleOf('.search-sm input') || '').includes('padding: 8px'),
  ruleOf('.search-sm input'));
check('안내 문구 축약', q('#store-search').placeholder === '메뉴 검색', q('#store-search').placeholder);
check('회원 목록 검색은 다른 껍데기(.tb-search)',
  q('#member-search').closest('.tb-search') !== null &&
  q('#member-search').closest('.search') === null);

console.log('\n[2] 남은 개수 제거');
check('주문 화면에 재고 문구 없음', cards().every(c => !/개 남음|재고/.test(txt(c))),
  txt(cards()[0]));
check('.menu-stock 요소 없음', qa('.menu-stock').length === 0);
check('.menu-stock CSS 제거', !html.includes('.menu-stock {'));
check('편집 모드에서도 재고 문구 없음', cards().every(c => !/개 남음|재고/.test(txt(c))),
  txt(cards()[0]));
click(cardOf('라면').querySelector('[data-edit]'));
unlock();
check('재고는 상품 수정 폼에서 관리', q('[data-key="stock"]') !== null);
check('재고 값 유지', q('[data-key="stock"]').value === '42', q('[data-key="stock"]').value);
click(q('#form-cancel'));
check('품절 배지는 유지', txt(cardOf('에너지드링크')).includes('품절'));

console.log('\n[3] 주문판 머리 : 담당자 · 좌석');
check('담당자 이름 표시', q('#order-user') !== null && txt(q('#order-user')) === '피터펜',
  q('#order-user') ? txt(q('#order-user')) : '없음');
check('주문번호는 작은 줄로', q('#order-no').closest('.order-label') !== null);
check('주문번호 유지', /^#\d+$/.test(txt(q('#order-no'))), txt(q('#order-no')));
check('좌석 번호 표시', txt(q('#order-seat')) === 'A-12');
check('좌석 번호 전용 클래스', q('#order-seat').classList.contains('order-seat-no'));
const seatCss = ruleOf('.order-seat-no');
const userCss = ruleOf('.order-user');
check('좌석 번호가 담당자보다 작음',
  parseFloat(seatCss.match(/font-size: ([\d.]+)px/)[1]) < parseFloat(userCss.match(/font-size: ([\d.]+)px/)[1]),
  seatCss + ' / ' + userCss);
check('이전 22px 크기 제거', !html.includes('.order-no {'));

console.log('\n[4] 계정 연동');
check('사이드바 계정도 피터펜', txt(q('#user-name')) === '피터펜', txt(q('#user-name')));
check('아바타 첫 글자', txt(q('#avatar')) === '피');
click(q('#btn-login'));
q('#login-id').value = 'admin';
q('#login-pw').value = 'pw';
submit(q('#login-form'));
check('로그인하면 주문판 담당자도 갱신', txt(q('#order-user')) === txt(q('#user-name')),
  txt(q('#order-user')) + ' / ' + txt(q('#user-name')));

console.log('\n[5] 주문 목록 높이 유지 + 스크롤');
const items = ruleOf('.order-items');
check('높이 고정(3줄분)', items && items.includes('height: 268px'), items);
check('넘치면 스크롤', items && items.includes('overflow-y: auto'), items);
check('비어도 자리 유지(빈 안내가 높이 채움)',
  (ruleOf('.order-items .order-empty') || '').includes('height: 100%'),
  ruleOf('.order-items .order-empty'));
check('처음엔 빈 안내', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));

click(cardOf('라면'));
check('1개 담아도 영역 그대로', ruleOf('.order-items').includes('height: 268px'));
click(cardOf('콜라'));
click(cardOf('라볶이'));
check('3줄', lines().length === 3);
click(cardOf('김치볶음밥'));
click(cardOf('감자튀김'));
check('3줄 초과해도 렌더', lines().length === 5);

console.log('\n[6] 회귀');
check('카드 클릭 담기 유지', lines().length === 5);
check('주문서 스테퍼 유지', lines().every(l => l.querySelector('.step-btn.plus')));
check('결제 수단 5개', qa('#pay-methods .pay-btn').length === 5);
click(q('#btn-place'));
check('주문 넣기 동작', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
check('접수 목록 반영', qa('#order-list .ord').length > 0);
check('칩 6개 유지', qa('#store-cats .chip-btn').length === 6);

click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
