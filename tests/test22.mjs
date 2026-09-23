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
const nav = t => qa('.nav-item').find(b => b.dataset.title === t);
const sub = t => qa('.sub-item').find(b => b.dataset.title === t);
const rows = () => qa('#stock-list .stock-row');
const rowOf = n => rows().find(r => txt(r.querySelector('.stock-name')) === n);
const qtyOf = n => Number(txt(rowOf(n).querySelector('.stock-qty .now')).replace(/[^\d]/g, ''));
const safeOf = n => Number(txt(rowOf(n).querySelector('.stock-qty .safe')).replace(/[^\d]/g, ''));
const lvOf = n => txt(rowOf(n).querySelector('.lv'));
const chips = () => qa('#stock-filter .chip-btn');
// 왼쪽에서 메뉴를 고르면 오른쪽 상세에 입고 버튼이 나온다
const openDetail = n => { click(rowOf(n)); return q('#stock-detail [data-restock]'); };
const chipOf = n => chips().find(c => txt(c).startsWith(n));
const chipCount = n => Number(txt(chipOf(n).querySelector('.cnt')));

console.log('\n[1] 메뉴 위치');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('재고 정리는 하위 메뉴', sub('재고 관리') !== undefined);
check('상위 메뉴가 아님', nav('재고 관리') === undefined);
check('매점 관리의 하위',
  sub('재고 관리').closest('.nav-group').querySelector('.nav-item').dataset.title === '매점 관리');
check('매점 관리에 펼침 화살표', nav('매점 관리').querySelector('.chev') !== null);
check('상위는 펼치기 전용', !nav('매점 관리').hasAttribute('data-page'));
check('상위 메뉴 8개 유지', qa('#nav .nav-item').length === 8, qa('#nav .nav-item').length + '개');

