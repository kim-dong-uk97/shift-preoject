// 재고 관리 : 왼쪽에서 메뉴를 고르면 오른쪽에 필요한 재료가 표로 나온다.
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
const txt = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
const num = t => Number(String(t).replace(/[^\d]/g, ''));
const toastText = () => q('#toast-wrap').textContent;

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
const rows = () => qa('#stock-list .stock-row');
const rowOf = n => rows().find(r => txt(r.querySelector('.stock-name')) === n);
const pick = n => click(rowOf(n));
// 오른쪽 상세
const D = () => q('#stock-detail');
const ings = () => [...D().querySelectorAll('.ing-row')];
const ingNames = () => ings().map(r => txt(r.querySelector('.ing-name .nm')));
const ingOf = n => ings().find(r => txt(r.querySelector('.ing-name .nm')) === n);
const pkOf = n => txt(ingOf(n).querySelector('.ing-now .pk'));
const rawOf = n => num(txt(ingOf(n).querySelector('.ing-now .raw')));
const detailName = () => txt(D().querySelector('.sd-name'));

click(nav('매점 관리'));
click(sub('재고 관리'));

console.log('\n[1] 좌우 두 칸');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('재고 화면', q('#page-stock').style.display === 'block');
check('나누는 상자', q('#page-stock .stock-split') !== null);
check('왼쪽 목록 · 오른쪽 상세', q('#stock-list') !== null && q('#stock-detail') !== null);
const split = ruleOf('.stock-split');
check('격자 두 칸', /display: grid/.test(split) &&
  /grid-template-columns: 320px minmax\(0, 1fr\)/.test(split), split);
