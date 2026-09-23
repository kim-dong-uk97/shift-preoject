import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

// 저장소 안의 admin 폴더 (이 파일 기준 상대 경로)
const ROOT = fileURLToPath(new URL('../admin', import.meta.url));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
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
function unlock() {
  if (!q('#pin-modal').classList.contains('open')) return;
  q('#pin-input').value = '1234';
  submit(q('#pin-form'));
}
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);
const lines = () => qa('#order-items .order-line');

const WITH_PHOTO = ['라면', '치즈라면', '라볶이', '김치볶음밥', '제육덮밥', '공기밥',
                    '치킨텐더', '감자튀김', '돈까스', '콜라', '아메리카노', '에너지드링크',
                    '아이스크림', '와플'];

click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));
click(qa('.sub-item').find(b => b.dataset.title === '상품 관리'));

console.log('\n[1] 사진 연결');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('사진 14장 연결', qa('#menu-grid .menu-thumb img').length === 14,
  qa('#menu-grid .menu-thumb img').length + '장');
WITH_PHOTO.forEach(n => {
  const c = cardOf(n);
  check(n + ' 사진', !!c && !!c.querySelector('.menu-thumb img'), c ? '카드는 있음' : '카드 없음');
});

console.log('\n[2] 파일이 실제로 존재');
const missing = qa('#menu-grid .menu-thumb img')
  .map(i => i.getAttribute('src'))
  .filter(src => !fs.existsSync(path.join(ROOT, src)));
check('모든 src 파일 존재', missing.length === 0, missing.join(', '));
check('경로가 menu/ 아래', qa('#menu-grid .menu-thumb img').every(i => i.getAttribute('src').startsWith('menu/')));
check('ASCII 파일명', qa('#menu-grid .menu-thumb img').every(i => /^[\x20-\x7e]+$/.test(i.getAttribute('src'))),
  qa('#menu-grid .menu-thumb img').map(i => i.getAttribute('src')).find(s => !/^[\x20-\x7e]+$/.test(s)) || '');
check('사진 중복 없음',
  new Set(qa('#menu-grid .menu-thumb img').map(i => i.getAttribute('src'))).size === 14);

console.log('\n[3] 접근성 · 로딩');
check('alt 에 메뉴명', WITH_PHOTO.every(n => cardOf(n).querySelector('img').getAttribute('alt') === n),
  WITH_PHOTO.find(n => cardOf(n).querySelector('img').getAttribute('alt') !== n) || '');
check('lazy 로딩', qa('#menu-grid .menu-thumb img').every(i => i.getAttribute('loading') === 'lazy'));
check('has-img 클래스', WITH_PHOTO.every(n => cardOf(n).querySelector('.menu-thumb').classList.contains('has-img')));
check('사진 칸 잘림 처리', /\.menu-thumb \{[^}]*overflow: hidden/s.test(html));
check('꽉 채우기(object-fit)', /object-fit: cover/.test(html));

console.log('\n[4] 아이콘 대체는 사진 없는 메뉴에만 (지금은 전 메뉴가 사진)');
check('아이콘 대체 카드 없음', qa('#menu-grid .menu-thumb svg').length === 0);
check('인라인 배경색 남지 않음', cards().every(c =>
  !/background:#/.test(c.querySelector('.menu-thumb').getAttribute('style') || '')));

console.log('\n[5] 떡볶이 -> 라볶이 이름 변경');
check('라볶이 존재', cardOf('라볶이') !== undefined);
check('떡볶이 없음', cardOf('떡볶이') === undefined);
check('메뉴 수 14개 유지', cards().length === 14, cards().length + '개');
check('신라면 -> 라면', cardOf('라면') !== undefined && cardOf('신라면') === undefined);

console.log('\n[6] 수량 배지 · 주문서 썸네일');
click(cardOf('김치볶음밥'));
const badge = cardOf('김치볶음밥').querySelector('.menu-qty');
check('사진 위에 수량 배지', badge !== null && txt(badge) === '1');
check('배지와 사진 공존', cardOf('김치볶음밥').querySelector('.menu-thumb img') !== null);
click(cardOf('김치볶음밥'));
check('배지 갱신', txt(cardOf('김치볶음밥').querySelector('.menu-qty')) === '2');

check('주문서 줄에도 사진', lines()[0].querySelector('.thumb img') !== null);
check('주문서 썸네일 has-img', lines()[0].querySelector('.thumb').classList.contains('has-img'));
check('주문서 썸네일 잘림 처리', /\.order-line \.thumb \{[^}]*overflow: hidden/s.test(html));

click(cardOf('치즈라면'));
const line2 = lines().find(l => txt(l.querySelector('.nm')) === '치즈라면');
check('추가된 사진도 주문서에 반영',
  line2.querySelector('.thumb img') !== null && line2.querySelector('.thumb svg') === null);

console.log('\n[7] 회귀');
check('강조 배지 유지', cardOf('라면').querySelector('.promo-best') !== null);
check('수량 칩 유지', lines().every(l => l.querySelector('.stepper')));
click(q('#btn-place'));
check('주문 넣기 동작', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
check('사진 유지', cardOf('라면').querySelector('.menu-thumb img') !== null);
check('수정 버튼 상시 노출', cardOf('라면').querySelector('[data-edit]') !== null);
click(q('#menu-grid .prod-add'));
unlock();
q('[data-key="name"]').value = '만두';
q('[data-key="price"]').value = '4500';
q('[data-key="stock"]').value = '20';
q('[data-key="cook"]').value = '6';
submit(q('#form-modal-form'));
check('새 메뉴는 아이콘으로 시작',
  cardOf('만두') !== undefined && cardOf('만두').querySelector('.menu-thumb svg') !== null);

click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
