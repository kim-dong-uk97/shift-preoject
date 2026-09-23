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
const px = (rule, prop) => {
  const m = (rule || '').match(new RegExp(prop + ': ([\\d.]+)px'));
  return m ? parseFloat(m[1]) : null;
};
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);

click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));

console.log('\n[1] 강조 배지 : 오른쪽 · 더 작게');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const tags = ruleOf('.menu-tags');
check('오른쪽 정렬', tags && tags.includes('justify-content: flex-end'), tags);
const promo = ruleOf('.promo');
check('글자 9.5px 로 축소', px(promo, 'font-size') === 9.5, promo);
check('여백 축소', promo && promo.includes('padding: 1px 6px'), promo);
check('모서리도 작게', promo && promo.includes('border-radius: 5px'), promo);
check('배지 간격 축소', tags && tags.includes('gap: 4px'), tags);

console.log('\n[2] 배지 내용 · 위치는 그대로');
check('BEST 3개', qa('#menu-grid .promo-best').length === 3);
check('NEW 1개', qa('#menu-grid .promo-new').length === 1);
check('라면 BEST', txt(cardOf('라면').querySelector('.promo')) === 'BEST');
check('김치볶음밥 NEW', txt(cardOf('김치볶음밥').querySelector('.promo')) === 'NEW');
const c = cardOf('라면');
check('여전히 사진 아래',
  c.querySelector('.menu-thumb').compareDocumentPosition(c.querySelector('.menu-tags')) & 4);
check('여전히 이름 위',
  c.querySelector('.menu-tags').compareDocumentPosition(c.querySelector('.prod-name')) & 4);
check('배지 없는 카드엔 줄도 없음',
  cardOf('공기밥').querySelector('.menu-tags') === null);

console.log('\n[3] 안내 문구 제거');
check('store-note 요소 없음', q('#store-note') === null);
check('안내 문구 흔적 없음', !html.includes('담으면 오른쪽 주문서에 올라갑니다'));
check('편집 안내 문구도 제거', !html.includes('카드에서 메뉴를 고치거나 지웁니다'));
const head = q('#page-store .panel-head');
check('패널 머리는 제목만', head.children.length === 1 && txt(head) === '메뉴', txt(head));

console.log('\n[4] 편집 토글 없이 상시 편집');
check('menu-foot 제거', q('#page-store .menu-foot') === null);
check('편집 토글 제거', q('#btn-menu-edit') === null);
check('.menu-foot CSS 제거', !html.includes('.menu-foot'));
check('카드마다 수정/삭제 상시',
  cards().every(c => c.querySelector('[data-edit]') && c.querySelector('[data-del]')));
check('상품 추가 카드', q('#menu-grid .prod-add') !== null);
check('panel-tools 미사용', q('#page-store .panel-tools') === null);

console.log('\n[5] 편집 동작 유지');
click(cardOf('라면').querySelector('[data-edit]'));
check('수정은 점장 PIN', q('#pin-modal').classList.contains('open'));
unlock();
check('수정 폼 열림', q('#form-modal').classList.contains('open'));
click(q('#form-cancel'));
check('담기는 계속 가능', cards().every(x => x.hasAttribute('data-pick')));

console.log('\n[6] 회귀');
check('검색창 유지', q('#store-search') !== null);
check('칩 6개', qa('#store-cats .chip-btn').length === 6);
check('사진 14장', qa('#menu-grid .menu-thumb img').length === 14);
click(cardOf('라면'));
check('담기 동작', qa('#order-items .order-line').length === 1);
check('수량 칩', q('#order-items .stepper') !== null);
check('결제 수단 5개', qa('#pay-methods .pay-btn').length === 5);
click(q('#btn-place'));
check('주문 넣기', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