check('좁아지면 한 칸', /max-width: 1000px\) \{ \.stock-split \{ grid-template-columns: 1fr/.test(html));
check('목록은 길어지면 스크롤',
  /max-height: 560px/.test(ruleOf('.stock-list')) && /overflow-y: auto/.test(ruleOf('.stock-list')),
  ruleOf('.stock-list'));
// 접었다 펴던 방식은 더 쓰지 않는다
check('아코디언 흔적 없음', !html.includes('stock-item') && !html.includes('stock-chev'));

console.log('\n[2] 왼쪽 목록');
check('메뉴 14개', rows().length === 14, rows().length + '개');
check('전부 버튼', rows().every(r => r.tagName === 'BUTTON'));
check('메뉴 id 보유', rows().every(r => r.dataset.menu));
const don = rowOf('돈까스');
check('이름', txt(don.querySelector('.stock-name')) === '돈까스');
check('현재 수량', txt(don.querySelector('.stock-qty .now')) === '9개',
  txt(don.querySelector('.stock-qty .now')));
check('안전 재고', txt(don.querySelector('.stock-qty .safe')) === '안전 10개',
  txt(don.querySelector('.stock-qty .safe')));
check('등급 배지', txt(don.querySelector('.lv')) === '부족');
check('재료 가짓수', /재료 3가지/.test(txt(don.querySelector('.stock-meta'))),
  txt(don.querySelector('.stock-meta')));
// 목록이 좁아서 글로 다 못 쓰는 대신 점으로 표시한다
check('재료 부족은 점으로', don.querySelector('.warn-dot') !== null);
check('점에 설명', don.querySelector('.warn-dot').title.includes('재료'),
  don.querySelector('.warn-dot').title);
check('넉넉한 메뉴엔 점 없음', rowOf('콜라').querySelector('.warn-dot') === null);
check('목록엔 입고 버튼 없음', q('#stock-list [data-restock]') === null);

console.log('\n[3] 들어오면 맨 위가 골라져 있다');
check('맨 위가 선택됨', rows()[0].classList.contains('on'));
check('선택은 하나뿐', rows().filter(r => r.classList.contains('on')).length === 1);
check('오른쪽이 비어 있지 않음', detailName() === txt(rows()[0].querySelector('.stock-name')),
  detailName());

console.log('\n[4] 고르면 오른쪽이 바뀐다');
pick('돈까스');
check('선택 이동', rowOf('돈까스').classList.contains('on'));
check('이전 선택 해제', rows().filter(r => r.classList.contains('on')).length === 1);
check('상세 제목', detailName() === '돈까스', detailName());
check('분류 · 조리 시간', txt(D().querySelector('.sd-meta')) === '튀김·스낵 · 조리 12분',
  txt(D().querySelector('.sd-meta')));
check('등급 배지', txt(D().querySelector('.sd-top .lv')) === '부족');
check('입고 버튼은 오른쪽에', D().querySelector('[data-restock]') !== null);

console.log('\n[5] 요약 세 칸');
const boxes = () => [...D().querySelectorAll('.sd-box')];
check('세 칸', boxes().length === 3, boxes().length + '칸');
check('항목 이름', boxes().map(b => txt(b.querySelector('.sd-k'))).join(',') ===
  '현재 재고,안전 재고,부족한 재료',
  boxes().map(b => txt(b.querySelector('.sd-k'))).join(','));
check('현재 재고', txt(q('#sd-stock')) === '9개', txt(q('#sd-stock')));
check('안전 재고', txt(q('#sd-safe')) === '10개', txt(q('#sd-safe')));
check('부족한 재료 수', txt(q('#sd-short')) === '1가지', txt(q('#sd-short')));
check('안전선 밑이면 빨갛게', boxes()[0].classList.contains('short'));
check('부족 재료 있으면 빨갛게', boxes()[2].classList.contains('short'));

console.log('\n[6] 재료 표');
check('표로 그림', D().querySelector('table.ing-tbl') !== null);
const head = [...D().querySelectorAll('.ing-tbl thead th')].map(txt);
check('열 이름', head.slice(0, 5).join(',') === '재료,1인분,현재고,안전재고,상태', head.join(','));
check('재료 3줄', ings().length === 3, ings().length + '줄');
check('가짓수 표기', txt(D().querySelector('.sd-sec')).includes('3가지'),
  txt(D().querySelector('.sd-sec')));
check('재료 이름', ingNames().join(',') === '냉동 돈까스,식용유,양파', ingNames().join(','));
const dk = ingOf('냉동 돈까스');
check('1인분은 레시피 단위', txt(dk.querySelector('.ing-use')) === '1장',
  txt(dk.querySelector('.ing-use')));
// 현재고는 g·ml 이 아니라 세는 단위(봉·통)로 보여 준다
check('현재고는 봉 단위', pkOf('냉동 돈까스') === '1봉', pkOf('냉동 돈까스'));
check('총량은 밑에 작게', txt(dk.querySelector('.ing-now .raw')) === '10장',
  txt(dk.querySelector('.ing-now .raw')));
check('안전재고도 봉 단위', txt(dk.querySelector('.ing-safe')) === '2봉',
  txt(dk.querySelector('.ing-safe')));
check('한 봉에 얼마인지 표기', txt(dk.querySelector('.ing-pack')) === '10장/봉',
  txt(dk.querySelector('.ing-pack')));
check('상태 배지', txt(dk.querySelector('.lv')) === '부족');
check('부족한 줄 표시', dk.classList.contains('short'));
check('부족한 줄만 배경', /background: var\(--danger-soft\)/.test(ruleOf('.ing-row.short')));
check('줄마다 입고 버튼', ings().every(r => r.querySelector('[data-ing]')));
// 세는 단위는 품목마다 다르다 (봉 / 통 / 판 / 박스 / 망 / 줄)
check('식용유는 통', pkOf('식용유') === '2통' && txt(ingOf('식용유').querySelector('.ing-pack')) === '1,800ml/통',
  pkOf('식용유') + ' / ' + txt(ingOf('식용유').querySelector('.ing-pack')));
check('세 자리마다 쉼표', txt(ingOf('식용유').querySelector('.ing-now .raw')) === '3,600ml',
  txt(ingOf('식용유').querySelector('.ing-now .raw')));
check('현재고 칸에 g·ml 만 덩그러니 있지 않음',
  ings().every(r => r.querySelector('.ing-now .pk') !== null));

console.log('\n[7] 여러 메뉴가 같은 재료를 쓴다');
pick('라면');
check('라면 = 라면사리 + 계란', ingNames().join(',') === '라면사리,계란', ingNames().join(','));
const noodleStock = txt(ingOf('라면사리').querySelector('.ing-now'));
pick('치즈라면');
check('치즈라면 = 라면사리 + 치즈 + 계란',
  ingNames().join(',') === '라면사리,슬라이스 치즈,계란', ingNames().join(','));
check('같은 재료는 같은 수치', txt(ingOf('라면사리').querySelector('.ing-now')) === noodleStock,
  noodleStock);
pick('콜라');
check('재료 1가지', ings().length === 1 && ingNames()[0] === '콜라 캔', ingNames().join(','));
check('박스로 셈', pkOf('콜라 캔') === '4박스', pkOf('콜라 캔'));
check('부족한 재료 0', txt(q('#sd-short')) === '0가지');

console.log('\n[8] 재료 입고');
pick('돈까스');
click(ingOf('냉동 돈까스').querySelector('[data-ing]'));
check('입고 폼 열림', q('#form-modal').classList.contains('open'));
check('재료명 제목', q('#form-title').textContent === '재료 입고 — 냉동 돈까스');
check('현재 · 안전 · 한 봉 용량 안내',
  q('#form-desc').textContent === '현재 1봉 (10장) · 안전 재고 2봉 · 10장/봉',
  q('#form-desc').textContent);
// 발주가 봉 단위라 입고도 봉으로 받는다
check('입고 단위는 봉', txt(q('[data-key="add"]').closest('.field')).includes('(봉)'),
  txt(q('[data-key="add"]').closest('.field')));
check('안전 재고 단위도 봉', txt(q('[data-key="safe"]').closest('.field')).includes('(봉)'),
  txt(q('[data-key="safe"]').closest('.field')));
check('안전 재고도 고칠 수 있음', q('[data-key="safe"]') !== null);
q('[data-key="add"]').value = '0';
submit(q('#form-modal-form'));
check('0봉 차단', q('#form-error').classList.contains('show'));
q('[data-key="add"]').value = '3';
submit(q('#form-modal-form'));
check('3봉 = 30장 입고', pkOf('냉동 돈까스') === '4봉' && rawOf('냉동 돈까스') === 40,
  pkOf('냉동 돈까스') + ' / ' + rawOf('냉동 돈까스'));
check('등급 상승', txt(ingOf('냉동 돈까스').querySelector('.lv')) === '충분');
check('부족 표시 해제', !ingOf('냉동 돈까스').classList.contains('short'));
check('요약도 갱신', txt(q('#sd-short')) === '0가지', txt(q('#sd-short')));
check('왼쪽 점도 사라짐', rowOf('돈까스').querySelector('.warn-dot') === null);
check('입고 토스트', toastText().includes('냉동 돈까스 3봉 입고'), toastText());
check('안내 문구 갱신', /재료 4건/.test(txt(q('#stock-note'))), txt(q('#stock-note')));
check('고른 메뉴 유지', detailName() === '돈까스');

console.log('\n[9] 메뉴 입고');
click(D().querySelector('[data-restock]'));
check('메뉴 입고 폼', q('#form-title').textContent === '입고 — 돈까스');
q('[data-key="add"]').value = '25';
submit(q('#form-modal-form'));
check('현재 재고 반영', txt(q('#sd-stock')) === '34개', txt(q('#sd-stock')));
check('왼쪽 수량도 반영', txt(rowOf('돈까스').querySelector('.stock-qty .now')) === '34개',
  txt(rowOf('돈까스').querySelector('.stock-qty .now')));
check('선택 유지', rowOf('돈까스').classList.contains('on'));

console.log('\n[10] 필터를 걸어도 오른쪽이 따라온다');
const chipOf = n => qa('#stock-filter .chip-btn').find(c => txt(c).startsWith(n));
click(chipOf('품절'));
check('품절만 남음', rows().length === 1);
check('오른쪽도 그 메뉴로', detailName() === txt(rows()[0].querySelector('.stock-name')),
  detailName());
click(chipOf('전체'));
check('전체 복귀', rows().length === 14);

console.log('\n[11] 주문이 나가면 재료도 줄어든다');
pick('김치볶음밥');
const eggBefore = rawOf('계란');
click(sub('상품 관리'));
click(qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '김치볶음밥'));
click(q('#btn-place'));
click(sub('재고 관리'));
pick('김치볶음밥');
// 봉 수는 잘 안 바뀌니 소진은 총량으로 확인한다
check('계란 1개 소진', rawOf('계란') === eggBefore - 1,
  eggBefore + ' -> ' + rawOf('계란'));
