// 회원 관리 "모든 상태" 드롭다운 — 직접 그린 목록의 모양과 동작.
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
const key = (el, k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));
const txt = el => el.textContent.replace(/\s+/g, ' ').trim();

function ruleOf(sel) {
  const re = new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '\\s*\\{([^}]*)\\}');
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

const field = () => q('#member-status-field');
const menu = () => q('#member-status-menu');
const items = () => [...menu().children];
const label = () => txt(q('#member-status-label'));
const isOpen = () => field().classList.contains('open');
const rows = () => qa('#member-body tr[data-member]');

click(qa('.nav-item').find(b => b.dataset.title === '회원 관리'));

console.log('\n[1] 구성');
check('런타임 에러 없음', errors.length === 0, errors.join('; '));
check('도구줄은 여전히 3칸', q('#page-members .toolbar').children.length === 3);
check('상태 칸이 껍데기 그대로', field().classList.contains('tb') && field().classList.contains('tb-select'));
check('select 는 값만 들고 있음', q('#member-status').parentElement === field());
check('기본 목록은 감춤', /\.tb-select select \{[^}]*display: none/.test(html));
check('직접 그린 목록 자리', menu() !== null && menu().parentElement === field());
check('보이는 값 글자', label() === '모든 상태', label());
check('처음엔 닫혀 있음', !isOpen());
check('aria-expanded=false', field().getAttribute('aria-expanded') === 'false');
check('키보드로도 닿음', field().getAttribute('tabindex') === '0');
check('역할 표기', field().getAttribute('role') === 'combobox' && menu().getAttribute('role') === 'listbox');

console.log('\n[2] 모양 — 여백과 둥근 모서리');
const m = ruleOf('.tb-menu');
check('.tb-menu 규칙', m !== null);
check('알약 아래로 8px 띄움', /top: calc\(100% \+ 8px\)/.test(m), m);
check('안쪽 여백', /padding: 6px/.test(m), m);
check('둥근 모서리', /border-radius: 14px/.test(m), m);
check('껍데기와 같은 테두리', /border: 1px solid var\(--border\)/.test(m), m);
check('흰 바탕', /background: #fff/.test(m));
check('떠 보이게 그림자', /box-shadow:/.test(m));
check('알약보다 좁아지지 않음', /min-width: 100%/.test(m), m);
check('모달보다는 아래', /z-index: 20/.test(m), m);
check('스르륵 열림', /transition:[^;]*opacity 0\.14s/.test(m) && /transform 0\.2s/.test(m), m);
check('닫히면 초점도 안 감', /visibility: hidden/.test(m));

const mi = ruleOf('.tb-menu-item');
check('항목도 둥글게', /border-radius: 10px/.test(mi), mi);
check('항목 여백', /padding: 9px 12px/.test(mi), mi);
check('항목 사이 간격', /margin-top: 2px/.test(ruleOf('.tb-menu-item + .tb-menu-item')),
  ruleOf('.tb-menu-item + .tb-menu-item'));
check('껍데기와 같은 글자 크기', /font-size: 13px/.test(mi) && /font-weight: 600/.test(mi), mi);
check('호버 표시', /background: var\(--accent-soft\)/.test(ruleOf('.tb-menu-item:hover')));
check('고른 항목 강조', /var\(--point-soft\)/.test(ruleOf('.tb-menu-item.sel')));
check('체크 자리는 늘 확보', /opacity: 0/.test(ruleOf('.tb-menu-check')));
check('열리면 화살표 뒤집힘', /rotate\(180deg\)/.test(ruleOf('.tb-select.open > svg')));
check('열린 동안 흰 바탕', /background: #fff/.test(ruleOf('.tb-select.open')));
check('모션 줄이기 반영', /\.tb-menu, \.tb-select\.open \.tb-menu/.test(html));

console.log('\n[3] 열고 닫기');
click(field());
check('열림', isOpen());
check('aria-expanded=true', field().getAttribute('aria-expanded') === 'true');
check('항목 5개', items().length === 5, items().length + '개');
check('항목 글자', items().map(b => txt(b)).join(',') === '모든 상태,이용 중,최근 방문,일반,휴면',
  items().map(b => txt(b)).join(','));
check('현재 값에 표시', items()[0].classList.contains('sel'));
check('aria-selected 도 맞춤',
  items().map(b => b.getAttribute('aria-selected')).join(',') === 'true,false,false,false,false');
check('항목마다 체크 아이콘 자리', items().every(b => b.querySelector('.tb-menu-check')));

click(field());
check('다시 누르면 닫힘', !isOpen());

click(field());
key(field(), 'Escape');
check('Esc 로 닫힘', !isOpen());

click(field());
click(doc.body);
check('바깥을 누르면 닫힘', !isOpen());

console.log('\n[4] 고르기');
const before = rows().length;
click(field());
click(items().find(b => b.dataset.value === 'rest'));
check('고르면 닫힘', !isOpen());
check('보이는 글자 바뀜', label() === '휴면', label());
check('select 값도 바뀜', q('#member-status').value === 'rest');
check('목록이 실제로 걸러짐', rows().every(r => txt(r.querySelector('.st')) === '휴면'));
check('전체보다 적음', rows().length < before, rows().length + ' / ' + before);

click(field());
check('체크가 휴면으로 옮겨감',
  items().findIndex(b => b.classList.contains('sel')) === 4,
  String(items().findIndex(b => b.classList.contains('sel'))));
click(items()[0]);
check('모든 상태로 복귀', label() === '모든 상태' && rows().length === before);

console.log('\n[5] 값을 코드로 바꿔도 따라온다');
q('#member-status').value = 'live';
q('#member-status').dispatchEvent(new window.Event('change', { bubbles: true }));
check('글자 동기화', label() === '이용 중', label());
check('걸러내기도 동작', rows().every(r => txt(r.querySelector('.st')) === '이용 중'));
q('#member-status').value = 'all';
q('#member-status').dispatchEvent(new window.Event('change', { bubbles: true }));
check('되돌리기', label() === '모든 상태' && rows().length === before);

console.log('\n[6] 키보드');
key(field(), 'ArrowDown');
check('아래 화살표로 열림', isOpen());
check('고른 항목에 초점', doc.activeElement === items()[0], doc.activeElement && doc.activeElement.className);
key(doc.activeElement, 'ArrowDown');
check('다음 항목으로', doc.activeElement === items()[1]);
key(doc.activeElement, 'ArrowUp');
check('이전 항목으로', doc.activeElement === items()[0]);
key(doc.activeElement, 'ArrowUp');
check('처음에서 위로 가면 끝으로', doc.activeElement === items()[4]);
click(doc.activeElement);
check('Enter 대신 클릭으로 선택', label() === '휴면' && !isOpen());
q('#member-status').value = 'all';
q('#member-status').dispatchEvent(new window.Event('change', { bubbles: true }));

console.log('\n[7] 회귀');
q('#member-search').value = '김';
q('#member-search').dispatchEvent(new window.Event('input', { bubbles: true }));
check('검색은 그대로', rows().every(r => txt(r.children[0]).startsWith('김')));
q('#member-search').value = '';
q('#member-search').dispatchEvent(new window.Event('input', { bubbles: true }));
click(q('#btn-member-filter'));
check('필터 창도 그대로', q('#form-modal').classList.contains('open'));
check('필터 창이 목록 위로', !isOpen());

console.log('\n런타임 에러: ' + (errors.length ? errors.join(' | ') : '없음'));
console.log('\n========== ' + pass + ' passed, ' + fail + ' failed ==========');
process.exit(fail ? 1 : 0);
