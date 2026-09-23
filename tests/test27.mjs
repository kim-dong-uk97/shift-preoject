// 모달이 열렸을 때 페이지 요소가 배경 위로 뚫고 올라오지 않는지 확인한다.
// (jsdom 은 그리지 않으므로 z-index 선언값으로 층 순서를 검사한다)
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

const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const submit = el => el.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));

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
const zOf = sel => {
  const m = (ruleOf(sel) || '').match(/z-index: (\d+)/);
  return m ? Number(m[1]) : null;
};
const nav = t => qa('.nav-item').find(b => b.dataset.title === t);

console.log('\n[1] 층 순서');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
const backdrop = zOf('.modal-backdrop');
const stickyHead = zOf('.tbl thead th');
const toast = zOf('.toast-wrap');
const badge = zOf('.size-badge');
const secure = zOf('.secure-overlay');

check('모달 배경에 z-index 지정', backdrop !== null, String(backdrop));
check('고정 머리글보다 위', backdrop > stickyHead, backdrop + ' vs ' + stickyHead);
check('잠금 오버레이보다 위', backdrop > secure, backdrop + ' vs ' + secure);
check('임시 크기 배지보다 위', backdrop > badge, backdrop + ' vs ' + badge);
check('토스트보다는 아래', backdrop < toast, backdrop + ' vs ' + toast);

console.log('\n[2] z-index 를 쓰는 요소가 전부 배경 아래인지');
const zRules = [...html.matchAll(/([^{}\n][^{}]*)\{[^}]*z-index:\s*(\d+)/g)]
  .map(m => ({ sel: m[1].trim().split('\n').pop().trim(), z: Number(m[2]) }))
  .filter(r => r.z >= backdrop && !/modal-backdrop|toast-wrap/.test(r.sel));
check('배경보다 높은 요소는 토스트뿐', zRules.length === 0,
  zRules.map(r => r.sel + '(' + r.z + ')').join(', '));

console.log('\n[3] 실제로 모달이 열리는 화면들');
click(nav('회원 관리'));
check('회원 목록에 고정 머리글', q('#page-members thead th') !== null);
click(q('#btn-member-filter'));
check('회원 필터링 모달 열림', q('#form-modal').classList.contains('open'));
check('모달이 배경 클래스를 가짐', q('#form-modal').classList.contains('modal-backdrop'));
click(q('#form-cancel'));

click(nav('매출·정산 관리'));
check('매출은 PIN 모달', q('#pin-modal').classList.contains('open'));
check('PIN 도 같은 배경 클래스', q('#pin-modal').classList.contains('modal-backdrop'));
q('#pin-input').value = '1234';
submit(q('#pin-form'));
click(q('.tab[data-stab="pay"]'));
check('결제 내역도 고정 머리글', q('#sales-pay thead th') !== null);

click(nav('대시보드'));
click(q('#seat-map .seat'));
check('좌석 상세도 같은 배경', q('#seat-modal').classList.contains('modal-backdrop'));
click(q('#sd-close'));

const backdrops = qa('.modal-backdrop').length;
check('모든 모달이 같은 배경 규칙을 씀', backdrops >= 5, backdrops + '개');

console.log('\n[4] 회귀');
click(nav('회원 관리'));
check('회원 목록 정상', qa('#member-body tr[data-member]').length === 30);
click(nav('요금 관리'));
check('요금 관리 정상', qa('#pass-grid .prod').length === 5);

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