console.log('\n[1-2] 매점 관리를 누르면 화면 + 하위 펼침');
click(nav('매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));
check('매점 화면 열림', q('#page-store').style.display === 'block');
check('하위 메뉴 펼쳐짐', sub('재고 관리').closest('.submenu').classList.contains('open'));
check('하위 3개 모두 노출',
  ['상품 관리', '주문 관리', '재고 관리'].every(t => sub(t) !== undefined));

console.log('\n[2] 페이지 진입');
click(sub('재고 관리'));
check('재고 페이지 표시', q('#page-stock').style.display === 'block');
check('하위 메뉴가 선택 표시', sub('재고 관리').classList.contains('active'));
check('제목', q('#page-title').textContent === '재고 관리');
check('부제', q('#page-desc').textContent === '매점 재고 확인 · 입고');
check('준비중 카드 숨김', q('#page-body').style.display === 'none');
check('매점 페이지 숨김', q('#page-store').style.display === 'none');

console.log('\n[3] 재고 분류');
check('메뉴 14개 전부 표시', rows().length === 14, rows().length + '개');
check('필터 칩 5개 (전체+4단계)', chips().length === 5, chips().map(txt).join(','));
check('칩 이름', chips().map(c => txt(c).replace(/\d+$/, '')).join(',') === '전체,품절,부족,보통,충분',
  chips().map(txt).join(','));

// 기준은 메뉴마다 다른 안전 재고다
check('메뉴마다 안전 재고 표시', rows().every(r => /안전 \d+개/.test(txt(r.querySelector('.safe')))),
  txt(rows()[0].querySelector('.stock-qty')));
check('0개 = 품절', lvOf('에너지드링크') === '품절' && qtyOf('에너지드링크') === 0);
check('안전선 미만 = 부족', lvOf('돈까스') === '부족' &&
  qtyOf('돈까스') === 9 && safeOf('돈까스') === 10);
check('안전선 두 배 미만 = 보통', lvOf('와플') === '보통' &&
  qtyOf('와플') === 11 && safeOf('와플') === 8);
check('두 배 이상 = 충분', lvOf('라면') === '충분' &&
  qtyOf('라면') === 42 && safeOf('라면') === 15);
// 같은 24개라도 안전 재고가 다르면 등급이 달라진다
check('24개 / 안전 10 = 충분', lvOf('아이스크림') === '충분' && qtyOf('아이스크림') === 24);
check('20개 / 안전 12 = 보통', lvOf('치킨텐더') === '보통' && qtyOf('치킨텐더') === 20);

check('분류 합이 전체와 일치',
  ['품절', '부족', '보통', '충분'].reduce((a, n) => a + chipCount(n), 0) === 14,
  ['품절', '부족', '보통', '충분'].map(n => n + chipCount(n)).join(' '));
check('품절 1건', chipCount('품절') === 1);
check('부족 1건', chipCount('부족') === 1);
check('보통 5건', chipCount('보통') === 5, String(chipCount('보통')));
check('충분 7건', chipCount('충분') === 7, String(chipCount('충분')));
// 메뉴와 재료를 나눠서 알려 준다
check('입고 필요 안내', txt(q('#stock-note')) === '입고 필요 — 메뉴 2건 · 재료 5건',
  txt(q('#stock-note')));

console.log('\n[4] 급한 것부터 정렬');
// 수량이 아니라 "안전 재고 대비 여유" 순이라야 급한 게 위로 온다
const ratios = rows().map(r => {
  const now = Number(txt(r.querySelector('.stock-qty .now')).replace(/[^\d]/g, ''));
  const safe = Number(txt(r.querySelector('.stock-qty .safe')).replace(/[^\d]/g, ''));
  return now / (safe || 1);
});
check('여유 적은 순', ratios.every((v, i) => i === 0 || ratios[i - 1] <= v + 1e-9),
  ratios.map(v => v.toFixed(2)).join(','));
check('품절이 맨 위', txt(rows()[0].querySelector('.lv')) === '품절');
check('품절 행 강조 클래스', rows()[0].classList.contains('empty-stock'));

console.log('\n[5] 필터');
click(chipOf('품절'));
check('품절만 표시', rows().length === 1 && lvOf('에너지드링크') === '품절');
check('칩 선택 전환', chipOf('품절').classList.contains('on'));
click(chipOf('충분'));
check('충분만 표시', rows().length === chipCount('충분') && rows().every(r => txt(r.querySelector('.lv')) === '충분'));
click(chipOf('전체'));
check('전체 복귀', rows().length === 14);

console.log('\n[6] 입고');
click(openDetail('돈까스'));
check('입고 폼 열림', q('#form-modal').classList.contains('open'));
check('메뉴명 제목', q('#form-title').textContent === '입고 — 돈까스');
check('현재 재고 · 안전 재고 안내',
  q('#form-desc').textContent === '현재 재고 9개 · 안전 재고 10개', q('#form-desc').textContent);
check('입고 수량 입력', q('[data-key="add"]') !== null);
q('[data-key="add"]').value = '0';
submit(q('#form-modal-form'));
check('0개 차단', q('#form-error').classList.contains('show'), q('#form-error').textContent);
q('[data-key="add"]').value = '25';
submit(q('#form-modal-form'));
check('재고 증가 9 -> 34', qtyOf('돈까스') === 34, String(qtyOf('돈까스')));
check('등급도 충분으로 상승', lvOf('돈까스') === '충분');
check('입고 토스트', toastText().includes('돈까스 25개 입고'), toastText());
check('부족 0건으로 갱신', chipCount('부족') === 0);
check('안내 문구 갱신', txt(q('#stock-note')) === '입고 필요 — 메뉴 1건 · 재료 5건',
  txt(q('#stock-note')));

console.log('\n[7] 매점 관리와 같은 재고를 본다');
click(openDetail('에너지드링크'));
q('[data-key="add"]').value = '30';
submit(q('#form-modal-form'));
check('품절 해제', lvOf('에너지드링크') === '충분' && qtyOf('에너지드링크') === 30,
  lvOf('에너지드링크') + ' / ' + qtyOf('에너지드링크'));

click(nav('매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));
const card = qa('#menu-grid .prod').find(c => txt(c.querySelector('.prod-name')) === '에너지드링크');
check('매점 카드 품절 배지 사라짐', card.querySelector('.badge') === null,
  card.querySelector('.badge') ? txt(card.querySelector('.badge')) : '');
check('매점에서 담기 가능해짐', card.hasAttribute('data-pick') && !card.classList.contains('off'));
click(card);
check('실제로 담김', qa('#order-items .order-line').length === 1);

// 주문을 넣으면 재고가 줄고, 재고 화면에도 반영돼야 한다
click(q('#btn-place'));
click(sub('재고 관리'));
check('판매분이 재고에 반영 30 -> 29', qtyOf('에너지드링크') === 29, String(qtyOf('에너지드링크')));

console.log('\n[8] 회귀');
click(nav('대시보드'));
check('대시보드 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);
click(nav('회원 관리'));
check('회원 관리 정상', qa('#member-body tr[data-member]').length === 30);
click(nav('매출·정산 관리'));
q('#pin-input').value = '1234';
submit(q('#pin-form'));
check('매출 관리 정상', q('#page-sales').style.display === 'block' && qa('#sales-kpi .kpi').length === 4);
click(nav('요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
