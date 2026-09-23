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
const soldBtn = n => cardOf(n).querySelector('[data-soldout]');
// 카드 안에 '품절' 버튼이 있어서 전체 텍스트로는 판정할 수 없다. 배지만 본다.
const badgeOf = n => { const b = cardOf(n).querySelector('.badge'); return b ? txt(b) : null; };
const lines = () => qa('#order-items .order-line');
const lineOf = n => lines().find(l => txt(l.querySelector('.nm')) === n);

click(nav('매점 관리'));
click(sub('상품 관리'));

console.log('\n[1] 품절 버튼');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('카드마다 버튼 3개', cards().every(c => c.querySelectorAll('.prod-acts button').length === 3),
  String(cards()[0].querySelectorAll('.prod-acts button').length));
check('수정 / 품절 / 삭제 순',
  [...cardOf('라면').querySelectorAll('.prod-acts button')].map(txt).join(',') === '수정,품절,삭제',
  [...cardOf('라면').querySelectorAll('.prod-acts button')].map(txt).join(','));
check('품절 버튼에 id', soldBtn('라면').dataset.soldout !== undefined);

console.log('\n[2] 품절 처리');
check('처음엔 판매 중', badgeOf('라면') === null && !cardOf('라면').classList.contains('off'));
click(cardOf('라면'));
check('담기 가능', lineOf('라면') !== undefined);

click(soldBtn('라면'));
check('PIN 없이 바로 처리', !q('#pin-modal').classList.contains('open'));
check('품절 배지 표시', badgeOf('라면') === '품절', String(badgeOf('라면')));
check('카드 흐려짐', cardOf('라면').classList.contains('off'));
check('버튼이 판매 재개로', txt(soldBtn('라면')) === '판매 재개', txt(soldBtn('라면')));
check('버튼 켜짐 표시', soldBtn('라면').classList.contains('on'));
check('담아둔 것도 빠짐', lineOf('라면') === undefined);
check('처리 토스트', toastText().includes('라면 을(를) 품절 처리'), toastText());

click(cardOf('라면'));
check('더 담기지 않음', lineOf('라면') === undefined);
check('품절 안내', toastText().includes('품절 처리된 상품'), toastText());

console.log('\n[3] 판매 재개');
click(soldBtn('라면'));
check('품절 배지 사라짐', badgeOf('라면') === null, String(badgeOf('라면')));
check('카드 복귀', !cardOf('라면').classList.contains('off'));
check('버튼 원복', txt(soldBtn('라면')) === '품절' && !soldBtn('라면').classList.contains('on'));
check('재개 토스트', toastText().includes('판매를 다시 시작'), toastText());
click(cardOf('라면'));
check('다시 담김', lineOf('라면') !== undefined);
click(lineOf('라면').querySelector('[data-rm]'));

console.log('\n[4] 재고 0 과 수동 품절을 구분');
const drink = cardOf('에너지드링크');
check('재고 0 도 품절 표시', badgeOf('에너지드링크') === '품절', String(badgeOf('에너지드링크')));
check('재고 0 은 버튼이 품절 그대로', txt(soldBtn('에너지드링크')) === '품절',
  txt(soldBtn('에너지드링크')));
click(cardOf('에너지드링크'));
check('재고 없음 안내', toastText().includes('재고가 없습니다'), toastText());

console.log('\n[5] 재고 관리에서도 보인다');
click(soldBtn('감자튀김'));             // 재고는 33개인데 품절 처리
click(sub('재고 관리'));
const row = qa('#stock-list .stock-row')
  .find(r => txt(r.querySelector('.stock-name')) === '감자튀김');
check('재고 수치는 그대로', txt(row.querySelector('.stock-qty .now')) === '33개',
  txt(row.querySelector('.stock-qty .now')));
check('품절 처리 표기', txt(row).includes('품절 처리됨'), txt(row));
check('등급은 재고 기준 유지', txt(row.querySelector('.lv')) === '충분');

const waffle = qa('#stock-list .stock-row')
  .find(r => txt(r.querySelector('.stock-name')) === '와플');
check('판매 중지는 따로 표기', txt(waffle).includes('판매 중지'), txt(waffle));

console.log('\n[6] 되돌리고 회귀');
click(sub('상품 관리'));
click(soldBtn('감자튀김'));
check('감자튀김 판매 재개', badgeOf('감자튀김') === null, String(badgeOf('감자튀김')));

check('상품 추가 카드 유지', q('#menu-grid .prod-add') !== null);
click(cardOf('돈까스').querySelector('[data-edit]'));
unlock();
check('수정은 여전히 PIN', q('#form-modal').classList.contains('open'));
click(q('#form-cancel'));

click(cardOf('콜라'));
click(cardOf('콜라'));
check('담기 정상', txt(lineOf('콜라').querySelector('.step-qty')) === '2');
click(q('#btn-place'));
check('주문 접수', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
click(sub('주문 관리'));
check('주문 관리 정상', qa('#order-list .ord').length > 0);
click(nav('대시보드'));
check('대시보드 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
