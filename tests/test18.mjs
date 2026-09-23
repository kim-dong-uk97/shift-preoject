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
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);
const promoOf = n => cardOf(n).querySelector('.promo');

const BEST = ['라면', '돈까스', '콜라'];
const NEW = ['김치볶음밥'];
const NONE = ['치즈라면', '라볶이', '제육덮밥', '공기밥', '치킨텐더',
              '감자튀김', '아메리카노', '에너지드링크', '아이스크림', '와플'];

click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));

console.log('\n[1] 평점 · 조리시간 배지 제거');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('.menu-tag 요소 없음', qa('.menu-tag').length === 0);
// .menu-tags 래퍼는 남으므로 단일 .menu-tag 규칙만 사라졌는지 본다
check('.menu-tag CSS 제거', !html.includes('.menu-tag {') && !html.includes('.menu-tag .star'));
check('rateText 함수 제거', !html.includes('rateText'));
check('카드에 평점 표기 없음', cards().every(c => !txt(c).includes('★')),
  cards().map(c => txt(c)).find(t => t.includes('★')) || '');
check('카드에 조리시간 표기 없음', cards().every(c => !/\d+분/.test(txt(c))),
  cards().map(c => txt(c)).find(t => /\d+분/.test(t)) || '');

console.log('\n[2] BEST 배지');
check('BEST 3개', qa('#menu-grid .promo-best').length === 3, qa('#menu-grid .promo-best').length + '개');
BEST.forEach(n => {
  const p = promoOf(n);
  check(n + ' BEST', !!p && txt(p) === 'BEST' && p.classList.contains('promo-best'),
    p ? txt(p) : '없음');
});
const best = ruleOf('.promo-best');
check('초록 계열 글자', best && best.includes('color: #16a34a'), best);
check('초록 계열 배경', best && best.includes('background: #e5f6ea'), best);

console.log('\n[3] NEW 배지');
check('NEW 1개', qa('#menu-grid .promo-new').length === 1);
NEW.forEach(n => {
  const p = promoOf(n);
  check(n + ' NEW', !!p && txt(p) === 'NEW' && p.classList.contains('promo-new'), p ? txt(p) : '없음');
});
const nw = ruleOf('.promo-new');
check('BEST 와 다른 색', nw && !nw.includes('#16a34a') && nw.includes('var(--point)'), nw);

console.log('\n[4] 나머지 메뉴엔 배지 없음');
check('배지 총 4개', qa('#menu-grid .promo').length === 4, qa('#menu-grid .promo').length + '개');
NONE.forEach(n => check(n + ' 배지 없음', promoOf(n) === null));
check('배지 없으면 빈 줄도 없음',
  NONE.every(n => cardOf(n).querySelector('.menu-tags') === null));

console.log('\n[5] 위치 : 사진 바로 아래, 이름 위');
const c = cardOf('라면');
const thumb = c.querySelector('.menu-thumb');
const tags = c.querySelector('.menu-tags');
const name = c.querySelector('.prod-name');
check('사진 다음에 배지', thumb.compareDocumentPosition(tags) & 4);
check('배지 다음에 이름', tags.compareDocumentPosition(name) & 4);
check('호버 규칙도 promo 로 갱신', html.includes('.prod.pick:hover .promo'));

console.log('\n[6] 편집에서 배지 지정');
click(cardOf('라볶이').querySelector('[data-edit]'));
unlock();
check('강조 배지 선택 존재', q('[data-key="tag"]') !== null);
check('없음/BEST/NEW 3종', q('[data-key="tag"]').options.length === 3,
  [...q('[data-key="tag"]').options].map(o => o.textContent).join(','));
check('현재 값은 없음', q('[data-key="tag"]').value === '');
q('[data-key="tag"]').value = 'best';
submit(q('#form-modal-form'));
check('라볶이에 BEST 부여', promoOf('라볶이') !== null && txt(promoOf('라볶이')) === 'BEST');
check('BEST 4개로 증가', qa('#menu-grid .promo-best').length === 4);

click(cardOf('라볶이').querySelector('[data-edit]'));
unlock();
check('기존 배지 값 로드', q('[data-key="tag"]').value === 'best');
q('[data-key="tag"]').value = '';
submit(q('#form-modal-form'));
check('배지 해제', promoOf('라볶이') === null);

console.log('\n[7] 회귀');
check('사진 14장 유지', qa('#menu-grid .menu-thumb img').length === 14);
check('품절 배지 유지', txt(cardOf('에너지드링크')).includes('품절'));
check('판매 중지 배지 유지', txt(cardOf('와플')).includes('판매 중지'));
click(cardOf('라면'));
check('담기 동작', qa('#order-items .order-line').length === 1);
check('수량 배지', txt(cardOf('라면').querySelector('.menu-qty')) === '1');
check('주문서엔 조리시간 유지', txt(q('#order-items .order-line')).includes('5분'),
  txt(q('#order-items .order-line')));
click(q('#btn-place'));
check('주문 넣기 동작', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
