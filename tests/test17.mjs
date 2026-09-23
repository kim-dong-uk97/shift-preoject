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
const cards = () => qa('#menu-grid .prod');
const cardOf = n => cards().find(c => c.querySelector('.prod-name').textContent === n);

click(qa('.nav-item').find(b => b.dataset.title === '매점 관리'));

console.log('\n[1] 나머지 3개 사진');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
[['치즈라면', 'menu/cheese-ramyeon.png'],
 ['에너지드링크', 'menu/energy-drink.png'],
 ['와플', 'menu/waffle.png']].forEach(([name, src]) => {
  const img = cardOf(name).querySelector('.menu-thumb img');
  check(name + ' 사진 연결', !!img && img.getAttribute('src') === src, img ? img.getAttribute('src') : '없음');
  check(name + ' 파일 존재', fs.existsSync(path.join(ROOT, src)));
  check(name + ' alt', !!img && img.getAttribute('alt') === name);
});

console.log('\n[2] 전 메뉴가 사진 보유');
check('메뉴 14개 전부 사진', qa('#menu-grid .menu-thumb img').length === 14,
  qa('#menu-grid .menu-thumb img').length + '장');
check('아이콘 대체 카드 없음', qa('#menu-grid .menu-thumb svg').length === 0);
check('모든 썸네일 has-img', cards().every(c => c.querySelector('.menu-thumb').classList.contains('has-img')));
const srcs = qa('#menu-grid .menu-thumb img').map(i => i.getAttribute('src'));
check('사진 중복 없음', new Set(srcs).size === 14);
check('모든 파일 존재', srcs.every(s => fs.existsSync(path.join(ROOT, s))),
  srcs.find(s => !fs.existsSync(path.join(ROOT, s))) || '');

console.log('\n[3] 배지 축소');
const promo = ruleOf('.promo');
check('강조 배지 글자 9.5px', px(promo, 'font-size') === 9.5, promo);
check('강조 배지 여백 작게', promo && promo.includes('padding: 1px 6px'), promo);
check('배지 간격 축소', (ruleOf('.menu-tags') || '').includes('gap: 4px'), ruleOf('.menu-tags'));
const qty = ruleOf('.menu-qty');
check('수량 배지 19px', qty && qty.includes('min-width: 19px') && qty.includes('height: 19px'), qty);
check('수량 배지 글자 11px', px(qty, 'font-size') === 11, qty);
const cardBadge = ruleOf('#menu-grid .badge');
check('품절/판매중지 배지 축소', cardBadge && px(cardBadge, 'font-size') === 10.5, cardBadge);
check('요금 관리 배지는 그대로', px(ruleOf('.badge'), 'font-size') === 11.5, ruleOf('.badge'));

console.log('\n[4] 배지 내용은 유지');
check('BEST 배지', txt(cardOf('라면').querySelector('.promo')) === 'BEST');
check('NEW 배지', txt(cardOf('김치볶음밥').querySelector('.promo')) === 'NEW');
check('품절 배지 표시', txt(cardOf('에너지드링크')).includes('품절'), txt(cardOf('에너지드링크')));
check('판매 중지 배지 표시', txt(cardOf('와플')).includes('판매 중지'), txt(cardOf('와플')));
check('품절이어도 사진은 나옴', cardOf('에너지드링크').querySelector('.menu-thumb img') !== null);
check('판매 중지도 사진은 나옴', cardOf('와플').querySelector('.menu-thumb img') !== null);
check('품절 카드 흐림 유지', cardOf('에너지드링크').classList.contains('off'));

console.log('\n[5] 동작 회귀');
click(cardOf('치즈라면'));
check('치즈라면 담김', qa('#order-items .order-line').length === 1);
check('수량 배지 표시', txt(cardOf('치즈라면').querySelector('.menu-qty')) === '1');
check('주문서에도 사진', q('#order-items .order-line .thumb img') !== null);
click(cardOf('에너지드링크'));
check('품절은 여전히 안 담김', qa('#order-items .order-line').length === 1);
click(cardOf('와플'));
check('판매 중지도 안 담김', qa('#order-items .order-line').length === 1);
click(q('#btn-place'));
check('주문 넣기 동작', txt(q('#order-items')).includes('담은 메뉴가 없습니다'));
check('칩 6개 유지', qa('#store-cats .chip-btn').length === 6);
click(qa('.nav-item').find(b => b.dataset.title === '요금 관리'));
check('요금 관리 배지 정상', qa('#pass-grid .badge').length > 0);
click(qa('.nav-item').find(b => b.dataset.title === '대시보드'));
check('홈 정상', qa('#dashboard .kpi-grid.tiles > .kpi').length === 4);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