check('김치 80g 소진', rawOf('김치') === 2000 - 80, txt(ingOf('김치').querySelector('.ing-now')));
check('뜯어 쓴 봉도 한 봉으로 셈', pkOf('김치') === '2봉', pkOf('김치'));

click(sub('주문 관리'));
click(qa('#order-list .ord')[0].querySelector('[data-cancel]'));
click(sub('재고 관리'));
pick('김치볶음밥');
check('취소하면 계란 복구', rawOf('계란') === eggBefore, txt(ingOf('계란').querySelector('.ing-now')));
check('취소하면 김치 복구', rawOf('김치') === 2000, txt(ingOf('김치').querySelector('.ing-now')));

console.log('\n[12] 상품 관리에서 안전 재고를 고친다');
click(sub('상품 관리'));
const cola = qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '콜라');
click(cola.querySelector('[data-edit]'));
if (q('#pin-modal').classList.contains('open')) {
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
check('수정 폼에 안전 재고', q('[data-key="safe"]') !== null);
check('현재 값이 들어 있음', q('[data-key="safe"]').value === '30', q('[data-key="safe"]').value);
q('[data-key="safe"]').value = '-1';
submit(q('#form-modal-form'));
check('음수 차단', q('#form-error').classList.contains('show'), txt(q('#form-error')));
q('[data-key="safe"]').value = '50';
submit(q('#form-modal-form'));
click(sub('재고 관리'));
check('안전 재고 반영', txt(rowOf('콜라').querySelector('.stock-qty .safe')) === '안전 50개',
  txt(rowOf('콜라').querySelector('.stock-qty .safe')));
check('등급도 다시 계산 (88 / 50 = 보통)', txt(rowOf('콜라').querySelector('.lv')) === '보통',
  txt(rowOf('콜라').querySelector('.lv')));

console.log('\n[13] 회귀');
click(nav('대시보드'));
check('대시보드 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
click(nav('좌석 관리'));
check('좌석 관리 정상', qa('#seat-map .seat').length === 140);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
